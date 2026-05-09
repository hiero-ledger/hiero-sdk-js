import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    AccountCreateTransaction,
    AccountBalanceQuery,
    AccountDeleteTransaction,
    TransferTransaction,
    Transaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to transfer Hbar to an account with the receiver signature enabled.
 *
 * Demonstrates two-party signing across a byte serialization boundary:
 * the user signs locally, sends the bytes to an "exchange" (simulated in
 * this example by just calling Transaction.fromBytes / sign / toBytes),
 * and the operator submits the doubly-signed transaction.
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
    }

    console.log("MultiApp Transfer Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: Generate ED25519 key pairs.
    // The exchange should possess this key — we generate it here for demo only.
    const exchangePrivateKey = PrivateKey.generateED25519();
    const exchangePublicKey = exchangePrivateKey.publicKey;

    // The user's key — the only key we should actually possess in real life.
    const userPrivateKey = PrivateKey.generateED25519();
    const userPublicKey = userPrivateKey.publicKey;

    // Step 2: Create exchange and user accounts.
    console.log("Creating exchange and receiver accounts...");

    // The exchange creates an account that requires its signature on inbound
    // transfers (validated through some side channel like a REST API).
    const exchangeCreateTx = new AccountCreateTransaction()
        .setReceiverSignatureRequired(true)
        .setKeyWithoutAlias(exchangePublicKey)
        .freezeWith(client);
    const exchangeSigned = await exchangeCreateTx.sign(exchangePrivateKey);
    const exchangeAccountId = (
        await (await exchangeSigned.execute(client)).getReceipt(client)
    ).accountId;

    // The user account — operator's signature is implicit (operator pays the fee),
    // user's public key controls the account.
    const userAccountId = (
        await (
            await new AccountCreateTransaction()
                .setInitialBalance(new Hbar(2))
                .setKeyWithoutAlias(userPublicKey)
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    const senderBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(userAccountId)
            .execute(client)
    ).hbars;
    const exchangeBalanceBefore = (
        await new AccountBalanceQuery()
            .setAccountId(exchangeAccountId)
            .execute(client)
    ).hbars;
    console.log(
        `User account (${userAccountId.toString()}) balance: ${senderBalanceBefore.toString()}`,
    );
    console.log(
        `Exchange account (${exchangeAccountId.toString()}) balance: ${exchangeBalanceBefore.toString()}`,
    );

    // Step 3: Build the transfer; sign with the user; serialize; "send to exchange".
    const transferAmount = new Hbar(1);
    const transferTx = await new TransferTransaction()
        .addHbarTransfer(userAccountId, transferAmount.negated())
        .addHbarTransfer(exchangeAccountId, transferAmount)
        // The exchange-provided memo required to validate the transaction.
        .setTransactionMemo("https://some-exchange.com/user1/account1")
        .freezeWith(client)
        .sign(userPrivateKey);

    // The exchange must sign the transaction in order for it to be accepted by
    // the network. In real life this would be a REST call to the exchange API.
    const userSignedBytes = transferTx.toBytes();
    console.log(
        "Sending user-signed transaction bytes to exchange for countersignature...",
    );
    const exchangeSignedTx =
        await Transaction.fromBytes(userSignedBytes).sign(exchangePrivateKey);
    const finalSignedBytes = exchangeSignedTx.toBytes();
    console.log("Exchange countersigned; received bytes back.");

    // Parse the bytes returned from the exchange and execute.
    const finalTx = Transaction.fromBytes(finalSignedBytes);
    console.log(
        `Transferring ${transferAmount.toString()} from the user account to the exchange account...`,
    );

    const transferResponse = await finalTx.execute(client);
    await transferResponse.getReceipt(client);

    // Step 4: Confirm balances after the transfer.
    const senderBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(userAccountId)
            .execute(client)
    ).hbars;
    const exchangeBalanceAfter = (
        await new AccountBalanceQuery()
            .setAccountId(exchangeAccountId)
            .execute(client)
    ).hbars;
    console.log(
        `User account (${userAccountId.toString()}) balance: ${senderBalanceAfter.toString()}`,
    );
    console.log(
        `Exchange account (${exchangeAccountId.toString()}) balance: ${exchangeBalanceAfter.toString()}`,
    );

    // Cleanup: delete both accounts, returning balances to the operator.
    const exchangeDeleteTx = new AccountDeleteTransaction()
        .setAccountId(exchangeAccountId)
        .setTransferAccountId(operatorId)
        .freezeWith(client);
    const exchangeDeleteSigned =
        await exchangeDeleteTx.sign(exchangePrivateKey);
    await (await exchangeDeleteSigned.execute(client)).getReceipt(client);

    const userDeleteTx = new AccountDeleteTransaction()
        .setAccountId(userAccountId)
        .setTransferAccountId(operatorId)
        .freezeWith(client);
    const userDeleteSigned = await userDeleteTx.sign(userPrivateKey);
    await (await userDeleteSigned.execute(client)).getReceipt(client);

    client.close();

    console.log("MultiApp Transfer Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
