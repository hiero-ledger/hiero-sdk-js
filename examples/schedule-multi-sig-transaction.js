import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    KeyList,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    TransferTransaction,
    ScheduleInfoQuery,
    ScheduleSignTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to schedule a transaction with a multi-sig account.
 *
 * Creates an account with a 3-key KeyList, schedules a transfer pre-signed
 * by one of the three keys, then later adds a second signature via
 * ScheduleSignTransaction. The schedule never executes (3-of-3 KeyList only
 * has 2 sigs) — the example demonstrates the progressive-signing pattern,
 * not full execution.
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

    console.log("Scheduled Transaction Multi-Sig Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const operatorPublicKey = operatorKey.publicKey;
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: generate three ED25519 private keys.
    console.log("Generating ED25519 private keys...");
    const privateKey1 = PrivateKey.generateED25519();
    const privateKey2 = PrivateKey.generateED25519();
    const privateKey3 = PrivateKey.generateED25519();

    // Step 2: build a KeyList from the three public keys.
    // No threshold → default is "all keys required".
    console.log("Creating a Key List...");
    const keyList = new KeyList([
        privateKey1.publicKey,
        privateKey2.publicKey,
        privateKey3.publicKey,
    ]);
    console.log(`Created a Key List: ${keyList.toString()}`);

    // Step 3: create a new account with the KeyList as its key.
    console.log("Creating new account...");
    const accountCreateResponse = await new AccountCreateTransaction()
        .setKeyWithoutAlias(keyList)
        .setInitialBalance(new Hbar(2))
        .execute(client);
    const accountId = (await accountCreateResponse.getReceipt(client))
        .accountId;
    console.log(`Created new account with ID: ${accountId.toString()}`);

    // Step 4: build a transfer, schedule it, pre-sign with privateKey2.
    console.log("Creating a token transfer transaction...");
    const transferTx = new TransferTransaction()
        .addHbarTransfer(accountId, new Hbar(1).negated())
        .addHbarTransfer(operatorId, new Hbar(1));

    console.log("Scheduling the token transfer transaction...");
    const frozenSchedule = transferTx
        .schedule()
        .setPayerAccountId(operatorId)
        .setAdminKey(operatorPublicKey)
        .freezeWith(client);
    const signedSchedule = await frozenSchedule.sign(privateKey2);

    const scheduleResponse = await signedSchedule.execute(client);
    const scheduleId = (await scheduleResponse.getReceipt(client)).scheduleId;
    console.log(`Schedule ID: ${scheduleId.toString()}`);

    // Step 5: query schedule info (should now have 1 signature from privateKey2).
    const infoBefore = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    console.log(
        `Schedule info (before last signature): ${JSON.stringify(
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

    // Step 6: send a ScheduleSignTransaction signed with privateKey3.
    // This is the 2nd of the 3 required signatures (privateKey1 is never
    // added — the schedule needs all 3 for the transfer to execute, so it
    // remains pending.
    console.log(
        "Appending private key #3 signature to a schedule transaction...",
    );
    const signFrozen = new ScheduleSignTransaction()
        .setScheduleId(scheduleId)
        .freezeWith(client);
    const signSigned = await signFrozen.sign(privateKey3);
    const signReceipt = await (
        await signSigned.execute(client)
    ).getReceipt(client);
    console.log(
        `A transaction that appends signature to a schedule transaction (private key #3) was complete with status: ${signReceipt.status.toString()}`,
    );

    // Step 7: query schedule info again (should now have 2 signatures).
    const infoAfter = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    console.log(
        `Schedule info (after second signature): ${JSON.stringify(
            {
                scheduleId: infoAfter.scheduleId.toString(),
                executed: infoAfter.executed?.toString() ?? "not yet",
                signerCount: infoAfter.signers?._keys?.length ?? 0,
            },
            null,
            2,
        )}`,
    );

    // Cleanup: delete the account. Requires all 3 keys to sign.
    const deleteFrozen = new AccountDeleteTransaction()
        .setAccountId(accountId)
        .setTransferAccountId(operatorId)
        .freezeWith(client);
    let signedDelete = await deleteFrozen.sign(privateKey1);
    signedDelete = await signedDelete.sign(privateKey2);
    signedDelete = await signedDelete.sign(privateKey3);
    await signedDelete.execute(client);

    client.close();
    console.log("Scheduled Transaction Multi-Sig Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
