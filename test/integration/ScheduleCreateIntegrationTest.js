import { setTimeout } from "timers/promises";
import {
    Hbar,
    KeyList,
    PrivateKey,
    ScheduleInfoQuery,
    ScheduleSignTransaction,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    AccountBalanceQuery,
    ScheduleCreateTransaction,
    TransferTransaction,
    Timestamp,
    AccountUpdateTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";

describe("ScheduleCreate", function () {
    let env;

    const ONE_DAY_IN_NANOS = 60 * 60 * 24 * 1_000_000_000;
    const ONE_YEAR_IN_NANOS = ONE_DAY_IN_NANOS * 365;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorKey = env.operatorKey.publicKey;
        const operatorId = env.operatorId;

        const key1 = PrivateKey.generateED25519();

        // Submit Key
        const key2 = PrivateKey.generateED25519();

        const key3 = PrivateKey.generateED25519();

        const keyList = KeyList.of(
            key1.publicKey,
            key2.publicKey,
            key3.publicKey,
        );

        const { accountId } = await createAccount(env.client, (transaction) =>
            transaction
                .setInitialBalance(new Hbar(50))
                .setKeyWithoutAlias(keyList),
        );

        expect(accountId).to.be.not.null;

        const topicId = (
            await (
                await new TopicCreateTransaction()
                    .setAdminKey(operatorKey)
                    .setAutoRenewAccountId(operatorId)
                    .setTopicMemo("HCS Topic_")
                    .setSubmitKey(key2)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).topicId;

        const transaction = new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage("scheduled hcs message");

        const scheduled = transaction
            .schedule()
            .setPayerAccountId(operatorId)
            .setAdminKey(operatorKey)
            .freezeWith(env.client);

        const scheduleId = (
            await (await scheduled.execute(env.client)).getReceipt(env.client)
        ).scheduleId;

        const info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        const infoTransaction = /** @type {TopicMessageSubmitTransaction} */ (
            info.scheduledTransaction
        );

        // TODO: Remove when `ScheduleInfo.scheduledTransaction` works without serializing to bytes
        transaction.topicId._checksum = null;

        expect(info.scheduleId.toString()).to.be.equal(scheduleId.toString());
        expect(infoTransaction.topicId.toString()).to.be.equal(
            transaction.topicId.toString(),
        );
        expect(infoTransaction.message.length).to.be.equal(
            transaction.message.length,
        );
        expect(infoTransaction.nodeAccountIds).to.be.null;

        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(key2)
            ).execute(env.client)
        ).getReceipt(env.client);

        await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);
    });

    it("should be able to query cost", async function () {
        const operatorKey = env.operatorKey.publicKey;
        const operatorId = env.operatorId;

        const key1 = PrivateKey.generateED25519();

        // Submit Key
        const key2 = PrivateKey.generateED25519();

        const key3 = PrivateKey.generateED25519();

        const keyList = KeyList.of(
            key1.publicKey,
            key2.publicKey,
            key3.publicKey,
        );

        const { accountId } = await createAccount(env.client, (transaction) =>
            transaction
                .setInitialBalance(new Hbar(10))
                .setKeyWithoutAlias(keyList),
        );

        expect(accountId).to.be.not.null;

        const topicId = (
            await (
                await new TopicCreateTransaction()
                    .setAdminKey(operatorKey)
                    .setAutoRenewAccountId(operatorId)
                    .setTopicMemo("HCS Topic_")
                    .setSubmitKey(key2)
                    .execute(env.client)
            ).getReceipt(env.client)
        ).topicId;

        const transaction = new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage("scheduled hcs message");

        const scheduled = transaction
            .schedule()
            .setPayerAccountId(operatorId)
            .setAdminKey(operatorKey)
            .freezeWith(env.client);

        const scheduleId = (
            await (await scheduled.execute(env.client)).getReceipt(env.client)
        ).scheduleId;

        const cost = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .getCost(env.client);

        expect(cost.toTinybars().toInt()).to.be.at.least(1);
    });

    it("should be able to encode/decode scheduled transaction", async function () {
        const tx = new TransferTransaction()
            .addHbarTransfer(env.operatorId, Hbar.fromTinybars(1))
            .addHbarTransfer("0.0.1023", Hbar.fromTinybars(1).negated());

        const scheduledTx = new ScheduleCreateTransaction()
            .setScheduledTransaction(tx)
            .freezeWith(env.client);

        const sch = scheduledTx._getScheduledTransactionBody();
        expect(sch.scheduleCreate.scheduledTransactionBody).not.to.be.null;

        const bytes = scheduledTx.toBytes();
        const tx2 = ScheduleCreateTransaction.fromBytes(bytes);

        const sch2 = tx2._getScheduledTransactionBody();
        expect(sch2.scheduleCreate.scheduledTransactionBody).not.to.be.null;
    });

    it("should not schedule 1 year into the future", async function () {
        const operatorId = env.operatorId;

        const { accountId: receiverId } = await createAccount(env.client);
        const transaction = new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.from("-1"))
            .addHbarTransfer(receiverId, Hbar.from("1"));

        let err = false;

        try {
            await (
                await transaction
                    .schedule()
                    .setExpirationTime(
                        Timestamp.generate().plusNanos(ONE_YEAR_IN_NANOS),
                    )
                    .setScheduleMemo("HIP-423 Integration Test")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes(
                "SCHEDULE_EXPIRATION_TIME_TOO_FAR_IN_FUTURE",
            );
        }
        expect(err).to.be.true;
    });

    it("should not schedule in the past", async function () {
        const operatorId = env.operatorId;

        const { accountId: receiverId } = await createAccount(env.client);
        const transaction = new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.from("-1"))
            .addHbarTransfer(receiverId, Hbar.from("1"));

        let err = false;

        try {
            await (
                await transaction
                    .schedule()
                    .setExpirationTime(Timestamp.generate().plusNanos(-1))
                    .setScheduleMemo("HIP-423 Integration Test")
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.message.includes(
                "SCHEDULE_EXPIRATION_TIME_MUST_BE_HIGHER_THAN_CONSENSUS_TIME",
            );
        }
        expect(err).to.be.true;
    });

    it("should sign schedule and wait for expiry", async function () {
        const operatorId = env.operatorId;

        const { accountId: receiverId, newKey: privateKey } =
            await createAccount(env.client, (transaction) =>
                transaction.setInitialBalance(Hbar.from(1)),
            );

        const transaction = new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.from("1"))
            .addHbarTransfer(receiverId, Hbar.from("-1"));

        const { scheduleId } = await (
            await transaction
                .schedule()
                .setExpirationTime(
                    Timestamp.generate().plusNanos(ONE_DAY_IN_NANOS),
                )
                .setWaitForExpiry(true)
                .setScheduleMemo("HIP-423 Integration Test")
                .execute(env.client)
        ).getReceipt(env.client);

        const info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        expect(info.executed).to.be.null;

        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(privateKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        const postSignInfo = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        expect(postSignInfo.executed).to.be.null;
    });

    it("should sign schedule with multisig", async function () {
        const operatorId = env.operatorId;

        const privateKey1 = PrivateKey.generateED25519();
        const privateKey2 = PrivateKey.generateED25519();
        const privateKey3 = PrivateKey.generateED25519();

        const keyList = KeyList.of(
            privateKey1.publicKey,
            privateKey2.publicKey,
            privateKey3.publicKey,
        );

        const { accountId: receiverId } = await createAccount(
            env.client,
            (transaction) =>
                transaction
                    .setKeyWithoutAlias(keyList)
                    .setInitialBalance(Hbar.from(1)),
        );

        const transaction = new TransferTransaction()
            .addHbarTransfer(operatorId, Hbar.from("1"))
            .addHbarTransfer(receiverId, Hbar.from("-1"));

        const { scheduleId } = await (
            await transaction
                .schedule()
                .setExpirationTime(
                    Timestamp.generate().plusNanos(ONE_DAY_IN_NANOS),
                )
                .setScheduleMemo("Multisig Test")
                .execute(env.client)
        ).getReceipt(env.client);

        // Sign the schedule with the first private key
        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(privateKey1)
            ).execute(env.client)
        ).getReceipt(env.client);

        // Sign the schedule with the second private key
        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(privateKey2)
            ).execute(env.client)
        ).getReceipt(env.client);

        // Verify that the schedule is still not executed
        const info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        expect(info.executed).to.be.null;

        // Sign the schedule with the third private key
        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(privateKey3)
            ).execute(env.client)
        ).getReceipt(env.client);

        // Now the schedule should be executed
        const postSignInfo = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        expect(postSignInfo.executed).to.be.not.null;
    });

    it("should sign with multisig and update signing requirements", async function () {
        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519();
        const key3 = PrivateKey.generateED25519();

        const keyList = new KeyList(
            [key1.publicKey, key2.publicKey, key3.publicKey],
            2,
        );

        const { accountId } = await createAccount(env.client, (transaction) =>
            transaction
                .setKeyWithoutAlias(keyList)
                .setInitialBalance(new Hbar(10)),
        );

        // Create the transaction
        const transfer = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(1).negated())
            .addHbarTransfer(env.operatorId, new Hbar(1));

        // Schedule the transaction
        const { scheduleId } = await (
            await transfer
                .schedule()
                .setExpirationTime(
                    Timestamp.generate().plusNanos(ONE_DAY_IN_NANOS),
                )
                .setScheduleMemo("HIP-423 Integration Test")
                .execute(env.client)
        ).getReceipt(env.client);

        let info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        // Verify the transaction is not executed
        expect(info.executed).to.be.null;

        // Sign with one key
        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(key1)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        // Verify the transaction is still not executed
        expect(info.executed).to.be.null;

        // Update the signing requirements

        await (
            await (
                await (
                    await (
                        await new AccountUpdateTransaction()
                            .setAccountId(accountId)
                            .setKey(key3)
                            .freezeWith(env.client)
                            .sign(key1)
                    ).sign(key2)
                ).sign(key3)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        // Verify the transaction is still not executed
        expect(info.executed).to.be.null;

        // Sign with the updated key
        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(key3)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        // Verify the transaction is executed
        expect(info.executed).to.not.be.null;
    });

    it("should execute with short expiration time", async function () {
        const hasJitter = false;
        const SHORT_EXPIRATION_TIME = 10_000;

        const { accountId, newKey } = await createAccount(
            env.client,
            (transaction) => transaction.setInitialBalance(new Hbar(10)),
        );

        const transfer = new TransferTransaction()
            .addHbarTransfer(accountId, new Hbar(1).negated())
            .addHbarTransfer(env.operatorId, new Hbar(1));

        var { scheduleId } = await (
            await transfer
                .schedule()
                .setExpirationTime(
                    Timestamp.generate(hasJitter).plusNanos(10_000_000_000),
                )
                .setWaitForExpiry(true)
                .setScheduleMemo("HIP-423 Integration Test")
                .execute(env.client)
        ).getReceipt(env.client);

        let info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        expect(info.executed).to.equal(null);

        await (
            await (
                await new ScheduleSignTransaction()
                    .setScheduleId(scheduleId)
                    .freezeWith(env.client)
                    .sign(newKey)
            ).execute(env.client)
        ).getReceipt(env.client);

        info = await new ScheduleInfoQuery()
            .setScheduleId(scheduleId)
            .execute(env.client);

        expect(info.executed).to.equal(null);

        const balanceBefore = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(env.client);

        await setTimeout(SHORT_EXPIRATION_TIME);

        const balanceAfter = await new AccountBalanceQuery()
            .setAccountId(accountId)
            .execute(env.client);

        expect(balanceAfter.hbars.toTinybars().toNumber()).to.be.lte(
            balanceBefore.hbars.toTinybars().toNumber(),
        );
    });

    after(async function () {
        await env.close();
    });
});
