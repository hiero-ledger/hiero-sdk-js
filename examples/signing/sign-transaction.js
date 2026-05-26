import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    AccountId,
    KeyList,
    TransferTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

let user1Key;
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

    const provider = new LocalProvider();

    const wallet = new Wallet(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
        provider,
    );

    user1Key = PrivateKey.generate();
    user2Key = PrivateKey.generate();

    // create a multi-sig account
    const keyList = new KeyList([user1Key, user2Key]);

    try {
        let transaction = await new AccountCreateTransaction()
            .setInitialBalance(new Hbar(2)) // 5 h
            .setKeyWithoutAlias(keyList)
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const response = await transaction.executeWithSigner(wallet);

        let receipt = await response.getReceiptWithSigner(wallet);

        console.log(`account id = ${receipt.accountId.toString()}`);

        // create a transfer from new account to 0.0.3
        let trasnferTransaction = await new TransferTransaction()
            .setNodeAccountIds([new AccountId(3)])
            .addHbarTransfer(receipt.accountId, -1)
            .addHbarTransfer("0.0.3", 1)
            .freezeWithSigner(wallet);
        trasnferTransaction = await trasnferTransaction.signWithSigner(wallet);

        user1Key.signTransaction(trasnferTransaction);
        user2Key.signTransaction(trasnferTransaction);

        const result = await trasnferTransaction.executeWithSigner(wallet);
        receipt = await result.getReceiptWithSigner(wallet);

        console.log(`Status: ${receipt.status.toString()}`);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
