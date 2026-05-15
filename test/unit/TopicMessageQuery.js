// SPDX-License-Identifier: Apache-2.0

import TopicMessageQuery from "../../src/topic/TopicMessageQuery.js";
import SubscriptionHandle from "../../src/topic/SubscriptionHandle.js";
import TopicId from "../../src/topic/TopicId.js";
import Timestamp from "../../src/Timestamp.js";
import Long from "long";

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

    describe("shouldRetry", function () {
        it("returns false when _attempt >= _maxAttempts even if _retryHandler returns true", function () {
            const query = new TopicMessageQuery();
            query._attempt = query._maxAttempts;
            expect(query._retryHandler({ code: 5, details: "" })).to.be.true;
            expect(query.shouldRetry({ code: 5, details: "" })).to.be.false;
        });
    });
});
