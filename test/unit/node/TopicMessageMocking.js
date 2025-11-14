import Mocker from "../Mocker.js";
import * as hex from "../../../src/encoding/hex.js";
import Long from "long";
import { TopicMessageQuery } from "../../../src/index.js";

/**
 * @namespace com
 * @typedef {import("@hiero-ledger/proto").com.hedera.mirror.api.proto.IConsensusTopicResponse} com.hedera.mirror.api.proto.IConsensusTopicResponse
 */

/** @type {com.hedera.mirror.api.proto.IConsensusTopicResponse} */
const TOPIC_MESSAGE = {
    consensusTimestamp: {
        seconds: 100,
        nanos: 10,
    },
    message: hex.encode("11"),
    runningHash: hex.encode("22"),
    sequenceNumber: Long.fromNumber(3),
    runningHashVersion: Long.fromNumber(4),
    chunkInfo: null,
};

describe("TopicMessageMocking", function () {
    let client;
    let servers;
    let handle;

    afterEach(function () {
        client.close();
        servers.close();

        if (handle != null) {
            handle.unsubscribe();
        }
    });

    it("is able to receive messages", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ response: TOPIC_MESSAGE }],
        ]));

        let finished = false;

        handle = new TopicMessageQuery()
            .setTopicId("0.0.3")
            .setCompletionHandler(() => {
                finished = true;
            })
            .subscribe(client, () => {});

        const startTime = Date.now();

        while (!finished && Date.now() < startTime + 5000) {
            await new Promise((resolved) => setTimeout(resolved, 2000));
        }

        expect(finished).to.be.true;
        client.close();
    });

    it("should stop processing messages after unsubscription", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ response: TOPIC_MESSAGE }],
            [{ response: TOPIC_MESSAGE }],
        ]));

        let messageProcessed = false;

        handle = new TopicMessageQuery()
            .setTopicId("0.0.3")
            .subscribe(client, () => {
                messageProcessed = true;
            });

        handle.unsubscribe();

        const startTime = Date.now();

        while (!messageProcessed && Date.now() < startTime + 5000) {
            await new Promise((resolved) => setTimeout(resolved, 2000));
        }

        expect(messageProcessed).to.be.false;
    });
});
