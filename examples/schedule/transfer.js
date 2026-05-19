import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    AccountBalanceQuery,
    TransferTransaction,
    ScheduleSignTransaction,
    ScheduleInfoQuery,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to schedule a transfer transaction that requires a second party's
 * signature before executing.
 *
 * Bob's account has `receiverSignatureRequired = true`. Alice (the operator)
 * proposes a transfer to Bob via a scheduled transaction. Bob's balance is
 * unchanged until he signs the schedule using ScheduleSignTransaction, at
 * which point the transfer executes automatically. The 30-minute schedule
 * expiration window applies if Bob does not sign in time.
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
    }

    console.log("Scheduled Transfer Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: Generate Bob's ECDSA key pair.
    console.log("Generating Bob's ECDSA key pair...");
    const bobKey = PrivateKey.generateECDSA();
    const bobPublicKey = bobKey.publicKey;

    // Step 2: Create Bob's account with receiverSignatureRequired=true.
    // Because receiver-sig is required, the account creation transaction
    // itself must also be signed with Bob's key.
    console.log("Creating Bob's account (receiverSignatureRequired=true)...");
    const bobCreateTx = await new AccountCreateTransaction()
        .setReceiverSignatureRequired(true)
        .setKeyWithoutAlias(bobPublicKey)
        .setInitialBalance(new Hbar(1))
        .freezeWith(client)
        .sign(bobKey);
    const bobAccountId = (
        await (await bobCreateTx.execute(client)).getReceipt(client)
    ).accountId;
    console.log(`Bob's account: ${bobAccountId.toString()}`);

    // Step 3: Read Bob's initial balance for the before/after comparison.
    const balanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(bobAccountId)
            .execute(client)
    ).hbars;
    console.log(`Bob's balance before schedule: ${balanceBefore.toString()}`);

    // Step 4: Alice builds the transfer and wraps it in a scheduled tx.
    // No Bob signature is added yet — the schedule will sit pending.
    console.log("Alice scheduling a 1 ℏ transfer to Bob...");
    const transferTx = new TransferTransaction()
        .addHbarTransfer(operatorId, new Hbar(1).negated())
        .addHbarTransfer(bobAccountId, new Hbar(1));

    const scheduleResponse = await transferTx
        .schedule()
        .setPayerAccountId(operatorId)
        .execute(client);
    const scheduleId = (await scheduleResponse.getReceipt(client)).scheduleId;
    console.log(`Schedule ID: ${scheduleId.toString()}`);

    // Step 5: Confirm Bob's balance hasn't changed — the schedule is pending
    // because Bob's signature is still missing.
    const balancePending = (
        await new AccountBalanceQuery()
            .setAccountId(bobAccountId)
            .execute(client)
    ).hbars;
    console.log(
        `Bob's balance while schedule pending: ${balancePending.toString()}`,
    );
    if (
        balancePending.toTinybars().toString() !==
        balanceBefore.toTinybars().toString()
    ) {
        throw new Error(
            "Expected Bob's balance to be unchanged while the schedule is pending.",
        );
    }

    // Step 6: Inspect the schedule. The inner scheduled transaction should
    // be a TransferTransaction.
    const infoBefore = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    const scheduledTx = infoBefore.scheduledTransaction;
    if (!(scheduledTx instanceof TransferTransaction)) {
        throw new Error(
            `Expected scheduled transaction to be a TransferTransaction; got ${scheduledTx.constructor.name}`,
        );
    }
    console.log(
        `ScheduleInfo before Bob signs: ${JSON.stringify(
            {
                scheduleId: infoBefore.scheduleId.toString(),
                creatorAccountId: infoBefore.creatorAccountId?.toString(),
                payerAccountId: infoBefore.payerAccountId?.toString(),
                executed: infoBefore.executed?.toString() ?? "not yet",
                signerCount: infoBefore.signers?._keys?.length ?? 0,
            },
            null,
            2,
        )}`,
    );

    // Step 7: Bob signs the schedule via ScheduleSignTransaction. Once Bob's
    // signature is added, the schedule executes automatically (Alice's
    // signature was already attached at creation time).
    console.log("Bob signing the schedule...");
    const bobSignTx = await new ScheduleSignTransaction()
        .setScheduleId(scheduleId)
        .freezeWith(client)
        .sign(bobKey);
    await (await bobSignTx.execute(client)).getReceipt(client);

    // Step 8: Confirm Bob's balance now reflects the transfer.
    const balanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(bobAccountId)
            .execute(client)
    ).hbars;
    console.log(`Bob's balance after Bob signs: ${balanceAfter.toString()}`);

    // Step 9: ScheduleInfo should now show an `executed` timestamp.
    const infoAfter = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    console.log(
        `ScheduleInfo after Bob signs: ${JSON.stringify(
            {
                scheduleId: infoAfter.scheduleId.toString(),
                executed: infoAfter.executed?.toString() ?? "not yet",
                signerCount: infoAfter.signers?._keys?.length ?? 0,
            },
            null,
            2,
        )}`,
    );
    if (infoAfter.executed == null) {
        throw new Error(
            "Expected the schedule to have executed after Bob's signature.",
        );
    }

    // Cleanup: delete Bob's account.
    const bobDelete = await new AccountDeleteTransaction()
        .setAccountId(bobAccountId)
        .setTransferAccountId(operatorId)
        .freezeWith(client)
        .sign(bobKey);
    await (await bobDelete.execute(client)).getReceipt(client);

    client.close();
    console.log("Scheduled Transfer Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
