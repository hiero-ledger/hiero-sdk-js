import { setTimeout } from "timers/promises";
import {
    TopicMessageQuery,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicDeleteTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

describe("TopicMessageQuery", function () {
    let env;

    before(async function () {
        env = await IntegrationTestEnv.new({ throwaway: true });
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .setAutoRenewAccountId(operatorId)
            .execute(env.client);

        const { topicId } = await response.getReceipt(env.client);
        const contents = "Hello from Hiero SDK JS";
        let expectedContents = "";

        let finished = false;

        // wait for mirror node to receive the new topic
        await setTimeout(5000);
        new TopicMessageQuery()
            .setTopicId(topicId)
            .setLimit(1)
            // eslint-disable-next-line no-unused-vars
            .subscribe(env.client, (topic, _) => {
                finished = true;
                expectedContents = Buffer.from(topic.contents).toString(
                    "utf-8",
                );
            });

        await setTimeout(2000);
        await (
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(contents)
                .execute(env.client)
        ).getReceipt(env.client);

        await new TopicDeleteTransaction()
            .setTopicId(topicId)
            .execute(env.client);

        //NOSONAR
        await setTimeout(5000);

        if (!finished) {
            throw new Error("Did not receive message from query");
        }
        expect(expectedContents).to.equal(contents);
    });

    after(async function () {
        await env.close();
    });
});
