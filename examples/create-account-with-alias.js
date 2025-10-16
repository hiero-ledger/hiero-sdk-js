import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    AccountInfoQuery,
    AccountCreateTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

/*
Reference: [HIP-583 Expand alias support in CryptoCreate & CryptoTransfer Transactions](https://hips.hedera.com/hip/hip-583)
    ## Example 1:
    - Create a ECSDA private key
    - Extract the ECDSA public key
    - Extract the Ethereum public address
    - Use the `AccountCreateTransaction`
        - populate `setAlias(evmAddress)` field with the Ethereum public address
    - Sign the `AccountCreateTransaction` transaction with both the new private key and key paying for the transaction fee
    - Get the `AccountInfo` and show that the account has contractAccountId
*/

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required.",
        );
    }
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);

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
         * Create an ECSDA private key
         */
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
         * Sign the `AccountCreateTransaction` transaction with both the new private key and key paying for the transaction fee
         * Get the account ID of the newly created account
         */
        const receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setInitialBalance(Hbar.fromTinybars(100))
                    .setKeyWithoutAlias(operatorKey)
                    .setAlias(evmAddress)
                    .freezeWith(client)
                    .sign(privateKey)
            ).execute(client)
        ).getReceipt(client);

        const newAccountId = receipt.accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 5
         *
         * Get the `AccountInfo` and show that the account has contractAccountId
         */
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(
            `The newly created account has an alias: ${accountInfo.contractAccountId}`,
        );
    } catch (error) {
        console.error(error);
    }

    /* Create an account with derived EVM alias from private ECDSA account key
     *
     * Reference: [Streamline key and alias specifications for AccountCreateTransaction #2795](https://github.com/hiero-ledger/hiero-sdk-js/issues/2795)
     */
    console.log(
        "---Create an account with derived EVM alias from private ECDSA account key---",
    );

    try {
        /**
         * Step 1
         *
         * Create an ECSDA private key
         */
        const privateKey = PrivateKey.generateECDSA();
        console.log(`Private key: ${privateKey.toStringDer()}`);

        /**
         *
         * Step 2
         *
         * Use the `AccountCreateTransaction`
         *   - Populate `setECDSAKeyWithAlias(privateKey)` field with the generated ECDSA private key
         * Sign the `AccountCreateTransaction` transaction with the generated private key and execute it
         * Get the account ID of the newly created account
         */

        const receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setInitialBalance(Hbar.fromTinybars(100))
                    .setECDSAKeyWithAlias(privateKey)
                    .freezeWith(client)
                    .sign(privateKey)
            ).execute(client)
        ).getReceipt(client);

        const newAccountId = receipt.accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 3
         *
         * Get the `AccountInfo` and examine the created account key and alias
         */
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(
            `Account's key ${accountInfo.key.toString()} is the same as ${privateKey.publicKey.toStringDer()}`,
        );

        if (
            !accountInfo.contractAccountId.startsWith(
                "000000000000000000000000",
            )
        ) {
            console.log(
                `Initial EVM address: ${privateKey.publicKey.toEvmAddress()} is the same as ${
                    accountInfo.contractAccountId
                }`,
            );
        } else {
            console.log(`The new account doesn't have an EVM alias`);
        }
    } catch (error) {
        console.error(error);
    }

    /* Create an account with derived EVM alias from private ECDSA alias key
     *
     * Reference: [Streamline key and alias specifications for AccountCreateTransaction #2795](https://github.com/hiero-ledger/hiero-sdk-js/issues/2795)
     */

    console.log(
        "---Create an account with derived EVM alias from private ECDSA alias key---",
    );

    try {
        /**
         * Step 1
         *
         * Create an account key and an ECSDA private alias key
         */
        const key = PrivateKey.generateECDSA();
        const aliasKey = PrivateKey.generateECDSA();
        console.log(`Alias key: ${aliasKey.toStringDer()}`);

        /**
         *
         * Step 2
         *
         * Use the `AccountCreateTransaction`
         *   - Populate `setKeyWithAlias(key, privateKey)` fields with the generated account key and the alias ECDSA private key
         * Sign the `AccountCreateTransaction` transaction with both keys and execute.
         * Get the account ID of the newly created account
         *
         */

        const receipt = await (
            await (
                await (
                    await new AccountCreateTransaction()
                        .setInitialBalance(Hbar.fromTinybars(100))
                        .setKeyWithAlias(key, aliasKey)
                        .freezeWith(client)
                        .sign(key)
                ).sign(aliasKey)
            ).execute(client)
        ).getReceipt(client);

        const newAccountId = receipt.accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 3
         *
         * Get the `AccountInfo` and examine the created account key and alias
         */
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(
            `Account's key ${accountInfo.key.toString()} is the same as ${key.publicKey.toString()}`,
        );

        if (
            !accountInfo.contractAccountId.startsWith(
                "000000000000000000000000",
            )
        ) {
            console.log(
                `Initial EVM address: ${accountInfo.contractAccountId} is the same as ${aliasKey.publicKey.toEvmAddress()}`,
            );
        } else {
            console.log(`The new account doesn't have an alias`);
        }
    } catch (error) {
        console.error(error);
    }

    /* Create an account with derived EVM alias from public ECDSA account key
     *
     * Reference: [Streamline key and alias specifications for AccountCreateTransaction #2795](https://github.com/hiero-ledger/hiero-sdk-js/issues/2795)
     */
    console.log(
        "---Create an account with derived EVM alias from public ECDSA account key---",
    );

    try {
        /**
         * Step 1
         *
         * Create an ECSDA private key and derive the public key
         */
        const privateKey = PrivateKey.generateECDSA();
        console.log(`Private key: ${privateKey.toStringDer()}`);

        const publicKey = privateKey.publicKey;
        console.log(`Public key: ${publicKey.toStringDer()}`);

        /**
         *
         * Step 2
         *
         * Use the `AccountCreateTransaction`
         *   - Populate `setECDSAKeyWithAlias(publicKey)` field with the derived ECDSA public key
         * Sign the `AccountCreateTransaction` transaction with the generated private key and execute it
         * Get the account ID of the newly created account
         */

        const receipt = await (
            await (
                await new AccountCreateTransaction()
                    .setInitialBalance(Hbar.fromTinybars(100))
                    .setECDSAKeyWithAlias(publicKey)
                    .freezeWith(client)
                    .sign(privateKey)
            ).execute(client)
        ).getReceipt(client);

        const newAccountId = receipt.accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 3
         *
         * Get the `AccountInfo` and examine the created account key and alias
         */
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(
            `Account's key ${accountInfo.key.toString()} is the same as ${privateKey.publicKey.toStringDer()}`,
        );

        if (
            !accountInfo.contractAccountId.startsWith(
                "000000000000000000000000",
            )
        ) {
            console.log(
                `Initial EVM address: ${privateKey.publicKey.toEvmAddress()} is the same as ${
                    accountInfo.contractAccountId
                }`,
            );
        } else {
            console.log(`The new account doesn't have an EVM alias`);
        }
    } catch (error) {
        console.error(error);
    }

    /* Create an account with derived EVM alias from public ECDSA alias key
     *
     * Reference: [Streamline key and alias specifications for AccountCreateTransaction #2795](https://github.com/hiero-ledger/hiero-sdk-js/issues/2795)
     */

    console.log(
        "---Create an account with derived EVM alias from public ECDSA alias key---",
    );

    try {
        /**
         * Step 1
         *
         * Create an account key and an derive an ECSDA public alias key
         */
        const key = PrivateKey.generateECDSA();
        const aliasKey = PrivateKey.generateECDSA();
        const publicAliasKey = aliasKey.publicKey;

        console.log(`Public alias key: ${publicAliasKey.toStringDer()}`);

        /**
         *
         * Step 2
         *
         * Use the `AccountCreateTransaction`
         *   - Populate `setKeyWithAlias(key, publicKey)` fields with the generated account key and the alias ECDSA public key
         * Sign the `AccountCreateTransaction` transaction with both keys and execute.
         * Get the account ID of the newly created account
         *
         */

        const receipt = await (
            await (
                await (
                    await new AccountCreateTransaction()
                        .setInitialBalance(Hbar.fromTinybars(100))
                        .setKeyWithAlias(key, publicAliasKey)
                        .freezeWith(client)
                        .sign(key)
                ).sign(aliasKey)
            ).execute(client)
        ).getReceipt(client);

        const newAccountId = receipt.accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 3
         *
         * Get the `AccountInfo` and examine the created account key and alias
         */
        const accountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(
            `Account's key ${accountInfo.key.toString()} is the same as ${key.publicKey.toString()}`,
        );

        if (
            !accountInfo.contractAccountId.startsWith(
                "000000000000000000000000",
            )
        ) {
            console.log(
                `Initial EVM address: ${accountInfo.contractAccountId} is the same as ${aliasKey.publicKey.toEvmAddress()}`,
            );
        } else {
            console.log(`The new account doesn't have an alias`);
        }
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
