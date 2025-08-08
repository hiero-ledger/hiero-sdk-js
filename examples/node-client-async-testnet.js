import {
    Client,
    AccountId,
    PrivateKey,
    AccountCreateTransaction,
    AccountBalanceQuery,
    Hbar,
    LedgerId,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * @description Example demonstrating Client.forTestnetAsync() method
 * This method initializes a client with the latest network state from the address book
 * and automatically updates the network configuration.
 */

async function main() {
    // Ensure required environment variables are available
    if (
        !process.env.OPERATOR_KEY ||
        !process.env.OPERATOR_ID ||
        !process.env.HEDERA_NETWORK
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    console.log("Initializing Client with forTestnetAsync()...");
    console.log("Fetching latest network state from address book...\n");

    try {
        // Initialize the client with the latest network state from address book
        const client = await Client.forTestnetAsync();

        // Set the operator for the client
        const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
        const operatorKey = PrivateKey.fromStringED25519(
            process.env.OPERATOR_KEY,
        );
        client.setOperator(operatorId, operatorKey);

        console.log("Client initialized successfully!");
        console.log(
            `Network Type: ${client.ledgerId === LedgerId.TESTNET ? "Testnet" : "Unknown"}`,
        );
        console.log(`Node Count: ${Object.keys(client.network).length}`);
        console.log(`Operator Account: ${operatorId.toString()}\n`);

        // Display network information
        console.log("Network Nodes:");
        Object.entries(client.network).forEach(
            ([address, accountId], index) => {
                console.log(
                    `  ${index + 1}. ${address} -> ${accountId.toString()}`,
                );
            },
        );
        console.log();

        // Query account balance
        console.log("Querying account balance...");
        try {
            const balance = await new AccountBalanceQuery()
                .setAccountId(operatorId)
                .execute(client);

            console.log(`Account Balance: ${balance.hbars.toString()}\n`);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.log(`Error querying balance: ${errorMessage}\n`);
        }

        // Create a new account
        console.log("Creating a new account...");
        try {
            const newKey = PrivateKey.generateED25519();
            console.log(`Generated new key pair:`);
            console.log(`   Private Key: ${newKey.toString()}`);
            console.log(`   Public Key: ${newKey.publicKey.toString()}`);

            const transaction = new AccountCreateTransaction()
                .setInitialBalance(new Hbar(1))
                .setKeyWithoutAlias(newKey.publicKey)
                .freezeWith(client);

            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            console.log(`Account created successfully!`);
            console.log(`New Account ID: ${receipt.accountId.toString()}\n`);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.log(`Error creating account: ${errorMessage}\n`);
        }

        // Demonstrate network update capability
        console.log("Demonstrating network update capability...");
        try {
            console.log("Updating network from address book...");
            await client.updateNetwork();
            console.log(
                `Network updated! New node count: ${Object.keys(client.network).length}`,
            );

            console.log("Updated Network Nodes:");
            Object.entries(client.network).forEach(
                ([address, accountId], index) => {
                    console.log(
                        `  ${index + 1}. ${address} -> ${accountId.toString()}`,
                    );
                },
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.log(`Error updating network: ${errorMessage}`);
        }

        // Close the client
        client.close();
        console.log("\nClient closed successfully!");
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error("Error initializing client:", errorMessage);
    }
}

void main();
