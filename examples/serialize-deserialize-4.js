import {
    AccountId,
    TransferTransaction,
    Hbar,
    Client,
    PrivateKey,
    Logger,
    LogLevel,
    Transaction,
    AccountCreateTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

/**
 * @description Serialize and deserialize the so-called signed transaction, and execute it
 */

/**
 * Helper function to create an account
 * @param {Client} client - The Hedera client
 * @param {string} name - Name for logging purposes
 * @param {Hbar} initialBalance - Initial balance for the account
 * @returns {Promise<{accountId: AccountId, privateKey: PrivateKey}>}
 */
async function createAccount(client, name, initialBalance = new Hbar(10)) {
    const privateKey = PrivateKey.generate();
    const publicKey = privateKey.publicKey;

    console.log(`Creating ${name} account...`);
    console.log(`${name} private key = ${privateKey.toString()}`);
    console.log(`${name} public key = ${publicKey.toString()}`);

    const transaction = new AccountCreateTransaction()
        .setInitialBalance(initialBalance)
        .setKeyWithoutAlias(publicKey)
        .freezeWith(client);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;

    console.log(`${name} account ID = ${accountId.toString()}\n`);

    return { accountId, privateKey };
}

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
        // Create Alice account instead of using environment variable
        const { accountId: aliceId, privateKey: aliceKey } =
            await createAccount(client, "Alice", new Hbar(20));

        // 1. Create transaction and freeze it
        const transaction = new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-1))
            .addHbarTransfer(aliceId, new Hbar(1))
            .freezeWith(client);

        // 2. Serialize transaction into bytes
        const transactionBytes = transaction.toBytes();

        // 3. Deserialize transaction from bytes
        let transactionFromBytes = Transaction.fromBytes(transactionBytes);

        // 4. Set node account ids
        transactionFromBytes.setNodeAccountIds([new AccountId(3)]);

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
