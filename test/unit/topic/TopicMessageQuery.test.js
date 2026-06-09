// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi } from "vitest";
import TopicMessageQuery from "../../../src/topic/TopicMessageQuery.js";
import TopicId from "../../../src/topic/TopicId.js";
import Timestamp from "../../../src/Timestamp.js";
//import Long from "long";

describe("TopicMessageQuery", () => {
    const topicId = new TopicId(0, 0, 123);
    const startTime = new Timestamp(1000, 0);
    const endTime = new Timestamp(2000, 0);

    describe("constructor", () => {
        it("initializes with default values", () => {
            const query = new TopicMessageQuery();
            expect(query.topicId).toBeNull();
            expect(query.startTime).toBeNull();
            expect(query.endTime).toBeNull();
            expect(query.limit).toBeNull();
        });

        it("initializes with provided properties", () => {
            const query = new TopicMessageQuery({
                topicId,
                startTime,
                endTime,
                limit: 10
            });
            expect(query.topicId.toString()).toBe(topicId.toString());
            expect(query.startTime).toBe(startTime);
            expect(query.endTime).toBe(endTime);
            expect(query.limit.toNumber()).toBe(10);
        });
    });

    describe("Setters and Getters", () => {
        it("sets and gets TopicId", () => {
            const query = new TopicMessageQuery().setTopicId(topicId);
            expect(query.topicId.toString()).toBe(topicId.toString());
        });

        it("sets and gets TopicId from string", () => {
            const query = new TopicMessageQuery().setTopicId("0.0.123");
            expect(query.topicId).toBeInstanceOf(TopicId);
            expect(query.topicId.toString()).toBe("0.0.123");
        });

        it("sets and gets startTime", () => {
            const query = new TopicMessageQuery().setStartTime(startTime);
            expect(query.startTime).toBe(startTime);
        });

        it("sets and gets startTime from Date", () => {
            const date = new Date();
            const query = new TopicMessageQuery().setStartTime(date);
            expect(query.startTime).toBeInstanceOf(Timestamp);
        });

        it("sets and gets endTime", () => {
            const query = new TopicMessageQuery().setEndTime(endTime);
            expect(query.endTime).toBe(endTime);
        });

        it("sets and gets limit", () => {
            const query = new TopicMessageQuery().setLimit(50);
            expect(query.limit.toNumber()).toBe(50);
        });

        it("sets and gets maxAttempts", () => {
            const query = new TopicMessageQuery().setMaxAttempts(5);
            expect(query._maxAttempts).toBe(5);
        });

        it("sets and gets maxBackoff", () => {
            const query = new TopicMessageQuery().setMaxBackoff(5000);
            expect(query._maxBackoff).toBe(5000);
        });
    });

    describe("Handlers", () => {
        it("sets error handler", () => {
            const errorHandler = vi.fn();
            const query = new TopicMessageQuery().setErrorHandler(errorHandler);
            expect(query._errorHandler).toBe(errorHandler);
        });

        it("sets completion handler", () => {
            const completionHandler = vi.fn();
            const query = new TopicMessageQuery().setCompletionHandler(completionHandler);
            expect(query._completionHandler).toBe(completionHandler);
        });
    });

    describe("Validation", () => {
        it("throws error when changing fields after subscribe", () => {
            const query = new TopicMessageQuery();
            // Mocking _handle to simulate an active subscription
            query._handle = {}; 
            
            expect(() => query.setTopicId("0.0.1")).toThrow("Cannot change fields on an already subscribed query");
            expect(() => query.setStartTime(100)).toThrow("Cannot change fields on an already subscribed query");
            expect(() => query.setEndTime(200)).toThrow("Cannot change fields on an already subscribed query");
            expect(() => query.setLimit(10)).toThrow("Cannot change fields on an already subscribed query");
            expect(() => query.setMaxAttempts(5)).toThrow("Cannot change fields on an already subscribed query");
        });
    });

    describe("Retry Logic", () => {
        it("shouldRetry returns true for low-level Error", () => {
            const query = new TopicMessageQuery();
            const error = new Error("Connection reset");
            expect(query.shouldRetry(error)).toBe(true);
        });

        it("shouldRetry returns false when max attempts reached", () => {
            const query = new TopicMessageQuery().setMaxAttempts(1);
            query._attempt = 1;
            const error = new Error("Retryable error");
            expect(query.shouldRetry(error)).toBe(false);
        });

        it("shouldRetry handles MirrorError codes correctly", () => {
            const query = new TopicMessageQuery();
            // Mocking MirrorError (code 14 is UNAVAILABLE)
            const mirrorError = { code: 14 }; 
            expect(query.shouldRetry(mirrorError)).toBe(true);
            
            const fatalError = { code: 3 }; // INVALID_ARGUMENT (usually not retryable)
            expect(query.shouldRetry(fatalError)).toBe(false);
        });
    });
});