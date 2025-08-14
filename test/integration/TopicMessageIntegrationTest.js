// Cross-environment sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

import {
    Status,
    TopicCreateTransaction,
    TopicDeleteTransaction,
    TopicMessageQuery,
    TopicMessageSubmitTransaction,
} from "../../src/exports.js";
import { bigContents } from "./contents.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TopicMessage", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    // eslint-disable-next-line vitest/no-disabled-tests
    it.skip("should be executable", async function () {
        const operatorKey = env.operatorKey.publicKey;

        let finished = false;
        const contents = "Hello from Hiero SDK JS";

        const { topicId } = await (
            await new TopicCreateTransaction()
                .setAdminKey(operatorKey)
                .execute(env.client)
        ).getReceipt(env.client);

        // wait for mirror node to see new topic id
        await sleep(2500);

        new TopicMessageQuery()
            .setTopicId(topicId)
            .setStartTime(0)
            .setLimit(1)
            .setCompletionHandler(() => {
                finished = true;
            })
            // eslint-disable-next-line no-unused-vars
            .subscribe(env.client, (_) => {
                // Do nothing
            });

        // waiting for mirror node
        await sleep(2500);
        await (
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(contents)
                .execute(env.client)
        ).getReceipt(env.client);

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topicId)
                .execute(env.client)
        ).getReceipt(env.client);

        // waiting for setCompletionHandler to be executed
        await sleep(1000);

        if (!finished) {
            throw new Error("Failed to receive message in 30s");
        }
    });

    it("should be executable with large message", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        // Skip this test if we do not have a mirror network
        if (env.client.mirrorNetwork.length == 0) {
            return;
        }

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        let finished = false;

        // waiting for mirror node to see the new topic
        await sleep(1000);
        new TopicMessageQuery()
            .setTopicId(topic)
            .setStartTime(0)
            .setLimit(14)
            .setCompletionHandler(() => {
                finished = true;
            })
            // eslint-disable-next-line no-unused-vars
            .subscribe(env.client, (_) => {
                // Do nothing
            });

        await sleep(1000);
        const startTime = Date.now();

        await (
            await new TopicMessageSubmitTransaction()
                .setTopicId(topic)
                .setMessage(bigContents)
                .setMaxChunks(14)
                .execute(env.client)
        ).getReceipt(env.client);

        while (!finished && Date.now() < startTime + 45000) {
            //NOSONAR
            await sleep(2000);
        }

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);

        // need to wait for completionHandler to be called
        await sleep(1000);

        if (!finished) {
            throw new Error("Failed to receive message in 45s");
        }
    });

    it("should error when topic ID is not set", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        // Skip this test if we do not have a mirror network
        if (env.client.mirrorNetwork.length == 0) {
            return;
        }

        // Skip this test if we do not have a mirror network
        if (env.client.mirrorNetwork.length == 0) {
            return;
        }

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        const contents = "Hello from Hiero SDK JS";

        let err = false;

        try {
            await (
                await new TopicMessageSubmitTransaction()
                    .setMessage(contents)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTopicId);
        }

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);

        if (!err) {
            throw new Error("topic message did not error");
        }
    });

    it("should error when message is not set", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        // Skip this test if we do not have a mirror network
        if (env.client.mirrorNetwork.length == 0) {
            return;
        }

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        let err = false;

        try {
            await (
                await new TopicMessageSubmitTransaction()
                    .setTopicId(topic)
                    .execute(env.client)
            ).getReceipt(env.client);
        } catch (error) {
            err = error.toString().includes(Status.InvalidTopicMessage);
        }

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);

        if (!err) {
            throw new Error("topic message did not error");
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
