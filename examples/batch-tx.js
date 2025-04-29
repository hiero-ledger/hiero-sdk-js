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
} from "@hashgraph/sdk";

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
    const operatorPrivKey = PrivateKey.fromStringED25519(
        process.env.OPERATOR_KEY,
    );

    const client = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(operatorAccId, operatorPrivKey)
        .setLogger(new Logger(LogLevel.Silent));

    await executeBatchWithBatchify(client);
    await executeBatchWithManualInnerTransactionFreeze(client);
    client.close();
}

/**
 *
 * @param {Client} client
 */
async function executeBatchWithBatchify(client) {
    /**
     * Step 2:
     * Create three account create transactions with batch keys, but do not execute them.
     **/

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
    const aliceClient = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(alice, aliceKey)
        .setLogger(new Logger(LogLevel.Info));
    const aliceBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(alice, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .batchify(aliceClient, batchKey1);
    aliceClient.close();
    console.log("Created first account (Alice): " + alice.toString());

    const bobKey = PrivateKey.generateECDSA();
    const bob = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(bobKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    const bobClient = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        bob,
        bobKey,
    );
    const bobBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(bob, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .batchify(bobClient, batchKey2);
    bobClient.close();
    console.log("Created second account (Bob): " + bob.toString());

    const carolKey = PrivateKey.generateECDSA();
    const carol = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(carolKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    const carolClient = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        carol,
        carolKey,
    );
    const carolBatchedTransfer = await new TransferTransaction()
        .addHbarTransfer(carol, Hbar.from(-1, HbarUnit.Hbar))
        .addHbarTransfer(
            client.getOperator().accountId,
            Hbar.from(1, HbarUnit.Hbar),
        )
        .batchify(carolClient, batchKey3);
    carolClient.close();
    console.log("Created third account (Carol): " + carol.toString());

    /**
     * Step 3:
     * Get the balance in order to compare after this batch
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
     * Step 4:
     * Execute the batch transaction
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
 *
 * @param {Client} client
 */
async function executeBatchWithManualInnerTransactionFreeze(client) {
    /**
     * Step 2:
     * Create three account create transactions with batch keys, but do not execute them.
     **/
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
     * Step 3:
     * Get the balance in order to compare after this batch
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
     * Step 4:
     * Execute the batch transaction
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

void main();
