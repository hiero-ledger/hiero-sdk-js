import {
    AccountId,
    TransferTransaction,
    Hbar,
    Client,
    PrivateKey,
    Logger,
    LogLevel,
    Timestamp,
    Transaction,
    TransactionId,
    AccountCreateTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

/**
 * @description Serialize and deserialize so-called incomplete transaction, set transaction id and execute it
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
    const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);

    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    // Set logger
    const infoLogger = new Logger(LogLevel.Info);
    client.setLogger(infoLogger);

    try {
        // Create Alice account
        console.log("Creating Alice account...");
        const aliceKey = PrivateKey.generate();
        const alicePublicKey = aliceKey.publicKey;
        console.log(`Alice private key = ${aliceKey.toString()}`);
        console.log(`Alice public key = ${alicePublicKey.toString()}`);

        const aliceTransaction = new AccountCreateTransaction()
            .setInitialBalance(new Hbar(20))
            .setKeyWithoutAlias(aliceKey)
            .freezeWith(client);

        const aliceResponse = await aliceTransaction.execute(client);
        const aliceReceipt = await aliceResponse.getReceipt(client);
        const aliceId = aliceReceipt.accountId;
        console.log(`Alice account ID = ${aliceId.toString()}\n`);

        // 1. Create transaction
        const transaction = new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-1))
            .addHbarTransfer(aliceId, new Hbar(1));

        // 2. Serialize transaction into bytes
        const transactionBytes = transaction.toBytes();

        // 3. Deserialize transaction from bytes
        let transactionFromBytes = Transaction.fromBytes(transactionBytes);

        // 4. Set transaction id
        const validStart = new Timestamp(Math.floor(Date.now() / 1000), 0);
        const transactionId = new TransactionId(operatorId, validStart);
        transactionFromBytes.setTransactionId(transactionId);

        // 5. Freeze, sign and execute transaction
        const executedTransaction = await (
            await transactionFromBytes.freezeWith(client).sign(aliceKey)
        ).execute(client);

        // 6. Get a receipt
        const receipt = await executedTransaction.getReceipt(client);
        console.log(`Transaction status: ${receipt.status.toString()}!`);
    } catch (error) {
        console.log(error);
    }

    client.close();
}

void main();
