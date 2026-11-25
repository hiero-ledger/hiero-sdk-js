// SPDX-License-Identifier: Apache-2.0

import TopicMessageQuery from "../../src/topic/TopicMessageQuery.js";
import MirrorNetwork from "../../src/client/MirrorNetwork.js";
import SubscriptionHandle from "../../src/topic/SubscriptionHandle.js";
import TopicId from "../../src/topic/TopicId.js";
import Timestamp from "../../src/Timestamp.js";
import Long from "long";
import * as HieroProto from "@hiero-ledger/proto";
import { vi } from "vitest";

describe("TopicMessageQuery", function () {
    describe("setter guard — throws after subscribe is active", function () {
        const setterCases = [
            ["setTopicId", "0.0.5"],
            ["setStartTime", 0],
            ["setEndTime", 0],
            ["setLimit", 10],
            ["setMaxAttempts", 5],
            ["setMaxBackoff", 1000],
            ["setCompletionHandler", () => {}],
        ];

        it("each setter throws once query._handle is set", function () {
            setterCases.forEach(([name, arg]) => {
                const query = new TopicMessageQuery();
                query._handle = new SubscriptionHandle();
                expect(
                    () => query[name](arg),
                    `Expected ${name} to throw`,
                ).to.throw(
                    "Cannot change fields on an already subscribed query",
                );
            });
        });
    });

    describe("setTopicId coercion", function () {
        it("accepts a string and parses it to a TopicId", function () {
            const query = new TopicMessageQuery();
            query.setTopicId("0.0.5");
            expect(query.topicId).to.be.an.instanceof(TopicId);
            expect(query.topicId.toString()).to.equal("0.0.5");
        });

        it("accepts a TopicId instance", function () {
            const query = new TopicMessageQuery();
            const tid = TopicId.fromString("0.0.5");
            query.setTopicId(tid);
            expect(query.topicId).to.be.an.instanceof(TopicId);
            expect(query.topicId.toString()).to.equal("0.0.5");
        });
    });

    describe("setStartTime coercion", function () {
        it("accepts a Timestamp instance directly", function () {
            const query = new TopicMessageQuery();
            const ts = new Timestamp(123, 456);
            query.setStartTime(ts);
            expect(query.startTime).to.equal(ts);
        });

        it("accepts a Date and converts via Timestamp.fromDate", function () {
            const query = new TopicMessageQuery();
            const date = new Date(1700000000000);
            query.setStartTime(date);
            expect(query.startTime).to.be.an.instanceof(Timestamp);
            expect(query.startTime.seconds.toNumber()).to.equal(
                Math.floor(date.getTime() / 1000),
            );
        });

        it("accepts a number and constructs new Timestamp", function () {
            const query = new TopicMessageQuery();
            query.setStartTime(42);
            expect(query.startTime).to.be.an.instanceof(Timestamp);
            expect(query.startTime.seconds.toNumber()).to.equal(42);
            expect(query.startTime.nanos.toNumber()).to.equal(0);
        });
    });

    describe("setEndTime coercion", function () {
        it("accepts a Timestamp instance directly", function () {
            const query = new TopicMessageQuery();
            const ts = new Timestamp(123, 456);
            query.setEndTime(ts);
            expect(query.endTime).to.equal(ts);
        });

        it("accepts a Date and converts via Timestamp.fromDate", function () {
            const query = new TopicMessageQuery();
            const date = new Date(1700000000000);
            query.setEndTime(date);
            expect(query.endTime).to.be.an.instanceof(Timestamp);
            expect(query.endTime.seconds.toNumber()).to.equal(
                Math.floor(date.getTime() / 1000),
            );
        });

        it("accepts a number and constructs new Timestamp", function () {
            const query = new TopicMessageQuery();
            query.setEndTime(42);
            expect(query.endTime).to.be.an.instanceof(Timestamp);
            expect(query.endTime.seconds.toNumber()).to.equal(42);
            expect(query.endTime.nanos.toNumber()).to.equal(0);
        });
    });

    describe("setLimit coercion", function () {
        it("accepts a number and converts to Long", function () {
            const query = new TopicMessageQuery();
            query.setLimit(42);
            expect(query.limit).to.be.an.instanceof(Long);
            expect(query.limit.toNumber()).to.equal(42);
        });

        it("accepts a Long instance directly", function () {
            const query = new TopicMessageQuery();
            const long = Long.fromNumber(42);
            query.setLimit(long);
            expect(query.limit).to.equal(long);
        });
    });

    describe("default _retryHandler", function () {
        it("returns true for retryable gRPC codes 5, 8, 14, 17", function () {
            const query = new TopicMessageQuery();
            [5, 8, 14, 17].forEach((code) => {
                expect(
                    query._retryHandler({ code, details: "" }),
                    `code ${code}`,
                ).to.be.true;
            });
        });

        it("returns true for code 13 (INTERNAL) when details match RST_STREAM", function () {
            const query = new TopicMessageQuery();
            expect(
                query._retryHandler({
                    code: 13,
                    details: "Received RST_STREAM",
                }),
            ).to.be.true;
        });

        it("returns false for code 13 (INTERNAL) when details do NOT match RST_STREAM", function () {
            const query = new TopicMessageQuery();
            expect(
                query._retryHandler({ code: 13, details: "some other error" }),
            ).to.be.false;
        });

        it("returns true for a plain Error (non-MirrorError)", function () {
            const query = new TopicMessageQuery();
            expect(query._retryHandler(new Error("network error"))).to.be.true;
        });

        it("returns false for an unknown gRPC code", function () {
            const query = new TopicMessageQuery();
            expect(query._retryHandler({ code: 99, details: "" })).to.be.false;
        });

        it("returns false when error is null", function () {
            const query = new TopicMessageQuery();
            expect(query._retryHandler(null)).to.be.false;
        });
    });

    describe("retry before the first message", function () {
        /**
         * Fake client that records each subscribe request and its error callback.
         */
        function fakeClient() {
            const calls = [];
            const channel = {
                makeServerStreamRequest(
                    service,
                    method,
                    request,
                    onData,
                    onError,
                ) {
                    calls.push({
                        query: HieroProto.com.hedera.mirror.api.proto.ConsensusTopicQuery.decode(
                            request,
                        ),
                        onError,
                    });
                    return () => {};
                },
            };
            const node = {
                address: "mirror.example.com:443",
                getChannel: () => channel,
            };
            const client = {
                _mirrorNetwork: {
                    getNextMirrorNode: () => node,
                    increaseBackoff: () => {},
                    decreaseBackoff: () => {},
                },
            };
            return { client, calls };
        }

        beforeEach(function () {
            vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
            vi.setSystemTime(new Date(1700000000123));
        });

        afterEach(function () {
            vi.useRealTimers();
        });

        it("resumes from the subscribe time when no start time was set", async function () {
            const { client, calls } = fakeClient();
            const subscribeTime = Timestamp.fromDate(new Date());

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .subscribe(client, null, () => {});

            expect(calls[0].query.consensusStartTime).to.be.null;

            vi.setSystemTime(new Date(1700000009000));
            calls[0].onError({ code: 5, details: "topic does not exist" });
            await vi.runAllTimersAsync();

            expect(calls).to.have.lengthOf(2);
            const startTime = Timestamp._fromProtobuf(
                calls[1].query.consensusStartTime,
            );
            expect(startTime.toString()).to.equal(subscribeTime.toString());
        });

        it("keeps a start time set by the caller", async function () {
            const { client, calls } = fakeClient();

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .setStartTime(42)
                .subscribe(client, null, () => {});

            calls[0].onError({ code: 5, details: "topic does not exist" });
            await vi.runAllTimersAsync();

            expect(calls).to.have.lengthOf(2);
            expect(
                Timestamp._fromProtobuf(
                    calls[1].query.consensusStartTime,
                ).toString(),
            ).to.equal(new Timestamp(42, 0).toString());
        });
    });

    describe("mirror node health", function () {
        /**
         * Client with a real `MirrorNetwork` whose channels record each
         * subscribe request together with the address it was sent to.
         *
         * @param {string[]} addresses
         */
        function clientWithMirrorNodes(addresses) {
            const calls = [];
            const mirrorNetwork = new MirrorNetwork((address) => ({
                makeServerStreamRequest(
                    service,
                    method,
                    request,
                    onData,
                    onError,
                ) {
                    calls.push({ address, onData, onError });
                    return () => {};
                },
                close() {},
            }));
            mirrorNetwork.setNetwork(addresses);
            return { client: { _mirrorNetwork: mirrorNetwork }, calls };
        }

        /** @param {string} address */
        function nodeAt(client, address) {
            return client._mirrorNetwork._nodes.find(
                (node) => node.address.toString() === address,
            );
        }

        const GATEWAY_TIMEOUT = {
            code: 14,
            details: "Received HTTP status code 504",
        };

        beforeEach(function () {
            vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
            vi.setSystemTime(new Date(1700000000123));
            vi.spyOn(console, "warn").mockImplementation(() => {});
        });

        afterEach(function () {
            vi.useRealTimers();
            vi.restoreAllMocks();
        });

        it("retries on the other mirror node after a 504", async function () {
            const { client, calls } = clientWithMirrorNodes([
                "mirror-a.example.com:443",
                "mirror-b.example.com:443",
            ]);

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .subscribe(client, null, () => {});

            calls[0].onError(GATEWAY_TIMEOUT);
            await vi.runAllTimersAsync();

            expect(calls).to.have.lengthOf(2);
            expect(calls[1].address).to.not.equal(calls[0].address);
            expect(nodeAt(client, calls[0].address).isHealthy()).to.be.false;
        });

        it("backs the node off for transport errors only", async function () {
            const { client, calls } = clientWithMirrorNodes([
                "mirror-a.example.com:443",
            ]);

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .subscribe(client, null, () => {});

            calls[0].onError({ code: 5, details: "topic does not exist" });
            await vi.runAllTimersAsync();

            expect(nodeAt(client, calls[0].address).isHealthy()).to.be.true;

            calls[1].onError(new Error("socket hang up"));
            await vi.runAllTimersAsync();

            expect(nodeAt(client, calls[1].address).isHealthy()).to.be.false;
        });

        it("keeps retrying the only mirror node while it is backed off", async function () {
            const { client, calls } = clientWithMirrorNodes([
                "mirror-a.example.com:443",
            ]);

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .subscribe(client, null, () => {});

            calls[0].onError(GATEWAY_TIMEOUT);
            await vi.runAllTimersAsync();
            calls[1].onError(GATEWAY_TIMEOUT);
            await vi.runAllTimersAsync();

            expect(calls).to.have.lengthOf(3);
            expect(calls.map((call) => call.address)).to.deep.equal([
                "mirror-a.example.com:443",
                "mirror-a.example.com:443",
                "mirror-a.example.com:443",
            ]);
        });

        it("lowers the backoff once the stream delivers a message", async function () {
            const { client, calls } = clientWithMirrorNodes([
                "mirror-a.example.com:443",
            ]);

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .subscribe(client, null, () => {});

            calls[0].onError(GATEWAY_TIMEOUT);
            await vi.runAllTimersAsync();

            const node = nodeAt(client, "mirror-a.example.com:443");
            const backoff = node._currentBackoff;

            calls[1].onData(
                HieroProto.com.hedera.mirror.api.proto.ConsensusTopicResponse.encode(
                    {
                        consensusTimestamp: { seconds: 1, nanos: 0 },
                        message: new Uint8Array([1]),
                        runningHash: new Uint8Array([2]),
                        sequenceNumber: 1,
                    },
                ).finish(),
            );

            expect(node._currentBackoff).to.equal(backoff / 2);
        });

        it("logs the mirror node and says that it timed out", async function () {
            const { client, calls } = clientWithMirrorNodes([
                "mirror-a.example.com:443",
            ]);

            new TopicMessageQuery()
                .setTopicId("0.0.5")
                .subscribe(client, null, () => {});

            calls[0].onError(GATEWAY_TIMEOUT);

            expect(console.warn).toHaveBeenCalledWith(
                "Error subscribing to topic 0.0.5 on mirror node mirror-a.example.com:443 " +
                    "during attempt 0. Waiting 250 ms before next attempt: " +
                    "Mirror node timed out (Received HTTP status code 504)",
            );
        });
    });

    describe("MirrorNetwork.getNextMirrorNode", function () {
        it("returns the node readmitted first when every node is backed off", function () {
            const mirrorNetwork = new MirrorNetwork(() => ({ close() {} }));
            mirrorNetwork.setNetwork([
                "mirror-a.example.com:443",
                "mirror-b.example.com:443",
            ]);
            const [first, second] = mirrorNetwork._nodes;

            mirrorNetwork.increaseBackoff(first);
            mirrorNetwork.increaseBackoff(first);
            mirrorNetwork.increaseBackoff(second);

            expect(mirrorNetwork.getNextMirrorNode()).to.equal(second);
        });
    });

    describe("shouldRetry", function () {
        it("returns false when _attempt >= _maxAttempts even if _retryHandler returns true", function () {
            const query = new TopicMessageQuery();
            query._attempt = query._maxAttempts;
            expect(query._retryHandler({ code: 5, details: "" })).to.be.true;
            expect(query.shouldRetry({ code: 5, details: "" })).to.be.false;
        });
    });
});
