import { expect } from "chai";
import {
    AccountId,
    KeyList,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TransactionId,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount } from "./utils/Fixtures.js";

describe("TransactionReceipt", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    it("should exist in the `ReceiptStatusError`", async function () {
        const operatorKey = env.operatorKey.publicKey;
        const operatorId = env.operatorId;

        const key1 = PrivateKey.generateED25519();
        const key2 = PrivateKey.generateED25519(); // Submit Key
        const key3 = PrivateKey.generateED25519();
        const keyList = KeyList.of(
            key1.publicKey,
            key2.publicKey,
            key3.publicKey,
        );

        await createAccount(env.client, (transaction) => {
            transaction.setKeyWithoutAlias(keyList);
        });

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

        const scheduled1 = transaction
            .schedule()
            .setPayerAccountId(operatorId)
            .setAdminKey(operatorKey)
            .freezeWith(env.client);

        const scheduled2 = transaction
            .schedule()
            .setPayerAccountId(operatorId)
            .setAdminKey(operatorKey)
            .freezeWith(env.client);

        await (await scheduled1.execute(env.client)).getReceipt(env.client);

        try {
            await (await scheduled2.execute(env.client)).getReceipt(env.client);
        } catch (error) {
            const expected = TransactionId.withValidStart(
                new AccountId(scheduled1.transactionId.accountId),
                scheduled1.transactionId.validStart,
            );
            const actual = TransactionId.withValidStart(
                new AccountId(
                    error.transactionReceipt.scheduledTransactionId.accountId,
                ),
                error.transactionReceipt.scheduledTransactionId.validStart,
            );
            expect(expected.toString()).to.be.equal(actual.toString());
        }
    });

    after(async function () {
        await env.close();
    });
});
