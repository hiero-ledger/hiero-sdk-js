// SPDX-License-Identifier: Apache-2.0

import TopicMessage from "../../src/topic/TopicMessage.js";
import { Long } from "../../src/index.js";

describe("TopicMessage", function () {
    const initialTransactionID = {
        transactionValidStart: { seconds: 1000, nanos: 0 },
        accountID: { shardNum: 0, realmNum: 0, accountNum: 1 },
    };

    const singleResponse = {
        consensusTimestamp: { seconds: 2000, nanos: 5 },
        message: new Uint8Array([1, 2, 3]),
        runningHash: new Uint8Array([9, 9, 9]),
        sequenceNumber: 42,
    };

    describe("_ofSingle", function () {
        it("wraps a minimal response into a TopicMessage", function () {
            const message = TopicMessage._ofSingle(singleResponse);

            expect(message.contents).to.deep.equal(new Uint8Array([1, 2, 3]));
            expect(message.sequenceNumber.toNumber()).to.equal(42);
            expect(message.chunks.length).to.equal(1);
            expect(message.runningHash).to.deep.equal(
                new Uint8Array([9, 9, 9]),
            );
            expect(message.consensusTimestamp.seconds.toNumber()).to.equal(
                2000,
            );
            expect(message.consensusTimestamp.nanos.toNumber()).to.equal(5);
            expect(message.initialTransactionId).to.be.null;
        });

        it("extracts initialTransactionId from chunkInfo when present", function () {
            const message = TopicMessage._ofSingle({
                ...singleResponse,
                chunkInfo: {
                    number: 1,
                    total: 1,
                    initialTransactionID,
                },
            });

            expect(String(message.initialTransactionId)).to.equal(
                "0.0.1@1000.000000000",
            );
            expect(message.chunks.length).to.equal(1);
        });
    });

    describe("_ofMany", function () {
        function chunkResponse(number, messageBytes, sequenceNumber, seconds) {
            return {
                consensusTimestamp: { seconds, nanos: 0 },
                message: messageBytes,
                runningHash: new Uint8Array([number, number, number]),
                sequenceNumber,
                chunkInfo: {
                    number,
                    total: 2,
                    initialTransactionID,
                },
            };
        }

        it("concatenates bytes from two chunks in chunkInfo.number order", function () {
            const first = chunkResponse(1, new Uint8Array([1, 2]), 10, 3000);
            const second = chunkResponse(2, new Uint8Array([3, 4]), 11, 3001);

            const message = TopicMessage._ofMany([first, second]);

            expect(message.contents).to.deep.equal(
                new Uint8Array([1, 2, 3, 4]),
            );
            expect(message.chunks.length).to.equal(2);
            expect(message.chunks[0].contents).to.deep.equal(
                new Uint8Array([1, 2]),
            );
            expect(message.chunks[1].contents).to.deep.equal(
                new Uint8Array([3, 4]),
            );
            expect(message.sequenceNumber.toNumber()).to.equal(11);
            expect(message.consensusTimestamp.seconds.toNumber()).to.equal(
                3001,
            );
            expect(message.runningHash).to.deep.equal(
                new Uint8Array([2, 2, 2]),
            );
            expect(String(message.initialTransactionId)).to.equal(
                "0.0.1@1000.000000000",
            );
        });

        it("sorts out-of-order responses by chunkInfo.number before concatenating", function () {
            const first = chunkResponse(1, new Uint8Array([10, 20]), 10, 4000);
            const second = chunkResponse(2, new Uint8Array([30, 40]), 11, 4001);

            // Input order is reversed; contents must still follow chunk numbers.
            // Message-level timestamp/sequence come from the last input element
            // before sorting (responses[length - 1]).
            const message = TopicMessage._ofMany([second, first]);

            expect(message.contents).to.deep.equal(
                new Uint8Array([10, 20, 30, 40]),
            );
            expect(message.chunks.length).to.equal(2);
            expect(message.chunks[0].contents).to.deep.equal(
                new Uint8Array([10, 20]),
            );
            expect(message.chunks[1].contents).to.deep.equal(
                new Uint8Array([30, 40]),
            );
            expect(message.sequenceNumber.toNumber()).to.equal(10);
            expect(message.consensusTimestamp.seconds.toNumber()).to.equal(
                4000,
            );
            expect(message.runningHash).to.deep.equal(
                new Uint8Array([1, 1, 1]),
            );
            expect(String(message.initialTransactionId)).to.equal(
                "0.0.1@1000.000000000",
            );
        });

        it("accepts a Long sequenceNumber on the last response", function () {
            const first = chunkResponse(1, new Uint8Array([1]), 10, 5000);
            const second = {
                ...chunkResponse(2, new Uint8Array([2]), 11, 5001),
                sequenceNumber: Long.fromNumber(99),
            };

            const message = TopicMessage._ofMany([first, second]);
            expect(message.sequenceNumber.toNumber()).to.equal(99);
        });
    });
});
