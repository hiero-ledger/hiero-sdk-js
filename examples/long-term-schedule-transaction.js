import {
    Client,
    AccountCreateTransaction,
    Hbar,
    PrivateKey,
    KeyList,
    TransferTransaction,
    ScheduleSignTransaction,
    ScheduleInfoQuery,
    AccountBalanceQuery,
    AccountUpdateTransaction,
    Timestamp,
} from "@hashgraph/sdk";

import dotenv from "dotenv";
dotenv.config();

async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    console.log("Long Term Scheduled Transaction Example Start!");

    // Step 0: Create and configure the SDK Client.
    const operatorId = process.env.OPERATOR_ID;
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK || "testnet");
    client.setOperator(operatorId, operatorKey);

    // Step 1: Create key pairs
    const privateKey1 = PrivateKey.generateECDSA();
    const privateKey2 = PrivateKey.generateECDSA();
    const thresholdKey = new KeyList([
        privateKey1.publicKey,
        privateKey2.publicKey,
    ]);
    console.log("Created a Key List: ", thresholdKey);

    // Step 2: Create the account
    console.log("Creating new account...");
    const aliceId = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(thresholdKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    console.log("Created new account with ID: ", aliceId.toString());

    // Step 3: Schedule a transfer transaction
    console.log("Creating new scheduled transaction with 1 day expiry");
    const transfer = new TransferTransaction()
        .addHbarTransfer(aliceId, new Hbar(-1))
        .addHbarTransfer(client.operatorAccountId, new Hbar(1));
    const hasJitter = false;

    const scheduleId = (
        await (
            await transfer
                .schedule()
                .setWaitForExpiry(false)
                .setExpirationTime(
                    Timestamp.generate(hasJitter).plusNanos(
                        86400 * 1_000_000_000,
                    ),
                ) // 1 day in milliseconds
                .execute(client)
        ).getReceipt(client)
    ).scheduleId;

    // Step 4: Sign the transaction with one key
    console.log("Signing the new scheduled transaction with 1 key");
    await (
        await (
            await new ScheduleSignTransaction()
                .setScheduleId(scheduleId)
                .freezeWith(client)
                .sign(privateKey1)
        ).execute(client)
    ).getReceipt(client);

    let info = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    let executedAt = info.executed ? info.executed : "none";
    console.log(
        "Scheduled transaction is not yet executed. Executed at: ",
        executedAt,
    );

    // Step 5: Sign the transaction with the other key
    let accountBalance = await new AccountBalanceQuery()
        .setAccountId(aliceId)
        .execute(client);
    console.log(
        "Alice's account balance before schedule transfer: ",
        accountBalance.hbars.toString(),
    );

    console.log("Signing the new scheduled transaction with the 2nd key");
    await (
        await (
            await new ScheduleSignTransaction()
                .setScheduleId(scheduleId)
                .freezeWith(client)
                .sign(privateKey2)
        ).execute(client)
    ).getReceipt(client);

    accountBalance = await new AccountBalanceQuery()
        .setAccountId(aliceId)
        .execute(client);
    console.log(
        "Alice's account balance after schedule transfer: ",
        accountBalance.hbars.toString(),
    );

    info = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    console.log(
        "Scheduled transaction is executed. Executed at: ",
        info.executed.toDate(),
    );

    // Step 6: Schedule another transfer transaction
    console.log("Creating new scheduled transaction with 10 seconds expiry");
    const transfer2 = new TransferTransaction()
        .addHbarTransfer(aliceId, new Hbar(-1))
        .addHbarTransfer(client.operatorAccountId, new Hbar(1));

    const scheduleId2 = (
        await (
            await transfer2
                .schedule()
                .setWaitForExpiry(true)
                .setExpirationTime(
                    Timestamp.generate(hasJitter).plusNanos(10 * 1_000_000_000),
                ) // 10 seconds in milliseconds
                .execute(client)
        ).getReceipt(client)
    ).scheduleId;

    // Step 7: Sign the transaction with one key
    console.log("Signing the new scheduled transaction with 1 key");
    await (
        await (
            await new ScheduleSignTransaction()
                .setScheduleId(scheduleId2)
                .freezeWith(client)
                .sign(privateKey1)
        ).execute(client)
    ).getReceipt(client);

    info = await new ScheduleInfoQuery()
        .setScheduleId(scheduleId2)
        .execute(client);
    executedAt = info.executed ? info.executed : "none";
    console.log(
        "Scheduled transaction is not yet executed. Executed at: ",
        executedAt,
    );

    // Step 8: Update the account’s key
    console.log("Updating Alice's key to be the 1st key");
    await (
        await (
            await (
                await new AccountUpdateTransaction()
                    .setAccountId(aliceId)
                    .setKey(privateKey1.publicKey)
                    .freezeWith(client)
                    .sign(privateKey1)
            ).sign(privateKey2)
        ).execute(client)
    ).getReceipt(client);

    // Step 9: Verify that the transfer successfully executes
    accountBalance = await new AccountBalanceQuery()
        .setAccountId(aliceId)
        .execute(client);
    console.log(
        "Alice's account balance before schedule transfer: ",
        accountBalance.hbars.toString(),
    );

    // Wait for the scheduled transaction to execute
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

    accountBalance = await new AccountBalanceQuery()
        .setAccountId(aliceId)
        .execute(client);
    console.log(
        "Alice's account balance after schedule transfer: ",
        accountBalance.hbars.toString(),
    );

    console.log("Long Term Scheduled Transaction Example Complete!");
    client.close();
}

main().catch(console.error);
