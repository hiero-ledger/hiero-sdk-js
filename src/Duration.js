// SPDX-License-Identifier: Apache-2.0

import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IDuration} HieroProto.proto.IDuration
 */

/**
 * A duration type.
 *
 * The main point of this tyope is for encapsulating the `[to|from]Protobuf()` implementations
 */
export default class Duration {
    /**
     * @param {Long | number} seconds
     */
    constructor(seconds) {
        /**
         * @readonly
         * @type {Long}
         */
        this.seconds =
            seconds instanceof Long ? seconds : Long.fromNumber(seconds);

        Object.freeze(this);
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IDuration}
     */
    _toProtobuf() {
        return {
            seconds: this.seconds,
        };
    }

    /**
     * @internal
     * @param {HieroProto.proto.IDuration} duration
     * @returns {Duration}
     */
    static _fromProtobuf(duration) {
        return new Duration(/** @type {Long} */ (duration.seconds));
    }
}
