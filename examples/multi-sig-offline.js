import {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    AccountId,
    KeyList,
    TransferTransaction,
    Transaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

/** @type {PrivateKey | undefined} */
let user1Key;

/** @type {PrivateKey | undefined} */
let user2Key;

async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        AccountId.fromString(process.env.OPERATOR_ID),
        PrivateKey.fromStringDer(process.env.OPERATOR_KEY),
    );

    user1Key = PrivateKey.generate();
    user2Key = PrivateKey.generate();

    console.log(`private key for user 1= ${user1Key.toString()}`);
    console.log(`public key for user 1= ${user1Key.publicKey.toString()}`);
    console.log(`private key for user 2= ${user2Key.toString()}`);
    console.log(`public key for user 2= ${user2Key.publicKey.toString()}`);

    // create a multi-sig account
    const keyList = new KeyList([user1Key, user2Key]);

    const createAccountTransaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(2)) // 5 h
        .setKeyWithoutAlias(keyList);

    const response = await createAccountTransaction.execute(client);

    let receipt = await response.getReceipt(client);

    console.log(`account id = ${receipt.accountId.toString()}`);

    // create a transfer from new account to 0.0.3
    const transferTransaction = new TransferTransaction()
        .setNodeAccountIds([new AccountId(3)])
        .addHbarTransfer(receipt.accountId, -1)
        .addHbarTransfer("0.0.3", 1)
        .freezeWith(client);

    // convert transaction to bytes to send to signatories
    const transactionBytes = transferTransaction.toBytes();
    const transactionToExecute = Transaction.fromBytes(transactionBytes);

    // ask users to sign and return signature
    const user1Signature = user1Key.signTransaction(transferTransaction);
    const user2Signature = user2Key.signTransaction(transferTransaction);

    try {
        // recreate the transaction from bytes
        await transactionToExecute.signWithOperator(client);
        transactionToExecute.addSignature(user1Key.publicKey, user1Signature);
        transactionToExecute.addSignature(user2Key.publicKey, user2Signature);

        const result = await transactionToExecute.execute(client);
        receipt = await result.getReceipt(client);
        console.log(`Status: ${receipt.status.toString()}`);
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
