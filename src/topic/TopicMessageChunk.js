// SPDX-License-Identifier: Apache-2.0

import Timestamp from "../Timestamp.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITimestamp} HieroProto.proto.ITimestamp
 */

/**
 * @namespace com
 * @typedef {import("@hashgraph/proto").com.hedera.mirror.api.proto.IConsensusTopicResponse} com.hedera.mirror.api.proto.IConsensusTopicResponse
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
     * @param {com.hedera.mirror.api.proto.IConsensusTopicResponse} response
     * @returns {TopicMessageChunk}
     */
    static _fromProtobuf(response) {
        return new TopicMessageChunk({
            consensusTimestamp: Timestamp._fromProtobuf(
                /** @type {HieroProto.proto.ITimestamp} */
                (response.consensusTimestamp),
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
     * @returns {com.hedera.mirror.api.proto.IConsensusTopicResponse}
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
