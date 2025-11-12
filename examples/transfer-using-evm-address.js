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
Transfer HBAR or tokens to a Hedera account using their public-address.

Reference: [HIP-583 Expand alias support in CryptoCreate & CryptoTransfer Transactions](https://hips.hedera.com/hip/hip-583)

## Example 1
- Create an ECSDA private key 
- Extract the ECDSA public key
- Extract the Ethereum public address
  - Add function to calculate the Ethereum Address to example in SDK
  - Ethereum account address / public-address - This is the rightmost 20 bytes of the 32 byte Keccak-256 hash of the ECDSA public key of the account. This calculation is in the manner described by the Ethereum Yellow Paper.
- Transfer tokens using the `TransferTransaction` to the Ethereum Account Address
- The From field should be a complete account that has a public address
- The To field should be to a public address (to create a new account)
- Get the child receipt or child record to return the Hedera Account ID for the new account that was created
- Get the `AccountInfo` on the new account and show it is a hollow account by not having a public key
- This is a hollow account in this state
- Use the hollow account as a transaction fee payer in a HAPI transaction
- Sign the transaction with ECDSA private key
- Get the `AccountInfo` of the account and show the account is now a complete account by returning the public key on the account
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
         * Step 4
         *
         * Transfer tokens using the `TransferTransaction` to the Etherеum Account Address
         *    - The From field should be a complete account that has a public address
         *    - The To field should be to a public address (to create a new account)
         */
        const transferTx = new TransferTransaction()
            .addHbarTransfer(operatorId, -10)
            .addHbarTransfer(evmAddress, 10)
            .freezeWith(client);

        const transferTxSign = await transferTx.sign(operatorKey);
        const transferTxSubmit = await transferTxSign.execute(client);

        /**
         * Step 5
         *
         * Get the child receipt or child record to return the Hedera Account ID for the new account that was created
         */
        const receipt = await new TransactionReceiptQuery()
            .setTransactionId(transferTxSubmit.transactionId)
            .setIncludeChildren(true)
            .execute(client);

        const newAccountId = receipt.children[0].accountId.toString();
        console.log(`Account ID of the newly created account: ${newAccountId}`);

        /**
         * Step 6
         *
         * Get the `AccountInfo` on the new account and show it is a hollow account by not having a public key
         */
        const hollowAccountInfo = await new AccountInfoQuery()
            .setAccountId(newAccountId)
            .execute(client);

        hollowAccountInfo.key._toProtobufKey().keyList.keys.length == 0
            ? console.log(
                  `Account ${newAccountId} does not have public key, therefore it is a hollow account`,
              )
            : console.log(
                  `Account ${newAccountId} has a public key, therefore it is not a hollow account`,
              );

        /**
         * Step 7
         *
         * Use the hollow account as a transaction fee payer in a HAPI transaction
         */

        // set the accound id of the hollow account and its private key as an operator
        // in order to be a transaction fee payer in a HAPI transaction
        client.setOperator(newAccountId, privateKey);

        let transaction = new TopicCreateTransaction()
            .setTopicMemo("HIP-583")
            .freezeWith(client);

        /**
         * Step 8
         *
         * Sign the transaction with ECDSA private key
         */
        const transactionSign = await transaction.sign(privateKey);
        const transactionSubmit = await transactionSign.execute(client);
        const status = (
            await transactionSubmit.getReceipt(client)
        ).status.toString();
        console.log(`HAPI transaction status: ${status}`);

        /**
         * Step 9
         *
         * Get the `AccountInfo` of the account and show the account is now a complete account by returning the public key on the account
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
