import {
    Client,
    PrivateKey,
    AccountId,
    AccountCreateTransaction,
    Logger,
    LogLevel,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

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

    const client = Client.forName(process.env.HEDERA_NETWORK);
    client.setOperator(operatorId, operatorKey);

    const infoLogger = new Logger(LogLevel.Info);
    client.setLogger(infoLogger);

    try {
        console.log("Create Account With High Volume Example Start!");

        const accountKey = PrivateKey.generateECDSA();

        console.log(`Generated private key: ${accountKey.toString()}`);
        console.log(`Generated public key: ${accountKey.publicKey.toString()}`);

        let accountCreateTx = new AccountCreateTransaction()
            .setKeyWithoutAlias(accountKey.publicKey)
            .setHighVolume(true)
            .freezeWith(client);

        accountCreateTx = await accountCreateTx.sign(accountKey);

        const response = await accountCreateTx.execute(client);
        const receipt = await response.getReceipt(client);
        const accountId = receipt.accountId;

        console.log(
            `Created high-volume account with ID: ${accountId.toString()}`,
        );
    } catch (error) {
        console.error("Error occurred during high-volume account creation:");
        console.error(error);
    } finally {
        client.close();
        console.log("Create Account With High Volume Example Complete!");
    }
}

void main();
