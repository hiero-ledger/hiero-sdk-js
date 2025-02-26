import {
    Wallet,
    LocalProvider,
    PrivateKey,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    Hbar,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

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

    const newKey = PrivateKey.generate();

    console.log(`private key = ${newKey.toString()}`);
    console.log(`public key = ${newKey.publicKey.toString()}`);

    try {
        let transaction = await new AccountCreateTransaction()
            .setInitialBalance(new Hbar(10)) // 10 h
            .setKeyWithoutAlias(newKey.publicKey)
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const response = await transaction.executeWithSigner(wallet);

        const receipt = await response.getReceiptWithSigner(wallet);

        console.log(`created account id = ${receipt.accountId.toString()}`);

        let accountDeleteTransaction = await new AccountDeleteTransaction()
            .setNodeAccountIds([response.nodeId])
            .setAccountId(receipt.accountId)
            .setTransferAccountId(wallet.getAccountId())
            .freezeWithSigner(wallet);
        accountDeleteTransaction =
            await accountDeleteTransaction.signWithSigner(wallet);

        newKey.signTransaction(accountDeleteTransaction);

        await accountDeleteTransaction.executeWithSigner(wallet);

        console.log(`deleted account id = ${receipt.accountId.toString()}`);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
