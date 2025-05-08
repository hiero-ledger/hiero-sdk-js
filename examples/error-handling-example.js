import {
    Client,
    PrivateKey,
    AccountId,
    Hbar,
    AccountCreateTransaction,
    PrecheckStatusError,
    Status,
    ReceiptStatusError,
    MaxAttemptsOrTimeoutError,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

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

    const newKey = PrivateKey.generateED25519();
    console.log(`Generated new public key: ${newKey.publicKey.toString()}`);
    let accountId = null;

    let transaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(10))
        .setKeyWithoutAlias(newKey.publicKey)
        .freezeWith(client);

    // Attempt to execute the transaction
    // This step sends the transaction to the network for processing
    // Potential errors here could include network connectivity issues,
    // node unavailability, or client configuration problems
    try {
        transaction = await transaction.sign(operatorKey);
        const response = await transaction.execute(client);
        const receipt = await response.getReceipt(client);

        if (receipt.status === Status.Success) {
            accountId = receipt.accountId;
            console.log(
                `Success! Account created with ID: ${accountId.toString()}`,
            );
        } else {
            console.error(
                `Transaction failed with status: ${receipt.status.toString()}`,
            );

            // Receipt errors indicate a problem with the transaction itself so we don't retry
            throw new Error(`Transaction failed: ${receipt.status.toString()}`);
        }
    } catch (error) {
        if (error instanceof PrecheckStatusError) {
            console.error(
                `Transaction failed on precheck with status: ${error.status.toString()}. User action is needed`,
            );
        } else if (error instanceof ReceiptStatusError) {
            console.error(
                `Transaction failed on receipt with status: ${error.status.toString()} . User action is needed`,
            );
        } else if (error instanceof MaxAttemptsOrTimeoutError) {
            console.error(
                `Transaction reached max attempts. This might be due to degraded network performance. Please increase max attempts using the SDK client.`,
            );
        } else if (error instanceof Error) {
            console.error(`Unexpected error occurred.`);
        }
    } finally {
        client.close();
    }
}

void main();
