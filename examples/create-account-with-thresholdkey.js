import {
    Client,
    PrivateKey,
    AccountId,
    Hbar,
    AccountCreateTransaction,
    TransferTransaction,
    AccountBalanceQuery,
    AccountDeleteTransaction,
    KeyList,
    Logger,
    LogLevel,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * Step 0: Set up client connection to Hedera network
 */

async function main() {
    if (
        !process.env.OPERATOR_ID ||
        !process.env.OPERATOR_KEY ||
        !process.env.HEDERA_NETWORK
    ) {
        console.error(
            "Environment variables OPERATOR_ID, OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
        throw new Error("Missing required environment variables.");
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    //  Create the client based on the HEDERA_NETWORK environment variable
    const client = Client.forName(process.env.HEDERA_NETWORK);

    client.setOperator(operatorId, operatorKey);

    // Set logger
    const infoLogger = new Logger(LogLevel.Info);
    client.setLogger(infoLogger);

    try {
        console.log("Create Account With Threshold Key Example Start!");

        /*
         * Step 1:
         * Generate three new Ed25519 private, public key pairs.
         *
         */

        const privateKeys = [];
        const publicKeys = [];
        for (let i = 0; i < 3; i++) {
            const key = PrivateKey.generateECDSA();
            privateKeys.push(key);
            publicKeys.push(key.publicKey);
        }

        console.log("Generating public keys...");
        publicKeys.forEach((publicKey, index) => {
            console.log(
                `Generated public key ${index + 1}: ${publicKey.toString()}`,
            );
        });

        /*
         * Step 2:
         * Create a Key List.
         *
         * Require 2 of the 3 keys we generated to sign on anything modifying this account.
         */
        const thresholdKey = new KeyList(publicKeys, 2);

        /*
         * Step 3:
         * Create a new account setting a Key List from a previous step as an account's key.
         */
        console.log("Creating new account...");
        const accountCreateTxResponse = await new AccountCreateTransaction()
            .setKeyWithoutAlias(thresholdKey)
            .setInitialBalance(new Hbar(100))
            .execute(client);

        const accountCreateTxReceipt =
            await accountCreateTxResponse.getReceipt(client);
        const newAccountId = accountCreateTxReceipt.accountId;

        console.log(`Created account with ID: ${newAccountId.toString()}`);

        /*
         * Step 4:
         * Create a transfer transaction from a newly created account to demonstrate the signing process (threshold).
         */
        console.log("Transferring 1 Hbar from a newly created account...");
        let transferTx = new TransferTransaction()
            .addHbarTransfer(newAccountId, new Hbar(-50))
            .addHbarTransfer(new AccountId(3), new Hbar(50))
            .freezeWith(client);

        // Sign with 2 of the 3 keys
        transferTx = await transferTx.sign(privateKeys[0]);
        transferTx = await transferTx.sign(privateKeys[1]);

        // Execute the transaction
        const transferTxResponse = await transferTx.execute(client);

        // Wait for the transfer to reach consensus
        await transferTxResponse.getReceipt(client);

        // Query the account balance after the transfer
        const accountBalanceAfterTransfer = await new AccountBalanceQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(
            "New account's Hbar balance after transfer: " +
                accountBalanceAfterTransfer.hbars.toString(),
        );

        /*
         * Step 5:
         * Clean up: Delete created account.
         */
        let accountDeleteTx = new AccountDeleteTransaction()
            .setTransferAccountId(operatorId)
            .setAccountId(newAccountId)
            .freezeWith(client);

        accountDeleteTx = await accountDeleteTx.sign(privateKeys[0]);
        accountDeleteTx = await accountDeleteTx.sign(privateKeys[1]);

        const accountDeleteTxResponse = await accountDeleteTx.execute(client);
        await accountDeleteTxResponse.getReceipt(client);

        console.log("Account deleted successfully");
    } catch (error) {
        console.error("Error occurred during account creation");
    } finally {
        client.close();
        console.log("Create Account With Threshold Key Example Complete!");
    }
}

void main();
