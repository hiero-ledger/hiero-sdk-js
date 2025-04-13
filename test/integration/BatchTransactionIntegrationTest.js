import { expect } from "chai";
import {
    PrivateKey,
    AccountId,
    Hbar,
    AccountCreateTransaction,
    BatchTransaction,
    AccountInfoQuery,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    Status,
    FreezeTransaction,
    Timestamp,
    FreezeType,
} from "../../src/index.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("BatchTransaction", function () {
    let env;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("can create batch transaction", async function () {
        const key = PrivateKey.generateECDSA();

        const tx1 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const batchTransaction = new BatchTransaction().addInnerTransaction(
            tx1,
        );

        const receipt = await (
            await batchTransaction.execute(env.client)
        ).getReceipt(env.client);
        expect(receipt.status).to.equal(Status.Success);

        const accountIdInnerTransaction =
            batchTransaction.innerTransactionIds[0].accountId;

        const accountInfo = await new AccountInfoQuery()
            .setAccountId(accountIdInnerTransaction)
            .execute(env.client);
        expect(accountIdInnerTransaction.toString()).to.equal(
            accountInfo.accountId.toString(),
        );
    });

    it("can execute a large batch transaction up to maximum request size", async function () {
        const batchTransaction = new BatchTransaction();

        // 50 is the maximum limit for internal transaction inside a BatchTransaction
        for (let i = 0; i < 20; i++) {
            const key = PrivateKey.generateECDSA();
            const tx = await new AccountCreateTransaction()
                .setKeyWithoutAlias(key)
                .setInitialBalance(new Hbar(1))
                .batchify(env.client, env.operatorKey);
            batchTransaction.addInnerTransaction(tx);
        }

        const receipt = await (
            await batchTransaction.execute(env.client)
        ).getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
    });

    it("batch transaction with empty inner transaction's list should throw an error", async function () {
        const batchTransaction = new BatchTransaction();

        try {
            await (
                await batchTransaction.execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(Status.BatchListEmpty.toString());
        }
    });

    it("blacklisted inner transaction should throw an error", async function () {
        const env = await IntegrationTestEnv.new();
        const batchTransaction = new BatchTransaction();
        const seconds = Math.round(Date.now() / 1000);
        const validStart = new Timestamp(seconds, 0);

        const tx1 = await new FreezeTransaction()
            .setStartTimestamp(validStart)
            .setFreezeType(new FreezeType(1))
            .batchify(env.client, env.operatorKey);

        try {
            await (
                await batchTransaction
                    .addInnerTransaction(tx1)
                    .execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                Status.BatchTransactionInBlacklist.toString(),
            );
        }
    });

    it("invalid batch key set to inner transaction should throw an error", async function () {
        const env = await IntegrationTestEnv.new();
        const batchTransaction = new BatchTransaction();

        const key = PrivateKey.generateECDSA();
        const invalidKey = PrivateKey.generateECDSA();

        const tx1 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, invalidKey.publicKey);

        try {
            await (
                await batchTransaction
                    .addInnerTransaction(tx1)
                    .execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                Status.InvalidSignature.toString(),
            );
        }
    });

    it("non-batch transaction with batch key should throw an error", async function () {
        const key = PrivateKey.generateECDSA();

        try {
            await (
                await (
                    await new AccountCreateTransaction()
                        .setKeyWithoutAlias(key)
                        .setNodeAccountIds([AccountId.fromString("0.0.3")])
                ).execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            console.log(error);
            expect(error.message).to.include(
                Status.BatchKeySetOnNonInnerTransaction.toString(),
            );
        }
    });

    it("chunked inner transactions should be executed successfully", async function () {
        const batchTransaction = new BatchTransaction();

        const response = await new TopicCreateTransaction()
            .setAdminKey(env.operatorKey)
            .setTopicMemo("[e2e::TopicCreateTransaction]")
            .execute(env.client);

        const topicId = (await response.getReceipt(env.client)).topicId;

        const topicMessageSubmitTransaction =
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMaxChunks(15)
                .setMessage("A".repeat(4096)) // Using a large message to test chunking
                .batchify(env.client, env.operatorKey);

        const receipt = await (
            await batchTransaction
                .addInnerTransaction(topicMessageSubmitTransaction)
                .execute(env.client)
        ).getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
    });

    it("successful inner transactions should incur fees even though one failed", async function () {
        const batchTransaction = new BatchTransaction();

        const initialBalance = (
            await new AccountInfoQuery()
                .setAccountId(env.operatorId)
                .execute(env.client)
        ).balance;

        const key = PrivateKey.generateECDSA();

        const tx1 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const tx2 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const tx3 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, PrivateKey.generateECDSA());

        try {
            await (
                await batchTransaction
                    .addInnerTransaction(tx1)
                    .addInnerTransaction(tx2)
                    .addInnerTransaction(tx3)
                    .execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                Status.InvalidSignature.toString(),
            );
        }

        const finalBalance = (
            await new AccountInfoQuery()
                .setAccountId(env.operatorId)
                .execute(env.client)
        ).balance;

        expect(finalBalance.toTinybars().toNumber()).to.be.lessThan(
            initialBalance.toTinybars().toNumber(),
        );
    });

    after(async function () {
        await env.close();
    });
});
