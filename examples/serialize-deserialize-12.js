import {
    AccountId,
    Client,
    PrivateKey,
    Logger,
    LogLevel,
    Transaction,
    AccountUpdateTransaction,
    TransactionId,
    Timestamp,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";

/**
 * @description Create, serialize and deserialize so-called incomplete transaction, then freeze it, serialize and deserialize it again, and execute it
 */

async function main() {
    // Ensure required environment variables are available
    dotenv.config();
    if (
        !process.env.OPERATOR_KEY ||
        !process.env.OPERATOR_ID ||
        !process.env.HEDERA_NETWORK
    ) {
        throw new Error("Please set required keys in .env file.");
    }

    const network = process.env.HEDERA_NETWORK;

    // Configure client using environment variables
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    // Set logger
    const infoLogger = new Logger(LogLevel.Info);
    client.setLogger(infoLogger);

    try {
        // Create transaction id
        const transactionId = new TransactionId(
            operatorId,
            Timestamp.fromDate(new Date()),
        );

        // 1. Create a transaction
        const transaction = new AccountUpdateTransaction()
            .setTransactionId(transactionId)
            .setAccountId(operatorId)
            .setAccountMemo("Hello");

        // 2. Serialize transaction
        const transactionBytes = transaction.toBytes();

        // 3. Deserialize transaction
        const transactionFromBytes = Transaction.fromBytes(transactionBytes);

        // 4. Freeze transaction
        transactionFromBytes.freezeWith(client);

        // 5. Serialize transaction after being frozen
        const transactionBytesAfterBeingFrozen = transactionFromBytes.toBytes();

        // 6. Deserialize transaction again
        const transactionFromBytesAfterBeingFrozen = Transaction.fromBytes(
            transactionBytesAfterBeingFrozen,
        );

        // 7. Execute transaction
        const executedTransaction =
            await transactionFromBytesAfterBeingFrozen.execute(client);

        // 8. Get a receipt
        const receipt = await executedTransaction.getReceipt(client);
        console.log(`Transaction status: ${receipt.status.toString()}!`);
    } catch (error) {
        console.log(error);
    }

    client.close();
}

void main();
