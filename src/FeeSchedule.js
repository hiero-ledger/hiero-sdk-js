// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hashgraph/proto";
import TransactionFeeSchedule from "./TransactionFeeSchedule.js";
import Timestamp from "./Timestamp.js";

/**
 * A set of fee schedules covering all transaction types and query types, along
 * with a specific time at which this fee schedule will expire.
 */
export default class FeeSchedule {
    /**
     * @param {object} [props]
     * @param {TransactionFeeSchedule[]} [props.transactionFeeSchedule]
     * @param {Timestamp} [props.expirationTime]
     */
    constructor(props = {}) {
        /*
         * List of price coefficients for network resources
         *
         * @type {TransactionFeeSchedule}
         */
        this.transactionFeeSchedule = props.transactionFeeSchedule;

        /*
         * FeeSchedule expiry time
         *
         * @type {Timestamp}
         */
        this.expirationTime = props.expirationTime;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FeeSchedule}
     */
    static fromBytes(bytes) {
        return FeeSchedule._fromProtobuf(
            HieroProto.proto.FeeSchedule.decode(bytes),
        );
    }

    /**
     * @internal
     * @param {HieroProto.proto.IFeeSchedule} feeSchedule
     * @returns {FeeSchedule}
     */
    static _fromProtobuf(feeSchedule) {
        return new FeeSchedule({
            transactionFeeSchedule:
                feeSchedule.transactionFeeSchedule != null
                    ? feeSchedule.transactionFeeSchedule.map((schedule) =>
                          TransactionFeeSchedule._fromProtobuf(schedule),
                      )
                    : undefined,
            expirationTime:
                feeSchedule.expiryTime != null
                    ? Timestamp._fromProtobuf(feeSchedule.expiryTime)
                    : undefined,
        });
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IFeeSchedule}
     */
    _toProtobuf() {
        return {
            transactionFeeSchedule:
                this.transactionFeeSchedule != null
                    ? this.transactionFeeSchedule.map((transaction) =>
                          transaction._toProtobuf(),
                      )
                    : undefined,
            expiryTime:
                this.expirationTime != null
                    ? this.expirationTime._toProtobuf()
                    : undefined,
        };
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.FeeSchedule.encode(this._toProtobuf()).finish();
    }
}
