import {
    AccountCreateTransaction,
    Client,
    PrivateKey,
    Hbar,
    AccountId,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

/**
 * @description Initialize a client with only mirror node network address and create account with it
 */

async function main() {
    // Ensure required environment variables are available
    dotenv.config();

    // Ensure that they are testnet variables
    if (
        !process.env.OPERATOR_KEY ||
        !process.env.OPERATOR_ID ||
        !process.env.HEDERA_NETWORK
    ) {
        throw new Error("Please set required keys in .env file.");
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const accountKey = PrivateKey.generate();

    // Initialize the client with the testnet mirror node. This will also get the address book from the mirror node and
    // use it to populate the Client's consensus network.
    const client = (
        await Client.forMirrorNetwork("testnet.mirrornode.hedera.com:443")
    ).setOperator(operatorId, operatorKey);

    try {
        let transaction = new AccountCreateTransaction()
            .setInitialBalance(new Hbar(1))
            .setKeyWithoutAlias(accountKey)
            .freezeWith(client);

        transaction = await transaction.sign(accountKey);

        const response = await transaction.execute(client);

        const receipt = await response.getReceipt(client);

        console.log(`account id = ${receipt.accountId.toString()}`);
    } catch (error) {
        console.log(error);
    }

    client.close();
}
void main();
