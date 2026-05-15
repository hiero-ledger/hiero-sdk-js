import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    AccountInfoQuery,
    TransactionReceiptQuery,
    AccountCreateTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/*
Reference: [HIP-583 Expand alias support in CryptoCreate & CryptoTransfer Transactions](https://hips.hedera.com/hip/hip-583)
    ## Example 1:
    - Create an ECSDA private key and an ECDSA admin private key
    - Extract the ECDSA public key
    - Extract the Ethereum public address
    - Use the `AccountCreateTransaction`
        - populate `setAlias(evmAddress)` field with the Ethereum public address
        - populate the `setReceiverSignatureRequired` to true
    - Sign the `AccountCreateTransaction` transaction with both the new private key and the admin key
    - Get the `AccountInfo` and show that the account has contractAccountId
*/

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required.",
        );
    }
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const nodes = {
        "127.0.0.1:50211": new AccountId(3),
    };

    const client = Client.forNetwork(nodes).setOperator(
        operatorId,
        operatorKey,
    );

    try {
        /**
         * Step 1
         *
         * Create an ECSDA private key and an ECDSA admin private key
         */
        const adminKey = PrivateKey.generateECDSA();
        console.log(`Admin private key: ${adminKey.toStringDer()}`);

        const privateKey = PrivateKey.generateECDSA();
        console.log(`Private key: ${privateKey.toStringDer()}`);

        /**
         * Step 2
         *
         * Extract the ECDSA public key
         */
        const publicKey = privateKey.publicKey;
        console.log(`Public key: ${publicKey.toStringDer()}`);

        /**
         *
         * Step 3
         *
         * Extract the Ethereum public address
         */
        const evmAddress = publicKey.toEvmAddress();
        console.log(`Corresponding evm address: ${evmAddress}`);

        /**
         *
         * Step 4
         *
         * Use the `AccountCreateTransaction`
         *   - Populate `setAlias(evmAddress)` field with the Ethereum public address
         *   - Populate the `setReceiverSignatureRequired()` to `true`
         */
        const accountCreateTx = new AccountCreateTransaction()
            .setReceiverSignatureRequired(true)
            .setInitialBalance(Hbar.fromTinybars(100))
            .setKeyWithoutAlias(adminKey)
            .setAlias(evmAddress)
            .freezeWith(client);

        /**
         *
         * Step 5
         *
         * Sign the `AccountCreateTransaction` transaction with both the new private key and key paying for the transaction fee
         */
        const accountCreateTxSign = await (
            await accountCreateTx.sign(privateKey)
        ).sign(adminKey);
        const accountCreateTxResponse =
            await accountCreateTxSign.execute(client);

        /**
         *
         * Step 6
         *
         * Get the account ID of the newly created account
         */
        const receipt = await new TransactionReceiptQuery()
            .setTransactionId(accountCreateTxResponse.transactionId)
            .execute(client);

        const newAccountId = receipt.accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 7
         *
         * Get the `AccountInfo` and show that the account has contractAccountId
         */
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        accountInfo.contractAccountId !== null
            ? console.log(
                  `The newly created account has an alias: ${accountInfo.contractAccountId}`,
              )
            : console.log(`The new account doesn't have an alias`);
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
