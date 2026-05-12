import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    KeyList,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    TransferTransaction,
    ScheduleSignTransaction,
    ScheduleInfoQuery,
    TransactionReceiptQuery,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How identical scheduled transactions submitted by different parties are
 * merged into a single schedule.
 *
 * Three sub-accounts each act as a separate party. Each submits the same
 * scheduled transfer. The first submission creates the schedule; the next
 * two return Status.IDENTICAL_SCHEDULE_ALREADY_CREATED with the same
 * scheduleId, and then add their signatures via ScheduleSignTransaction.
 * The schedule executes automatically when 2-of-3 signatures accumulate.
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

    console.log("Schedule Identical Transaction Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: Generate 3 ECDSA key pairs and create 3 sub-accounts with 1 ℏ
    // each, each backed by its own Client (simulating 3 separate parties).
    console.log("Generating 3 ECDSA key pairs and creating 3 sub-accounts...");
    /** @type {PrivateKey[]} */
    const keys = [
        PrivateKey.generateECDSA(),
        PrivateKey.generateECDSA(),
        PrivateKey.generateECDSA(),
    ];
    /** @type {AccountId[]} */
    const accountIds = [];
    /** @type {Client[]} */
    const subClients = [];
    for (let i = 0; i < 3; i++) {
        const accountId = (
            await (
                await new AccountCreateTransaction()
                    .setKeyWithoutAlias(keys[i].publicKey)
                    .setInitialBalance(new Hbar(1))
                    .execute(client)
            ).getReceipt(client)
        ).accountId;
        accountIds.push(accountId);

        const subClient = Client.forName(
            process.env.HEDERA_NETWORK,
        ).setOperator(accountId, keys[i]);
        subClients.push(subClient);

        console.log(`  Sub-account ${String(i + 1)}: ${accountId.toString()}`);
    }

    // Step 2: Build a 2-of-3 threshold KeyList from the 3 public keys.
    console.log("Building a 2-of-3 threshold KeyList...");
    const thresholdKey = new KeyList(
        keys.map((k) => k.publicKey),
        2,
    );

    // Step 3: Create the "threshold account" with the KeyList as its key
    // and 10 ℏ initial balance — this is the source of the scheduled transfer.
    console.log("Creating threshold account with 10 ℏ initial balance...");
    const thresholdAccountId = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(thresholdKey)
                .setInitialBalance(new Hbar(10))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    console.log(`Threshold account: ${thresholdAccountId.toString()}`);

    // Step 4: Each sub-client submits the SAME ScheduleCreateTransaction.
    // First creates the schedule. Subsequent identical submissions return
    // IDENTICAL_SCHEDULE_ALREADY_CREATED with the same scheduleId. After
    // detecting identical, each sub-client adds its signature via
    // ScheduleSignTransaction. The schedule executes automatically when the
    // 2-of-3 threshold is reached.
    /** @type {import("@hiero-ledger/sdk").ScheduleId} */
    let scheduleId;
    for (let i = 0; i < 3; i++) {
        console.log(
            `Sub-client ${String(i + 1)} submitting identical ScheduleCreate...`,
        );

        const transferTx = new TransferTransaction()
            .addHbarTransfer(thresholdAccountId, new Hbar(3).negated())
            .addHbarTransfer(accountIds[0], new Hbar(1))
            .addHbarTransfer(accountIds[1], new Hbar(1))
            .addHbarTransfer(accountIds[2], new Hbar(1));

        const createResponse = await transferTx
            .schedule()
            .setPayerAccountId(thresholdAccountId)
            .freezeWith(subClients[i])
            .execute(subClients[i]);

        // Disable status validation so we can read receipts with the
        // IDENTICAL_SCHEDULE_ALREADY_CREATED status without throwing.
        const createReceipt = await new TransactionReceiptQuery()
            .setTransactionId(createResponse.transactionId)
            .setValidateStatus(false)
            .execute(subClients[i]);

        if (i === 0) {
            scheduleId = createReceipt.scheduleId;
            console.log(`  Schedule created with ID: ${scheduleId.toString()}`);
        } else {
            if (createReceipt.scheduleId.toString() !== scheduleId.toString()) {
                throw new Error(
                    `Schedule ID mismatch! Expected ${scheduleId.toString()}, got ${createReceipt.scheduleId.toString()}`,
                );
            }
            console.log(
                `  Status: ${createReceipt.status.toString()}, scheduleId: ${createReceipt.scheduleId.toString()}`,
            );

            // Add this sub-client's signature to the existing schedule.
            const signResponse = await new ScheduleSignTransaction()
                .setScheduleId(scheduleId)
                .freezeWith(subClients[i])
                .execute(subClients[i]);
            const signReceipt = await new TransactionReceiptQuery()
                .setTransactionId(signResponse.transactionId)
                .setValidateStatus(false)
                .execute(subClients[i]);
            console.log(
                `  ScheduleSign status: ${signReceipt.status.toString()}`,
            );
        }
    }

    // Step 5: Query the schedule's final state. After 2 of the 3 sub-clients
    // signed, the threshold was reached and the transfer executed.
    const info = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    console.log(
        `Final ScheduleInfo: ${JSON.stringify(
            {
                scheduleId: info.scheduleId.toString(),
                creatorAccountId: info.creatorAccountId?.toString(),
                payerAccountId: info.payerAccountId?.toString(),
                executed: info.executed?.toString() ?? "not yet",
                signerCount: info.signers?._keys?.length ?? 0,
            },
            null,
            2,
        )}`,
    );

    // Cleanup: delete the threshold account (requires 2-of-3 from threshold keys).
    const deleteThresholdTx = new AccountDeleteTransaction()
        .setAccountId(thresholdAccountId)
        .setTransferAccountId(operatorId)
        .freezeWith(client);
    let signedDelete = await deleteThresholdTx.sign(keys[0]);
    signedDelete = await signedDelete.sign(keys[1]);
    await (await signedDelete.execute(client)).getReceipt(client);

    // Cleanup: delete each sub-account, signing with its own key.
    for (let i = 0; i < 3; i++) {
        const signedSubDelete = await new AccountDeleteTransaction()
            .setAccountId(accountIds[i])
            .setTransferAccountId(operatorId)
            .freezeWith(client)
            .sign(keys[i]);
        await (await signedSubDelete.execute(client)).getReceipt(client);
        subClients[i].close();
    }

    client.close();
    console.log("Schedule Identical Transaction Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
