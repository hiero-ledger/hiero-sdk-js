import {
    Status,
    TopicCreateTransaction,
    TopicDeleteTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TopicDelete", function () {
    let env;

    beforeAll(async function () {
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

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should error when deleting immutable topic", async function () {
        const response = await new TopicCreateTransaction().execute(env.client);
        const topic = (await response.getReceipt(env.client)).topicId;

        let err = false;

        try {
            await (
                await new TopicDeleteTransaction()
                    .setTopicId(topic)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.Unauthorized);
        }

        if (!err) {
            throw new Error("topic deletion did not error");
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
