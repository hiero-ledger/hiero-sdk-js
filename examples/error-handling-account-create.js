import {
    Client,
    PrivateKey,
    AccountId,
    Hbar,
    AccountCreateTransaction,
    PrecheckStatusError,
    Status,
    StatusError,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

import { wait } from "../src/util.js";

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
    const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK);
    client.setOperator(operatorId, operatorKey);

    try {
        console.log("Starting account creation with error handling...");

        // Step 1: Generate a new key pair for the account
        const newKey = PrivateKey.generateED25519();
        console.log(`Generated new public key: ${newKey.publicKey.toString()}`);

        // Step 2: Create the account with retry logic for temporary errors
        const maxRetries = 5;
        let attempt = 0;
        let accountId = null;

        while (attempt <= maxRetries) {
            console.log(
                `Attempting to create account (attempt ${attempt + 1}/${maxRetries + 1})...`,
            );
            let accountCreateTxResponse;

            try {
                accountCreateTxResponse = await new AccountCreateTransaction()
                    .setInitialBalance(new Hbar(10))
                    .setKeyWithoutAlias(newKey.publicKey)
                    .execute(client);

                const receipt =
                    await accountCreateTxResponse.getReceipt(client);

                if (receipt.status === Status.Success) {
                    accountId = receipt.accountId;
                    console.log(
                        `Success! Account created with ID: ${accountId.toString()}`,
                    );
                    break;
                } else {
                    // Receipt errors indicate a problem with the transaction itself so we don't retry
                    console.error(
                        `Transaction failed with status: ${receipt.status.toString()}`,
                    );
                    throw new Error(`Transaction failed: ${receipt.status}`);
                }
            } catch (error) {
                attempt++;

                if (error instanceof PrecheckStatusError) {
                    console.error(
                        `PrecheckStatusError caught with status: ${error.status.toString()}`,
                    );
                    break;
                }

                // If the error is a precheck error, retry the transaction after a short delay
                if (error instanceof StatusError) {
                    console.error(`Precheck error: ${error.status.toString()}`);
                    if (error.status === Status.Busy && attempt <= maxRetries) {
                        const delay = 1000 * Math.pow(2, attempt);
                        await wait(delay);

                        console.log(`Node busy, retrying in ${delay}ms...`);
                        continue;
                    }
                    throw error;
                }

                // If the error is a network or connection error, retry the transaction after a short delay
                if (
                    error instanceof Error &&
                    (error.message.includes("network") ||
                        error.message.includes("connection"))
                ) {
                    if (attempt <= maxRetries) {
                        const delay = 1000 * Math.pow(2, attempt);
                        await wait(delay);

                        console.log(
                            `Network error: ${error.message}, retrying in ${delay}ms...`,
                        );
                        continue;
                    }
                }

                console.error(`Failed after ${attempt} attempts`);
                throw error;
            }
        }

        if (!accountId) {
            throw new Error("Failed to create account after maximum retries");
        }

        console.log(
            "Account creation with retry mechanism completed successfully",
        );
    } catch (error) {
        console.error("\nError occurred during account creation:");

        if (error instanceof Error) {
            console.error(`- Message: ${error.message}`);

            if ("status" in error && "transactionId" in error) {
                console.error(`- Status: ${error.status.toString()}`);
                console.error(
                    `- Transaction ID: ${error.transactionId.toString()}`,
                );
            }
        } else {
            console.error(`- Unknown error type: ${typeof error}`);
            console.error(`- Value: ${String(error)}`);
        }
    } finally {
        client.close();
        console.log("\nAccount creation example complete!");
    }
}

void main();
