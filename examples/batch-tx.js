import { setTimeout } from "node:timers/promises";
import {
    Client,
    PrivateKey,
    AccountId,
    Hbar,
    AccountCreateTransaction,
    BatchTransaction,
    TransactionReceiptQuery,
    Logger,
    LogLevel,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

async function main() {
    /**
     *  Step 1: Create Client
     */
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const operatorAccId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorPrivKey = PrivateKey.fromStringED25519(
        process.env.OPERATOR_KEY,
    );

    const client = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(operatorAccId, operatorPrivKey)
        .setLogger(new Logger(LogLevel.Info));

    /**
     * Step 2:
     * Create three account create transactions with batch keys, but do not execute them.
     **/
    const privKey1 = PrivateKey.generateECDSA();
    const publicKey1 = privKey1.publicKey;

    const privKey2 = PrivateKey.generateECDSA();
    const publicKey2 = privKey2.publicKey;

    const privKey3 = PrivateKey.generateECDSA();
    const publicKey3 = privKey3.publicKey;

    console.log("Creating three account create transactions...");

    /**
     * Step 3:
     * BatchKey is the public key of the client that executes
     * a batch transaction
     */
    const batchKey = client.getOperator().publicKey;

    /**
     * Step 4:
     * Create three account create transactions with batch keys, but do not execute them.
     */
    const accountCreateTx1 = await new AccountCreateTransaction()
        .setKeyWithoutAlias(publicKey1)
        .setInitialBalance(new Hbar(1))
        .batchify(client, batchKey);

    var accountCreateTx2 = await new AccountCreateTransaction()
        .setKeyWithoutAlias(publicKey2)
        .setInitialBalance(new Hbar(1))
        .batchify(client, batchKey);

    var accountCreateTx3 = await new AccountCreateTransaction()
        .setKeyWithoutAlias(publicKey3)
        .setInitialBalance(new Hbar(1))
        .batchify(client, batchKey);

    console.log("Executing batch transaction...");

    const batchTx = new BatchTransaction();

    /**
     * Step 5:
     * Execute the batch transaction
     */
    await (
        await batchTx
            .addInnerTransaction(accountCreateTx1)
            .addInnerTransaction(accountCreateTx2)
            .addInnerTransaction(accountCreateTx3)
            .execute(client)
    ).getReceipt(client);

    /**
     * Step 6:
     * Verify the three account IDs of the newly created accounts using innerTransactionIds.
     */
    console.log(
        "Verifying the three account IDs of the newly created accounts...",
    );
    await setTimeout(5000);
    const receipt1 = await new TransactionReceiptQuery()
        .setTransactionId(batchTx.innerTransactionIds[0])
        .execute(client);
    const receipt2 = await new TransactionReceiptQuery()
        .setTransactionId(batchTx.innerTransactionIds[1])
        .execute(client);
    const receipt3 = await new TransactionReceiptQuery()
        .setTransactionId(batchTx.innerTransactionIds[2])
        .execute(client);

    console.log("Created accound 1: ", receipt1.accountId.toString());
    console.log("Created accound 2: ", receipt2.accountId.toString());
    console.log("Created accound 3: ", receipt3.accountId.toString());

    client.close();
}

void main();
