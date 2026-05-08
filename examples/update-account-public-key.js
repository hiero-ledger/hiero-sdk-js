import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    AccountCreateTransaction,
    AccountUpdateTransaction,
    AccountInfoQuery,
    AccountDeleteTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to update an account's key.
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

    console.log("Update Account Public Key Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(operatorId, operatorKey)
        .setDefaultMaxTransactionFee(new Hbar(10));

    // Step 1: Generate ED25519 key pairs.
    console.log("Generating ED25519 key pairs...");
    const privateKey1 = PrivateKey.generateED25519();
    const publicKey1 = privateKey1.publicKey;
    const privateKey2 = PrivateKey.generateED25519();
    const publicKey2 = privateKey2.publicKey;

    // Step 2: Create a new account using publicKey1.
    console.log("Creating new account...");
    const accountCreateResponse = await new AccountCreateTransaction()
        .setKeyWithoutAlias(publicKey1)
        .setInitialBalance(new Hbar(1))
        .execute(client);

    const accountId = (await accountCreateResponse.getReceipt(client))
        .accountId;
    console.log(
        `Created new account with ID: ${accountId.toString()} and public key: ${publicKey1.toString()}`,
    );

    // Step 3: Update the account's key to publicKey2.
    // Both signatures are required: the previous key authorizes the change,
    // the new key proves possession.
    console.log(
        `Updating public key of new account...(Setting key: ${publicKey2.toString()}).`,
    );
    const accountUpdateResponse = await (
        await (
            await new AccountUpdateTransaction()
                .setAccountId(accountId)
                .setKey(publicKey2)
                .freezeWith(client)
                .sign(privateKey1)
        ).sign(privateKey2)
    ).execute(client);

    // Wait for the transaction to complete by querying the receipt.
    await accountUpdateResponse.getReceipt(client);

    // Step 4: Confirm the key was changed via AccountInfoQuery.
    const accountInfo = await new AccountInfoQuery()
        .setAccountId(accountId)
        .execute(client);

    console.log(`New account public key: ${accountInfo.key.toString()}`);

    // Cleanup: delete the created account, transferring remaining funds back to the operator.
    const deleteTx = new AccountDeleteTransaction()
        .setAccountId(accountId)
        .setTransferAccountId(operatorId)
        .freezeWith(client);
    const signedDeleteTx = await deleteTx.sign(privateKey2);
    const deleteResponse = await signedDeleteTx.execute(client);
    await deleteResponse.getReceipt(client);

    client.close();

    console.log("Update Account Public Key Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
