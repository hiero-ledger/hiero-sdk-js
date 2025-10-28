import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    Timestamp,
    TransactionId,
    AccountCreateTransaction,
    TransferTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";
dotenv.config();

/*
Examples that demonstrates the use of generating transaction IDs on demand

## Example 1:
Sometimes, when you are trying to execute transactions `asynchronosly`,
there is a tiny bit of chance to generate the same `transactionId` given the same `accountId`
and the current timestamp.

With the following approach to generate custom `transactionId`, this issue is avoided

### Steps
1. Create an account to whom to send tinybars
2. Make a thousand iterations of transfer transactions with custom generated `transactionId`
3. Await the receipts of every transaction
4. Check if the count of receipts with status `SUCCESS` equals the count of transactions (should be 1000)


## Example 2:
The `TransactionId` object contains the valid start time for the transaction. This means that
by setting the valid start time to a moment in the future, you would be able to execute the transaction
after the set period (in seconds)

1. Create custom `transactionId` with valid start 10 seconds after the current time
2. Wait 15 seconds in order for the transaction to be valid and then submit it
*/

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
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    let client;

    try {
        // Local node
        client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
            operatorId,
            operatorKey,
        );
    } catch (error) {
        throw new Error(
            "Environment variables HEDERA_NETWORK, OPERATOR_ID, and OPERATOR_KEY are required.",
        );
    }

    try {
        /**
         *     Example 1
         *
         * Step 1
         *
         * Create an account to whom to send tinybars
         */
        const newKey = PrivateKey.generate();

        console.log(`New account private key: ${newKey.toString()}`);
        console.log(`New account public key: ${newKey.publicKey.toString()}`);

        const accountCreateTx = await new AccountCreateTransaction()
            .setInitialBalance(new Hbar(10)) // 10 h
            .setKeyWithoutAlias(newKey.publicKey)
            .freezeWith(client)
            .execute(client);

        const newAccountId = (
            await accountCreateTx.getReceipt(client)
        ).accountId.toString();
        console.log(`New account id: ${newAccountId}`);

        /**
         * Step 2
         *
         * Make a thousand iterations of transfer transactions
         * with custom generated `transactionId`
         */
        const transactionsCount = 1000;
        let transactions = [];
        let nanosOffset = 1000000;
        for (let i = 0; i < transactionsCount; i++) {
            const seconds = Math.round(Date.now() / 1000);
            const validStart = new Timestamp(seconds, nanosOffset);
            nanosOffset += 10000;

            const transactionId = TransactionId.withValidStart(
                operatorId,
                validStart,
            );

            const transferHbar = new TransferTransaction()
                .setTransactionId(transactionId)
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
                .addHbarTransfer(newAccountId, Hbar.fromTinybars(1));

            transactions.push(transferHbar.execute(client));
        }
        const responsesResult = await Promise.all(transactions);

        /**
         * Step 3
         *
         * Await the receipts of every transaction
         */
        let count = 0;
        let receipts = [];
        for (let i = 0; i < responsesResult.length; i++) {
            receipts.push(responsesResult[i].getReceipt(client));
        }
        const receiptsResult = await Promise.all(receipts);

        /**
         * Step 4
         *
         * Check if the count of receipts with status `SUCCESS` equals the count of transactions (should be 1000)
         */
        receiptsResult.forEach((receipt) =>
            receipt.status.toString() == "SUCCESS"
                ? count++
                : console.log(`Failed with: ${receipt.status.toString()}`),
        );
        transactionsCount == count
            ? console.log(`All transactions are executed successfully`)
            : console.log(
                  `${transactionsCount - count} unsuccessful transactions`,
              );

        /**
         *     Example 2
         *
         * Step 1
         *
         * Create custom `transactionId` with valid start 10 seconds after the current time
         */
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const secondsDelay = 10;
        const seconds = nowInSeconds + secondsDelay;
        const validStart = new Timestamp(seconds, 0);
        const transactionId = TransactionId.withValidStart(
            operatorId,
            validStart,
        );

        /**
         * Step 2
         *
         * Wait 15 seconds in order for the transaction to be valid and then submit it
         */
        await wait(15000);

        const transferHbar = await new TransferTransaction()
            .setTransactionId(transactionId)
            .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
            .addHbarTransfer(newAccountId, Hbar.fromTinybars(1))
            .execute(client);

        const status = (
            await transferHbar.getReceipt(client)
        ).status.toString();

        console.log(`STATUS: ${status}`);
    } catch (error) {
        console.log("ERROR", error);
    }

    client.close();
}

/**
 * @param {number} timeout
 * @returns {Promise<any>}
 */
function wait(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
}

void main();
