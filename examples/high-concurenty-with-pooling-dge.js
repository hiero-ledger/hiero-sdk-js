import {
    AccountId,
    Client,
    PrivateKey,
    AccountCreateTransaction,
    AccountBalanceQuery,
    Hbar,
    TransferTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * Example demonstrating high concurrency with channel pooling.
 *
 * This example shows how the channelsPerNode feature enables sending thousands
 * of concurrent transactions without encountering RST_STREAM errors.
 *
 * By using multiple gRPC connections per node (channel pooling), the SDK can
 * handle much higher concurrent throughput than the default single connection.
 * @description Send 10,000 concurrent transfer transactions using channel pooling
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

    const operatorId = AccountId.fromString("0.0.5335115");
    const operatorKey = PrivateKey.fromStringDer(
        "3030020100300706052b8104000a04220420b697e492e20430de5fbb419562fe38b7c540c9a057b3b595fb06a357b560296c",
    );

    // Create client and configure channel pooling
    const client = Client.forTestnet();
    client.setOperator(operatorId, operatorKey);

    // Configure 10 channels per node for high concurrency
    // Each gRPC connection can handle ~100-128 concurrent streams
    // With 10 channels, we can handle ~1,000-1,280 concurrent requests per node
    const channelsPerNode = 10;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    client.setChannelsPerNode(channelsPerNode);

    console.log(`Client configured with ${channelsPerNode} channels per node`);

    console.log("\n=== High Concurrency with Channel Pooling ===\n");

    // Create a temporary account for testing
    console.log("Creating temporary account for testing...");
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    const accountCreateTx = await new AccountCreateTransaction()
        .setKeyWithoutAlias(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    const accountCreateReceipt = await accountCreateTx.getReceipt(client);
    const newAccountId = accountCreateReceipt.accountId;
    console.log(`- New account created: ${newAccountId.toString()}`);

    // Send 10,000 concurrent transfer transactions
    // Without channel pooling, this would cause RST_STREAM errors
    // With 10 channels per node, requests are distributed across connections
    console.log("\nSending 10,000 concurrent transfer transactions...");

    const startTime3 = Date.now();
    const promises3 = [];

    /**
     * @returns {Promise<import("@hiero-ledger/sdk").TransactionReceipt>}
     */
    async function sendTransfer() {
        const response = await new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
            .addHbarTransfer(newAccountId, Hbar.fromTinybars(1))
            .execute(client);
        return response.getReceipt(client);
    }

    for (let i = 0; i < 10000; i++) {
        promises3.push(sendTransfer());
    }

    console.log("- Waiting for all transactions to complete...");
    const receipts = await Promise.all(promises3);
    const endTime3 = Date.now();

    const successCount = receipts.filter(
        (r) => r.status.toString() === "SUCCESS",
    ).length;

    console.log(`\n- Completed in ${endTime3 - startTime3}ms`);
    console.log(`- Successful transfers: ${successCount}/10000`);
    console.log(
        `- Average time per transaction: ${((endTime3 - startTime3) / 10000).toFixed(2)}ms`,
    );

    // Check final balance
    const finalBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log(`\n- Final account balance: ${finalBalance.hbars.toString()}`);

    console.log("\n=== Summary ===");
    console.log(
        "✅ Successfully sent 10,000 concurrent transactions using channel pooling",
    );
    console.log(
        "✅ Channel pooling distributes requests across multiple gRPC connections",
    );
    console.log(
        "✅ This prevents RST_STREAM errors under high concurrent load",
    );
    console.log("\nKey Configuration:");
    console.log(`  - channelsPerNode: ${channelsPerNode} (default is 1)`);
    console.log(
        `  - Theoretical capacity: ~${channelsPerNode * 100}-${channelsPerNode * 128} concurrent streams per node`,
    );

    console.log("\n=== Example Complete ===\n");

    client.close();
}

void main();
