import {
    AccountCreateTransaction,
    AccountDeleteTransaction,
    PrivateKey,
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TransactionResponse", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const record = await transaction.getRecord(env.client);

        expect(hex.encode(record.transactionHash)).to.be.equal(
            hex.encode(transaction.transactionHash),
        );

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should make a transaction receipt query available", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const transactionReceiptQuery = transaction.getReceiptQuery();
        expect(transactionReceiptQuery).to.not.be.null;

        const record = await transaction.getRecord(env.client);

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should make a transaction record query available", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const transaction = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key.publicKey)
            .execute(env.client);

        const transactionRecordQuery = transaction.getRecordQuery();
        expect(transactionRecordQuery).to.not.be.null;

        const record = await transaction.getRecord(env.client);

        const account = record.receipt.accountId;
        expect(account).to.not.be.null;

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setTransferAccountId(operatorId)
                    .freezeWith(env.client)
                    .sign(key)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should return nextExchangeRate in receipt", async function () {
        const operatorId = env.operatorId;
        expect(operatorId).to.not.be.null;

        const key = PrivateKey.generateED25519();

        const receipt = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client)
        ).getReceipt(env.client);

        expect(receipt.nextExchangeRate).to.not.be.null;
    });

    describe("receipt node failover", function () {
        it("should pin receipt query to submitting node by default", async function () {
            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client);

            // Get receipt query without client (default behavior)
            const receiptQuery = response.getReceiptQuery();

            // Should be pinned to submitting node only
            expect(receiptQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );

            // Verify receipt can still be obtained
            const receipt = await response.getReceipt(env.client);
            expect(receipt.accountId).to.not.be.null;

            // Clean up
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(receipt.accountId)
                        .setTransferAccountId(env.operatorId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        });

        it("should allow receipt query failover when enabled", async function () {
            // Enable receipt node failover
            env.client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client);

            // Get receipt query with failover enabled
            const receiptQuery = response.getReceiptQuery(env.client);

            // Should have multiple nodes
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // First node should be the submitting node
            expect(receiptQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );

            // Verify no duplicate nodes
            const nodeStrings = receiptQuery._nodeAccountIds.list.map((node) =>
                node.toString(),
            );
            const uniqueNodes = new Set(nodeStrings);
            expect(nodeStrings.length).to.equal(uniqueNodes.size);

            // Verify receipt can still be obtained with failover enabled
            const receipt = await response.getReceipt(env.client);
            expect(receipt.accountId).to.not.be.null;

            // Clean up
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(receipt.accountId)
                        .setTransferAccountId(env.operatorId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Reset the flag for other tests
            env.client.setAllowReceiptNodeFailover(false);
        });

        it("should successfully get receipt with failover even if submitting node is first in list", async function () {
            // Enable receipt node failover
            env.client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            // Execute transaction
            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client);

            // Get the receipt - should succeed with failover enabled
            const receipt = await response.getReceipt(env.client);

            expect(receipt.accountId).to.not.be.null;
            expect(receipt.status.toString()).to.equal("SUCCESS");

            // Verify the receipt query was configured for failover
            const receiptQuery = response.getReceiptQuery(env.client);
            expect(receiptQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // Clean up
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(receipt.accountId)
                        .setTransferAccountId(env.operatorId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Reset the flag for other tests
            env.client.setAllowReceiptNodeFailover(false);
        });
    });

    describe("record node failover", function () {
        it("should pin record query to submitting node by default", async function () {
            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client);

            // Get record query without passing client (default behavior)
            const recordQuery = response.getRecordQuery();

            // Should be pinned to submitting node only
            expect(recordQuery._nodeAccountIds.list).to.have.lengthOf(1);
            expect(recordQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );

            // Verify record can still be obtained
            const record = await response.getRecord(env.client);
            expect(record.receipt.accountId).to.not.be.null;

            // Clean up
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(record.receipt.accountId)
                        .setTransferAccountId(env.operatorId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);
        });

        it("should allow record query failover when enabled", async function () {
            // Enable receipt node failover (applies to record queries too)
            env.client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client);

            // Get record query with failover enabled
            const recordQuery = response.getRecordQuery(env.client);

            // Should have multiple nodes
            expect(recordQuery._nodeAccountIds.list.length).to.be.greaterThan(
                1,
            );

            // First node should be the submitting node
            expect(recordQuery._nodeAccountIds.list[0].toString()).to.equal(
                response.nodeId.toString(),
            );

            // Verify record can still be obtained with failover enabled
            const record = await response.getRecord(env.client);
            expect(record.receipt.accountId).to.not.be.null;

            // Clean up
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(record.receipt.accountId)
                        .setTransferAccountId(env.operatorId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Reset the flag for other tests
            env.client.setAllowReceiptNodeFailover(false);
        });

        it("should successfully get verbose record with failover enabled", async function () {
            // Enable receipt node failover
            env.client.setAllowReceiptNodeFailover(true);

            const key = PrivateKey.generateED25519();

            // Execute transaction
            const response = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key.publicKey)
                .execute(env.client);

            // Get the verbose record - should succeed with failover enabled
            const record = await response.getVerboseRecord(env.client);

            expect(record.receipt.accountId).to.not.be.null;
            expect(record.receipt.status.toString()).to.equal("SUCCESS");

            // Clean up
            await (
                await (
                    await new AccountDeleteTransaction()
                        .setAccountId(record.receipt.accountId)
                        .setTransferAccountId(env.operatorId)
                        .freezeWith(env.client)
                        .sign(key)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Reset the flag for other tests
            env.client.setAllowReceiptNodeFailover(false);
        });
    });

    afterAll(async function () {
        await env.close();
    });
});
