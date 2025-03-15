import {
    TopicCreateTransaction,
    TopicDeleteTransaction,
    TopicInfoQuery,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TopicInfo", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        const info = await new TopicInfoQuery()
            .setTopicId(topic)
            .execute(env.client);

        expect(info.topicId.toString()).to.eql(topic.toString());
        expect(info.topicMemo).to.eql("");
        expect(info.runningHash.length).to.be.eql(48);
        expect(info.sequenceNumber.toInt()).to.eql(0);
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.submitKey.toString()).to.eql(operatorKey.toString());
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            operatorId.toString(),
        );
        expect(info.autoRenewPeriod.seconds.toInt()).to.be.eql(7776000);
        expect(info.expirationTime).to.be.not.null;
        expect(info.metadataKey).to.be.not.null;
        expect(info.metadata).to.be.not.null;

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should be executable when no fields are set", async function () {
        const response = await new TopicCreateTransaction().execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        const info = await new TopicInfoQuery()
            .setTopicId(topic)
            .execute(env.client);

        expect(info.topicId.toString()).to.eql(topic.toString());
        expect(info.topicMemo).to.eql("");
        expect(info.runningHash.length).to.be.eql(48);
        expect(info.sequenceNumber.toInt()).to.eql(0);
        expect(info.adminKey).to.be.null;
        expect(info.submitKey).to.be.null;
        /*
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            env.operatorId.toString(),
        );
        */
        expect(info.autoRenewPeriod.seconds.toInt()).to.be.eql(7776000);
        expect(info.expirationTime).to.be.not.null;
    });

    it("should be able to query cost", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        const cost = await new TopicInfoQuery()
            .setTopicId(topic)
            .getCost(env.client);

        expect(cost.toTinybars().toInt()).to.be.at.least(1);
    });

    it("should error on query cost on deleted topic with INVALID_TOPIC_ID", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);

        let err;
        try {
            await new TopicInfoQuery().setTopicId(topic).getCost(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTopicId.toString());
        }

        if (!err) {
            throw new Error("query cost did not error");
        }
    });

    after(async function () {
        await env.close();
    });
});
