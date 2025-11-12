import {
    AccountId,
    PrivateKey,
    Client,
    TransferTransaction,
    AccountInfoQuery,
    TransactionReceiptQuery,
    TopicCreateTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/*
Lazy-create a new account using a public-address via a `TransferTransaction`.

Reference: [HIP-583 Expand alias support in CryptoCreate & CryptoTransfer Transactions](https://hips.hedera.com/hip/hip-583)

## Example 2
- Create an ECSDA private key 
- Extract the ECDSA public key
- Extract the Ethereum public address
  - Add function to calculate the Ethereum Address to in SDK
  - Ethereum account address / public-address - This is the rightmost 20 bytes of the 32 byte Keccak-256 hash of the ECDSA public key of the account. This calculation is in the manner described by the Ethereum Yellow Paper.
- Use the `TransferTransaction` 
   - Populate the `FromAddress` with the sender Hedera AccountID
   - Populate the `ToAddress` with Ethereum public address
   - Note: Can transfer from public address to public address in the `TransferTransaction` for complete accounts. Transfers from hollow accounts will not work because the hollow account does not have a public key assigned to authorize transfers out of the account
- Sign the `TransferTransaction` transaction using an existing Hedera account and key paying for the transaction fee
- The `AccountCreateTransaction` is executed as a child transaction triggered by the `TransferTransaction`
- The Hedera Account that was created has a public address the user specified in the TransferTransaction ToAddress
       - Will not have a public key at this stage
       - Cannot do anything besides receive tokens or hbars
       - The alias property of the account does not have the public address
       - Referred to as a hollow account
- To get the new account ID ask for the child receipts or child records for the parent transaction ID of the `TransferTransaction`
- Get the `AccountInfo` and verify the account is a hollow account with the supplied public address (may need to verify with mirror node API)
- To enhance the hollow account to have a public key the hollow account needs to be specified as a transaction fee payer in a HAPI transaction
- Create a HAPI transaction and assign the new hollow account as the transaction fee payer
- Sign with the private key that corresponds to the public key on the hollow account
- Get the `AccountInfo` for the account and return the public key on the account to show it is a complete account
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
         * Use the `TransferTransaction`
         *   - Populate the `FromAddress` with the sender Hedera AccountID
         *   - Populate the `ToAddress` with Ethereum public address
         */
        const transferTx = new TransferTransaction()
            .addHbarTransfer(operatorId, -10)
            .addHbarTransfer(evmAddress, 10)
            .freezeWith(client);

        /**
         *
         * Step 5
         *
         * Sign the `TransferTransaction` transaction using an existing Hedera account and key paying for the transaction fee
         */
        const transferTxSign = await transferTx.sign(operatorKey);
        const transferTxSubmit = await transferTxSign.execute(client);

        /**
         *
         * Step 6
         *
         * To get the new account ID ask for the child receipts or child records for the parent transaction ID of the `TransferTransaction`
         *     - The `AccountCreateTransaction` is executed as a child transaction triggered by the `TransferTransaction`
         */
        const receipt = await new TransactionReceiptQuery()
            .setTransactionId(transferTxSubmit.transactionId)
            .setIncludeChildren(true)
            .execute(client);

        const newAccountId = receipt.children[0].accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         *
         * Step 7
         *
         * Get the `AccountInfo` and verify the account is a hollow account with the supplied public address
         * 
         * The Hedera Account that was created has a public address the user specified in the TransferTransaction ToAddress
       - Will not have a public key at this stage
       - Cannot do anything besides receive tokens or hbars
       - The alias property of the account does not have the public address
       - Referred to as a hollow account
         */
        const hollowAccountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        console.log(`Check if it is a hollow account with 'AccountInfoQuery'`);
        hollowAccountInfo.aliasKey === null &&
        hollowAccountInfo.key._toProtobufKey().keyList.keys.length == 0 &&
        hollowAccountInfo.contractAccountId !== null
            ? console.log(`The newly created account is a hollow account`)
            : console.log(`Not a hollow account`);

        /**
         *
         * Step 8
         *
         * Create a HAPI transaction and assign the new hollow account as the transaction fee payer
         *     - To enhance the hollow account to have a public key the hollow account needs to be specified as a transaction fee payer in a HAPI transaction
         */

        // set the accound id of the hollow account and its private key as an operator
        // in order to be a transaction fee payer in a HAPI transaction
        client.setOperator(newAccountId, privateKey);

        let transaction = new TopicCreateTransaction()
            .setTopicMemo("HIP-583")
            .freezeWith(client);

        /**
         *
         * Step 9
         *
         * Sign with the private key that corresponds to the public key on the hollow account
         */
        const transactionSign = await transaction.sign(privateKey);
        const transactionSubmit = await transactionSign.execute(client);
        const status = (
            await transactionSubmit.getReceipt(client)
        ).status.toString();
        console.log(`HAPI transaction status: ${status}`);

        /**
         *
         * Step 10
         *
         * Get the `AccountInfo` for the account and return the public key on the account to show it is a complete account
         */
        const completeAccountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);
        completeAccountInfo.key !== null
            ? console.log(
                  `The public key of the newly created and now complete account: ${completeAccountInfo.key.toString()}`,
              )
            : console.log(`Account ${newAccountId} is still a hollow account`);
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
