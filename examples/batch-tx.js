import {
    Client,
    PrivateKey,
    AccountId,
    Hbar,
    AccountCreateTransaction,
    BatchTransaction,
    Logger,
    LogLevel,
    TransferTransaction,
    HbarUnit,
    TransactionId,
    AccountBalanceQuery,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

async function main() {
    /**
     *  Step 1: Create Client
     */
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const operatorAccId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorPrivKey = PrivateKey.fromStringECDSA(
        process.env.OPERATOR_KEY,
    );

    const client = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(operatorAccId, operatorPrivKey)
        .setLogger(new Logger(LogLevel.Silent));

    await executeBatchWithBatchify(client);
    await executeBatchWithManualInnerTransactionFreeze(client);
    await executeBatchWithSetInnerTransactions(client);
    client.close();
}

/**
 * This example demonstrates the simplified approach to batch transactions using the batchify method.
 * It creates a single HBAR transfer from Alice to the operator,
 * batches it with a single batch key, and verifies account balances
 * before and after execution.
 * @param {Client} client
 */
async function executeBatchWithBatchify(client) {
    /**
     * Step 1: Create batch key and prepare transfers for batching
     */

    const batchKey1 = PrivateKey.generateECDSA();

    /**
     * Step 2: Create account for Alice
     */
    const aliceKey = PrivateKey.generateECDSA();
    const alice = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(aliceKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    /**
     * Step 3: Create client for Alice
     */
    const aliceClient = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(alice, aliceKey)
        .setLogger(new Logger(LogLevel.Info));

    /**
     * Step 4: Batchify a transfer transaction
     */
    const aliceBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(alice, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .batchify(aliceClient, batchKey1);
    aliceClient.close();

    console.log("Created account for Alice: " + aliceClient.toString());

    /**
     * Step 5: Get the balance in order to compare after this batch
     */
    const aliceBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(alice)
        .execute(client);
    var operatorBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(client.getOperator().accountId)
        .execute(client);

    /**
     * Step 6: Execute the batch transaction
     */
    console.log("Executing batch transaction...");
    const batch = await new BatchTransaction()
        .addInnerTransaction(aliceBatchedTransfer)
        .freezeWith(client)
        .sign(batchKey1);

    const batchId = await (await batch.execute(client)).getReceipt(client);

    console.log(
        "Batch transaction executed with status: " + batchId.status.toString(),
    );

    /**
     * Step 7: Verify the balance after batch transaction
     */
    console.log("Verifying the balance after batch transaction...");

    const aliceBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(alice)
        .execute(client);
    const operatorBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(client.getOperator().accountId)
        .execute(client);

    console.log("Alice balance after: " + aliceBalanceAfter.hbars.toString());
    console.log(
        "Operator balance after: " + operatorBalanceAfter.hbars.toString(),
    );

    console.log(
        "Alice's original balance: " + aliceBalanceBefore.hbars.toString(),
    );
    console.log(
        "Operator's original balance: " +
            operatorBalanceBefore.hbars.toString(),
    );
}

/**
 * This example shows how to manually create multiple inner transactions with different batch
 * keys. It creates three separate accounts (Alice, Bob, Carol), freezes
 * individual transfer transactions with their respective batch keys,
 * combines them into a single batch transaction,
 * and verifies all account balances before and after execution.
 * @param {Client} client
 */
async function executeBatchWithManualInnerTransactionFreeze(client) {
    /**
     * Step 1: Create three account create transactions
     * and prepare transfers for batching.
     */
    const batchKey1 = PrivateKey.generateECDSA();
    const batchKey2 = PrivateKey.generateECDSA();
    const batchKey3 = PrivateKey.generateECDSA();

    const aliceKey = PrivateKey.generateECDSA();
    const alice = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(aliceKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    console.log("Created first account (Alice): " + alice.toString());

    const aliceBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(alice, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .setBatchKey(batchKey1)
        .setTransactionId(TransactionId.generate(alice))
        .freezeWith(client)
        .sign(aliceKey);

    const bobKey = PrivateKey.generateECDSA();
    const bob = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(bobKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    console.log("Created second account (Bob): " + bob.toString());

    const bobBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(bob, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .setBatchKey(batchKey2)
        .setTransactionId(TransactionId.generate(bob))
        .freezeWith(client)
        .sign(bobKey);

    const carolKey = PrivateKey.generateECDSA();
    const carol = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(carolKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    console.log("Created third account (Carol): " + carol.toString());

    const carolBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(carol, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .setBatchKey(batchKey3)
        .setTransactionId(TransactionId.generate(carol))
        .freezeWith(client)
        .sign(carolKey);

    /**
     * Step 2: Get the balance in order to compare after this batch
     */
    const aliceBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(alice)
        .execute(client);

    var bobBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(bob)
        .execute(client);

    var carolBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(carol)
        .execute(client);

    var operatorBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(client.getOperator().accountId)
        .execute(client);

    /**
     * Step 3: Execute the batch transaction
     */
    console.log("Executing batch transaction...");
    const batch = await (
        await (
            await new BatchTransaction()
                .addInnerTransaction(aliceBatchedTransfer)
                .addInnerTransaction(bobBatchedTransfer)
                .addInnerTransaction(carolBatchedTransfer)
                .freezeWith(client)
                .sign(batchKey1)
        ).sign(batchKey2)
    ).sign(batchKey3);

    const batchId = await (await batch.execute(client)).getReceipt(client);

    console.log(
        "Batch transaction executed with status: " + batchId.status.toString(),
    );

    console.log("Verifying the balance after batch transaction...");

    const aliceBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(alice)
        .execute(client);
    const bobBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(bob)
        .execute(client);
    const carolBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(carol)
        .execute(client);
    const operatorBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(client.getOperator().accountId)
        .execute(client);

    console.log("Alice balance after: " + aliceBalanceAfter.hbars.toString());
    console.log("Bob balance after: " + bobBalanceAfter.hbars.toString());
    console.log("Carol balance after: " + carolBalanceAfter.hbars.toString());
    console.log(
        "Operator balance after: " + operatorBalanceAfter.hbars.toString(),
    );

    console.log(
        "Alice's original balance: " + aliceBalanceBefore.hbars.toString(),
    );
    console.log("Bob's original balance: " + bobBalanceBefore.hbars.toString());
    console.log(
        "Carol's original balance: " + carolBalanceBefore.hbars.toString(),
    );
    console.log(
        "Operator's original balance: " +
            operatorBalanceBefore.hbars.toString(),
    );
}

/**
 * This example demonstrates using setInnerTransactions to set all transactions at once.
 * It creates three accounts (David, Eve, Frank), prepares batchified transfer transactions,
 * and executes them in a single batch using the setInnerTransactions method.
 * @param {Client} client
 */
async function executeBatchWithSetInnerTransactions(client) {
    /**
     * Step 1: Create accounts for David, Eve, and Frank
     */
    console.log("Created accounts for David, Eve, and Frank");
    
    const davidKey = PrivateKey.generateECDSA();
    const david = (
        await (
            await new AccountCreateTransaction()
                .setKey(davidKey.publicKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    const eveKey = PrivateKey.generateECDSA();
    const eve = (
        await (
            await new AccountCreateTransaction()
                .setKey(eveKey.publicKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    const frankKey = PrivateKey.generateECDSA();
    const frank = (
        await (
            await new AccountCreateTransaction()
                .setKey(frankKey.publicKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;

    console.log("Created third account (David): " + david.toString());
    console.log("Created fourth account (Eve): " + eve.toString());
    console.log("Created fifth account (Frank): " + frank.toString());

    /**
     * Step 2: Create separate clients for each account
     */
    const davidClient = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(david, davidKey)
        .setLogger(new Logger(LogLevel.Silent));
    const eveClient = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(eve, eveKey)
        .setLogger(new Logger(LogLevel.Silent));
    const frankClient = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(frank, frankKey)
        .setLogger(new Logger(LogLevel.Silent));

    /**
     * Step 3: Create a shared batch key
     */
    const batchKey = PrivateKey.generateECDSA();

    /**
     * Step 4: Batchify transfer transactions for each account
     */
    const davidBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(david, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(client.getOperator().accountId, Hbar.from(1, HbarUnit.Hbar))
        .batchify(davidClient, batchKey);

    const eveBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(eve, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(client.getOperator().accountId, Hbar.from(1, HbarUnit.Hbar))
        .batchify(eveClient, batchKey);

    const frankBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(frank, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(client.getOperator().accountId, Hbar.from(1, HbarUnit.Hbar))
        .batchify(frankClient, batchKey);

    /**
     * Step 5: Get balances before batch transaction
     */
    const davidBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(david)
        .execute(client);
    const eveBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(eve)
        .execute(client);
    const frankBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(frank)
        .execute(client);
    const operatorBalanceBefore = await new AccountBalanceQuery()
        .setAccountId(client.getOperator().accountId)
        .execute(client);

    /**
     * Step 6: Execute batch transaction using setInnerTransactions
     */
    console.log("Executing batch transaction using setInnerTransactions...");

    const batch = await new BatchTransaction()
        .setInnerTransactions([
            davidBatchedTransfer,
            eveBatchedTransfer,
            frankBatchedTransfer,
        ])
        .freezeWith(client)
        .sign(batchKey);

    const batchId = await (await batch.execute(client)).getReceipt(client);

    console.log(
        "Batch transaction executed with status: " + batchId.status.toString(),
    );

    console.log("Verifying the balance after batch transaction...");

    const davidBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(david)
        .execute(client);
    const eveBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(eve)
        .execute(client);
    const frankBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(frank)
        .execute(client);
    const operatorBalanceAfter = await new AccountBalanceQuery()
        .setAccountId(client.getOperator().accountId)
        .execute(client);

    console.log("David balance after: " + davidBalanceAfter.hbars.toString());
    console.log("Eve balance after: " + eveBalanceAfter.hbars.toString());
    console.log("Frank balance after: " + frankBalanceAfter.hbars.toString());
    console.log(
        "Operator balance after: " + operatorBalanceAfter.hbars.toString(),
    );

    console.log(
        "David's original balance: " + davidBalanceBefore.hbars.toString(),
    );
    console.log("Eve's original balance: " + eveBalanceBefore.hbars.toString());
    console.log(
        "Frank's original balance: " + frankBalanceBefore.hbars.toString(),
    );
    console.log(
        "Operator's original balance: " +
            operatorBalanceBefore.hbars.toString(),
    );

    // Close the additional clients
    davidClient.close();
    eveClient.close();
    frankClient.close();
}

void main();
