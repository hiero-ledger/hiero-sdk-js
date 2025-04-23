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

/**
 * @description Account creation with error handling, demonstrating how to handle various error scenarios
 * when creating accounts on Hedera. This example shows proper error handling techniques including
 * retry with exponential backoff, handling of specific error types like PrecheckStatusError and
 * StatusError, and graceful recovery from network issues.
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
    const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK);
    client.setOperator(operatorId, operatorKey);

    try {
        const newKey = PrivateKey.generateED25519();
        console.log(`Generated new public key: ${newKey.publicKey.toString()}`);
        let accountId = null;

        let transaction = new AccountCreateTransaction()
            .setInitialBalance(new Hbar(10))
            .setKeyWithoutAlias(newKey.publicKey)
            .freezeWith(client);

        // Implement retry with backoff
        const maxRetries = 4;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            // Attempt to execute the transaction
            // This step sends the transaction to the network for processing
            // Potential errors here could include network connectivity issues,
            // node unavailability, or client configuration problems
            try {
                transaction = await transaction.sign(operatorKey);
                const response = await transaction.execute(client);

                // Here we explicitly check the receipt status to ensure everything went well
                // This step catches any errors that might have occurred during transaction processing
                // but after the transaction was submitted to the network
                try {
                    const receipt = await response.getReceipt(client);
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
                        throw new Error(
                            `Transaction failed: ${receipt.status.toString()}`,
                        );
                    }
                } catch (receiptError) {
                    if (receiptError instanceof StatusError) {
                        console.error(
                            `Receipt retrieval failed with status: ${receiptError.status.toString()}`,
                        );
                    } else if (receiptError instanceof Error) {
                        console.error(`Receipt error: ${receiptError.message}`);
                    }
                    throw receiptError; // Rethrow to be caught by outer catch block
                }
            } catch (error) {
                // Handle precheck errors - these occur before the transaction reaches consensus
                // and indicate issues with the transaction that would prevent it from being processed
                if (error instanceof PrecheckStatusError) {
                    console.error(
                        `PrecheckStatusError caught with status: ${error.status.toString()}`,
                    );
                    break;
                }

                // If the error is a precheck error, retry the transaction after a short delay
                if (error instanceof StatusError) {
                    if (error.status === Status.Busy && attempt <= maxRetries) {
                        const delay = 1000 * Math.pow(2, attempt);
                        await wait(delay);
                        console.warn(
                            `Node busy, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`,
                        );
                        continue;
                    }
                }

                // Handle network connectivity issues with exponential backoff
                // This handles temporary network problems that might resolve with a retry
                if (
                    error instanceof Error &&
                    attempt < maxRetries &&
                    error.message &&
                    error.message.includes("Network connectivity issue")
                ) {
                    const delay = 1000 * Math.pow(2, attempt);
                    console.warn(
                        `Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`,
                    );
                    await wait(delay);
                } else {
                    // Either the error is not a network issue, or we've exhausted our retry attempts
                    if (error instanceof Error) {
                        console.error(`- Message: ${error.message}`);
                    }
                    if (error instanceof StatusError) {
                        console.error(`- Status: ${error.status.toString()}`);
                    }
                    break;
                }
            }
        }
    } finally {
        client.close();
        console.log("\nAccount creation example complete!");
    }
}

void main();
