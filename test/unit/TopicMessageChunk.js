import TopicMessageChunk from "../../src/topic/TopicMessageChunk.js";
import { Long } from "../../src/index.js";

describe("TopicMessageChunk", function () {
    const fullResponse = {
        consensusTimestamp: { seconds: 1000, nanos: 0 },
        message: new Uint8Array([1, 2, 3]),
        runningHash: new Uint8Array([4, 5, 6]),
        sequenceNumber: 7,
    };

    describe("_fromProtobuf", function () {
        it("populates all fields from a full response", function () {
            const chunk = TopicMessageChunk._fromProtobuf(fullResponse);
            expect(chunk.contents).to.deep.equal(new Uint8Array([1, 2, 3]));
            expect(chunk.runningHash).to.deep.equal(new Uint8Array([4, 5, 6]));
            expect(chunk.sequenceNumber.toNumber()).to.equal(7);
        });

        it("uses empty defaults for missing optional fields", function () {
            const chunk = TopicMessageChunk._fromProtobuf({
                consensusTimestamp: { seconds: 0, nanos: 0 },
            });
            expect(chunk.contents).to.deep.equal(new Uint8Array());
            expect(chunk.runningHash).to.deep.equal(new Uint8Array());
            expect(chunk.sequenceNumber.equals(Long.ZERO)).to.be.true;
        });

        it("accepts a Long sequenceNumber directly", function () {
            const chunk = TopicMessageChunk._fromProtobuf({
                ...fullResponse,
                sequenceNumber: Long.fromNumber(42),
            });
            expect(chunk.sequenceNumber.toNumber()).to.equal(42);
        });
    });

    describe("_toProtobuf", function () {
        it("round-trip recovers the original values", function () {
            const proto =
                TopicMessageChunk._fromProtobuf(fullResponse)._toProtobuf();
            expect(proto.message).to.deep.equal(new Uint8Array([1, 2, 3]));
            expect(proto.runningHash).to.deep.equal(new Uint8Array([4, 5, 6]));
            expect(Long.fromValue(proto.sequenceNumber).toNumber()).to.equal(7);
        });
    });
});
