import {
    AccountId,
    Hbar,
    TokenCreateTransaction,
    TokenType,
    TransactionId,
    PrivateKey,
    Client,
    StatusError,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

import { wait } from "../src/util.js";

dotenv.config();

/**
 * @description Token creation with error handling when the client is set with one node, demonstrating how to handle various error scenarios
 * when creating tokens on Hedera. This example shows proper error handling techniques including
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
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK);
    client.setOperator(operatorId, operatorKey);

    try {
        const tokenName = "Error Handling Token";
        const tokenSymbol = "EHT";
        let tokenId;

        const txId = TransactionId.generate(operatorId);
        let transaction = new TokenCreateTransaction()
            .setTokenName(tokenName)
            .setTokenSymbol(tokenSymbol)
            .setDecimals(2)
            .setInitialSupply(10000)
            .setTokenType(TokenType.FungibleCommon)
            .setTransactionId(txId)
            .setTreasuryAccountId(operatorId)
            .setMaxTransactionFee(new Hbar(30))
            .freezeWith(client);

        // Implement retry with backoff
        const maxRetries = 4;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                transaction = await transaction.sign(operatorKey);
                const response = await transaction.execute(client);
                const receipt = await response.getReceipt(client);

                tokenId = receipt.tokenId;
                console.log(
                    `Successfully created token: ${tokenId.toString()}`,
                );
                break;
            } catch (error) {
                // Check for StatusError and handle specific token error codes, For example `INVALID_TOKEN_SYMBOL`,
                // `TOKEN_SYMBOL_TOO_LONG`. Or retry on Status.Busy with exponential backoff
                if (error instanceof StatusError) {
                    if (error.status.toString() === "INVALID_TOKEN_SYMBOL") {
                        console.error(
                            `Invalid token symbol: ${tokenSymbol}. Symbols must be in uppercase format.`,
                        );
                        break;
                    } else if (
                        error.status.toString() === "TOKEN_SYMBOL_TOO_LONG"
                    ) {
                        console.error(
                            `Token symbol ${tokenSymbol} exceeds maximum length`,
                        );
                        break;
                    }
                }

                // Handle network connectivity issues with exponential backoff
                // This handles temporary network problems that might resolve with a retry
                // Most probably when the client is set with one node
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
    } catch (error) {
        console.error("Unexpected error:");
        console.error(error);
    } finally {
        client.close();
    }
}

void main();
