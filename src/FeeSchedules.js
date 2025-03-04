// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hashgraph/proto";
import FeeSchedule from "./FeeSchedule.js";

/**
 * Represents a pair of fee schedules on the Hedera network - the currently active fee schedule
 * and the next upcoming fee schedule. This structure allows for transparent fee updates by making
 * future fee changes visible before they take effect.
 */
export default class FeeSchedules {
    /**
     * @param {object} [props]
     * @param {FeeSchedule} [props.currentFeeSchedule]
     * @param {FeeSchedule} [props.nextFeeSchedule]
     */
    constructor(props = {}) {
        /*
         * Contains current Fee Schedule
         *
         * @type {FeeSchedule}
         */
        this.current = props.currentFeeSchedule;

        /*
         * Contains next Fee Schedule
         *
         * @type {FeeSchedule}
         */
        this.next = props.nextFeeSchedule;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FeeSchedules}
     */
    static fromBytes(bytes) {
        return FeeSchedules._fromProtobuf(
            HieroProto.proto.CurrentAndNextFeeSchedule.decode(bytes),
        );
    }

    /**
     * @internal
     * @param {HieroProto.proto.ICurrentAndNextFeeSchedule} feeSchedules
     * @returns {FeeSchedules}
     */
    static _fromProtobuf(feeSchedules) {
        return new FeeSchedules({
            currentFeeSchedule:
                feeSchedules.currentFeeSchedule != null
                    ? FeeSchedule._fromProtobuf(feeSchedules.currentFeeSchedule)
                    : undefined,
            nextFeeSchedule:
                feeSchedules.nextFeeSchedule != null
                    ? FeeSchedule._fromProtobuf(feeSchedules.nextFeeSchedule)
                    : undefined,
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ICurrentAndNextFeeSchedule}
     */
    _toProtobuf() {
        return {
            currentFeeSchedule:
                this.current != null ? this.current._toProtobuf() : undefined,
            nextFeeSchedule:
                this.next != null ? this.next._toProtobuf() : undefined,
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.CurrentAndNextFeeSchedule.encode(
            this._toProtobuf(),
        ).finish();
    }
}
