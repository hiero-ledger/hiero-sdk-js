import { expect } from "chai";
import {
    PrivateKey,
    Hbar,
    AccountCreateTransaction,
    BatchTransaction,
    AccountInfoQuery,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    Status,
    FreezeTransaction,
    TransactionId,
    TransferTransaction,
    FileId,
    FreezeType,
    TransactionReceiptQuery,
    TopicInfoQuery,
} from "../../src/index.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("BatchTransaction", function () {
    let env;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("can create batch transaction", async function () {
        this.retries(5);

        const key = PrivateKey.generateECDSA();
        const tx = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const batchTransaction = new BatchTransaction().addInnerTransaction(tx);
        await (
            await batchTransaction.execute(env.client)
        ).getReceipt(env.client);

        const accountIdInnerTransaction =
            batchTransaction.innerTransactionIds[0].accountId;

        const accountInfo = await new AccountInfoQuery()
            .setAccountId(accountIdInnerTransaction)
            .execute(env.client);

        expect(accountIdInnerTransaction.toString()).to.equal(
            accountInfo.accountId.toString(),
        );
    });

    it("can execute from/toBytes", async function () {
        this.retries(5);

        const key = PrivateKey.generateECDSA();
        const tx = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const batchTransaction = new BatchTransaction().addInnerTransaction(tx);
        const batchTransactionBytes = batchTransaction.toBytes();
        const batchTransactionFromBytes = BatchTransaction.fromBytes(
            batchTransactionBytes,
        );
        await (
            await batchTransactionFromBytes.execute(env.client)
        ).getReceipt(env.client);

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
        this.retries(10);
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

        await (
            await batchTransaction.execute(env.client)
        ).getReceipt(env.client);

        for (const innerTransactionId of batchTransaction.innerTransactionIds) {
            const receipt = await new TransactionReceiptQuery()
                .setTransactionId(innerTransactionId)
                .execute(env.client);
            expect(receipt.status).to.equal(Status.Success);
        }
    });

    it("batch transaction with empty inner transaction's list should throw an error", async function () {
        this.retries(5);

        try {
            await (
                await new BatchTransaction().execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(Status.BatchListEmpty.toString());
        }
    });

    it("blacklisted inner transaction should throw an error", async function () {
        this.retries(5);

        const freezeTransaction = await new FreezeTransaction()
            .setFileId(FileId.fromString("4.5.6"))
            .setFileHash(Buffer.from("1723904587120938954702349857", "hex"))
            .setStartTime(new Date())
            .setFreezeType(FreezeType.FreezeOnly)
            .batchify(env.client, env.operatorKey);

        try {
            new BatchTransaction().addInnerTransaction(freezeTransaction);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                "Transaction is not allowed to be added to a batch",
            );
        }

        const key = PrivateKey.generateECDSA();
        const tx = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const batchTransaction = await new BatchTransaction()
            .addInnerTransaction(tx)
            .batchify(env.client, env.operatorKey);

        try {
            new BatchTransaction().addInnerTransaction(batchTransaction);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                "Transaction is not allowed to be added to a batch",
            );
        }
    });

    it("invalid batch key set to inner transaction should throw an error", async function () {
        this.retries(5);

        const batchTransaction = new BatchTransaction();

        const key = PrivateKey.generateECDSA();
        const invalidKey = PrivateKey.generateECDSA();

        const tx = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, invalidKey.publicKey);

        try {
            await (
                await batchTransaction
                    .addInnerTransaction(tx)
                    .execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                Status.InvalidSignature.toString(),
            );
        }
    });

    it("chunked inner transactions should be executed successfully", async function () {
        this.retries(5);

        const response = await new TopicCreateTransaction()
            .setAdminKey(env.operatorKey)
            .setTopicMemo("[e2e::TopicCreateTransaction]")
            .execute(env.client);

        const topicId = (await response.getReceipt(env.client)).topicId;

        const topicMessageSubmitTransaction =
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMaxChunks(1)
                .setMessage("Hello, world!")
                .batchify(env.client, env.operatorKey);

        await (
            await new BatchTransaction()
                .addInnerTransaction(topicMessageSubmitTransaction)
                .execute(env.client)
        ).getReceipt(env.client);

        const info = await new TopicInfoQuery()
            .setTopicId(topicId)
            .execute(env.client);

        expect(info.sequenceNumber.toInt()).to.equal(1);
    });

    it("can execute with different batch keys", async function () {
        this.retries(5);

        const batchKey1 = PrivateKey.generateED25519();
        const batchKey2 = PrivateKey.generateED25519();
        const batchKey3 = PrivateKey.generateED25519();

        const key1 = PrivateKey.generateECDSA();
        const response1 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key1)
            .setInitialBalance(new Hbar(1))
            .execute(env.client);
        const account1 = (await response1.getReceipt(env.client)).accountId;
        expect(account1).to.not.be.null;

        const batchedTransfer1 = await new TransferTransaction()
            .addHbarTransfer(env.operatorId, Hbar.fromTinybars(100))
            .addHbarTransfer(account1, Hbar.fromTinybars(100).negated())
            .setTransactionId(TransactionId.generate(account1))
            .setBatchKey(batchKey1)
            .freezeWith(env.client)
            .sign(key1);

        const key2 = PrivateKey.generateECDSA();
        const response2 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key2)
            .setInitialBalance(new Hbar(1))
            .execute(env.client);
        const account2 = (await response2.getReceipt(env.client)).accountId;
        expect(account2).to.not.be.null;

        const batchedTransfer2 = await new TransferTransaction()
            .addHbarTransfer(env.operatorId, Hbar.fromTinybars(100))
            .addHbarTransfer(account2, Hbar.fromTinybars(100).negated())
            .setTransactionId(TransactionId.generate(account2))
            .setBatchKey(batchKey2)
            .freezeWith(env.client)
            .sign(key2);

        const key3 = PrivateKey.generateECDSA();
        const response3 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key3)
            .setInitialBalance(new Hbar(1))
            .execute(env.client);
        const account3 = (await response3.getReceipt(env.client)).accountId;
        expect(account3).to.not.be.null;

        const batchedTransfer3 = await new TransferTransaction()
            .addHbarTransfer(env.operatorId, Hbar.fromTinybars(100))
            .addHbarTransfer(account3, Hbar.fromTinybars(100).negated())
            .setTransactionId(TransactionId.generate(account3))
            .setBatchKey(batchKey3)
            .freezeWith(env.client)
            .sign(key3);

        const receipt = await (
            await (
                await (
                    await (
                        await new BatchTransaction()
                            .addInnerTransaction(batchedTransfer1)
                            .addInnerTransaction(batchedTransfer2)
                            .addInnerTransaction(batchedTransfer3)
                            .freezeWith(env.client)
                            .sign(batchKey1)
                    ).sign(batchKey2)
                ).sign(batchKey3)
            ).execute(env.client)
        ).getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
    });

    it("successful inner transactions should incur fees even though one failed", async function () {
        this.retries(5);

        const initialBalance = (
            await new AccountInfoQuery()
                .setAccountId(env.operatorId)
                .execute(env.client)
        ).balance;

        const key1 = PrivateKey.generateECDSA();
        const tx1 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key1)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const key2 = PrivateKey.generateECDSA();
        const tx2 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key2)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        const key3 = PrivateKey.generateECDSA();
        const tx3 = await new AccountCreateTransaction()
            .setKeyWithoutAlias(key3)
            .setReceiverSignatureRequired(true)
            .setInitialBalance(new Hbar(1))
            .batchify(env.client, env.operatorKey);

        try {
            await (
                await new BatchTransaction()
                    .addInnerTransaction(tx1)
                    .addInnerTransaction(tx2)
                    .addInnerTransaction(tx3)
                    .execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                Status.InnerTransactionFailed.toString(),
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

    it("transaction should fail when batchified but not part of a batch", async function () {
        this.retries(5);

        const key = PrivateKey.generateED25519();
        try {
            await (
                await (
                    await new TopicCreateTransaction()
                        .setAdminKey(env.operatorKey)
                        .setTopicMemo("[e2e::TopicCreateTransaction]")
                        .batchify(env.client, key)
                ).execute(env.client)
            ).getReceipt(env.client);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.include(
                "Cannot execute batchified transaction outside of BatchTransaction",
            );
        }
    });

    afterEach(async function () {
        await env.close();
    });
});
