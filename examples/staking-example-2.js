import {
    AccountCreateTransaction,
    AccountInfoQuery,
    Wallet,
    LocalProvider,
    PrivateKey,
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
        // Create an account and stake to an acount ID
        // In this case we're staking to account ID 3 which happens to be
        // the account ID of node 0, we're only doing this as an example.
        // If you really want to stake to node 0, you should use
        // `.setStakedNodeId()` instead
        let transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(newKey.publicKey)
            .setInitialBalance(20)
            .setStakedAccountId("0.0.3")
            .freezeWithSigner(wallet);
        transaction = await transaction.signWithSigner(wallet);
        const resp = await transaction.executeWithSigner(wallet);

        // If we get here we have successfully created an account that
        // is staked to account ID 0.0.3
        const transactionReceipt = await resp.getReceiptWithSigner(wallet);

        // The new account ID
        const newAccountId = transactionReceipt.accountId;

        console.log(`account id = ${newAccountId.toString()}`);

        // Show the required key used to sign the account update transaction to
        // stake the accounts hbar i.e. the fee payer key and key to authorize
        // changes to the account should be different
        console.log(
            `key required to update staking information: ${newKey.publicKey.toString()}`,
        );
        console.log(
            `fee payer aka operator key: ${wallet.getAccountKey().toString()}`,
        );

        // Query the account info, it should show the staked account ID
        // to be 0.0.3 just like what we set it to
        const info = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .executeWithSigner(wallet);

        console.log(`Staking info: ${info.stakingInfo.toString()}`);
    } catch (error) {
        console.error(error);
    }

    provider.close();
}

void main();
