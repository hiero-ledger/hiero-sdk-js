import Timestamp from "../Timestamp.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IConsensusTopicResponse} proto.IConsensusTopicResponse
 * @typedef {import("@exodus/hashgraph-proto").ITimestamp} proto.ITimestamp
 */

export default class TopicMessageChunk {
    /**
     * @private
     * @param {object} props
     * @param {Timestamp} props.consensusTimestamp
     * @param {Uint8Array} props.contents
     * @param {Uint8Array} props.runningHash
     * @param {Long} props.sequenceNumber
     */
    constructor(props) {
        /** @readonly */
        this.consensusTimestamp = props.consensusTimestamp;
        /** @readonly */
        this.contents = props.contents;
        /** @readonly */
        this.runningHash = props.runningHash;
        /** @readonly */
        this.sequenceNumber = props.sequenceNumber;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.IConsensusTopicResponse} response
     * @returns {TopicMessageChunk}
     */
    static _fromProtobuf(response) {
        return new TopicMessageChunk({
            consensusTimestamp: Timestamp._fromProtobuf(
                /** @type {proto.ITimestamp} */
                (response.consensusTimestamp)
            ),
            contents:
                response.message != null ? response.message : new Uint8Array(),
            runningHash:
                response.runningHash != null
                    ? response.runningHash
                    : new Uint8Array(),
            sequenceNumber:
                response.sequenceNumber != null
                    ? response.sequenceNumber instanceof Long
                        ? response.sequenceNumber
                        : Long.fromValue(response.sequenceNumber)
                    : Long.ZERO,
        });
    }

    /**
     * @internal
     * @returns {proto.IConsensusTopicResponse}
     */
    _toProtobuf() {
        return {
            consensusTimestamp: this.consensusTimestamp._toProtobuf(),
            message: this.contents,
            runningHash: this.runningHash,
            sequenceNumber: this.sequenceNumber,
        };
    }
}
