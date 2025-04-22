/**
 * Token Creation Error Handling Example
 */

import {
    AccountId,
    Hbar,
    PrecheckStatusError,
    Status,
    TokenCreateTransaction,
    TokenType,
    TransactionId,
    PrivateKey,
    Client,
    StatusError,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

import { wait } from "../src/util.js";

// Configure environment variables
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
        // Token creation with error handling
        const tokenName = "Error Handling Token";
        const tokenSymbol = "EHT";

        // Implement retry with backoff
        const maxRetries = 3;
        let tokenId;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Generate transaction ID for each attempt
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

                transaction = await transaction.sign(operatorKey);
                const response = await transaction.execute(client);
                const receipt = await response.getReceipt(client);

                tokenId = receipt.tokenId;
                console.log(
                    `Successfully created token: ${tokenId.toString()}`,
                );
                break; // Success, exit retry loop
            } catch (error) {
                if (error instanceof PrecheckStatusError) {
                    console.error(
                        `PrecheckStatusError caught with status: ${error.status.toString()}`,
                    );
                    break;
                }

                // Handle specific token errors
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
                    } else if (
                        error.status.toString() === Status.Busy.toString()
                    ) {
                        if (attempt < maxRetries) {
                            const delay = 1000 * Math.pow(2, attempt);
                            console.warn(
                                `Node busy, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`,
                            );
                            await wait(delay);
                            continue;
                        }
                    }
                }

                // retry on network errors
                if (
                    error instanceof Error &&
                    attempt < maxRetries &&
                    error.message &&
                    error.message.includes("network")
                ) {
                    const delay = 1000 * Math.pow(2, attempt);
                    console.warn(
                        `Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`,
                    );
                    await wait(delay);
                } else {
                    // Not retryable or out of retries
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

// Execute the main function
void main();
