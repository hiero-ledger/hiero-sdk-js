// SPDX-License-Identifier: Apache-2.0

import Long from "long";

/**
 * The extra fee charged for the transaction.
 */
export default class FeeExtra {
    /**
     * @private
     * @param {object} props
     * @param {string} props.name - The unique name of this extra fee as defined in the fee schedule
     * @param {number} props.included - The count of this "extra" that is included for free
     * @param {number} props.count - The actual count of items received
     * @param {number} props.charged - The charged count of items as calculated by max(0, count - included)
     * @param {Long | number} props.feePerUnit - The fee price per unit in tinycents
     * @param {Long | number} props.subtotal - The subtotal in tinycents for this extra fee
     */
    constructor(props) {
        /**
         * The unique name of this extra fee as defined in the fee schedule.
         * @readonly
         */
        this.name = props.name;

        /**
         * The count of this "extra" that is included for free.
         * @readonly
         */
        this.included = props.included;

        /**
         * The actual count of items received.
         * @readonly
         */
        this.count = props.count;

        /**
         * The charged count of items as calculated by max(0, count - included).
         * @readonly
         */
        this.charged = props.charged;

        /**
         * The fee price per unit in tinycents.
         * @readonly
         */
        this.feePerUnit = Long.fromValue(props.feePerUnit);

        /**
         * The subtotal in tinycents for this extra fee. Calculated by multiplying the
         * charged count by the feePerUnit.
         * @readonly
         */
        this.subtotal = Long.fromValue(props.subtotal);
    }

    /**
     * @typedef {object} FeeExtraJSON
     * @property {string} name
     * @property {number} included
     * @property {number} count
     * @property {number} charged
     * @property {number} fee_per_unit
     * @property {number} subtotal
     */

    /**
     * @internal
     * @param {FeeExtraJSON} feeExtra
     * @returns {FeeExtra}
     */
    static _fromJSON(feeExtra) {
        return new FeeExtra({
            name: feeExtra.name || "",
            included: feeExtra.included || 0,
            count: feeExtra.count || 0,
            charged: feeExtra.charged || 0,
            feePerUnit: feeExtra.fee_per_unit || 0,
            subtotal: feeExtra.subtotal || 0,
        });
    }

    /**
     * @internal
     * @param {import("@hiero-ledger/proto").com.hedera.mirror.api.proto.IFeeExtra} feeExtra
     * @returns {FeeExtra}
     */
    static _fromProtobuf(feeExtra) {
        return new FeeExtra({
            name: feeExtra.name || "",
            included: feeExtra.included || 0,
            count: feeExtra.count || 0,
            charged: feeExtra.charged || 0,
            feePerUnit: feeExtra.feePerUnit || 0,
            subtotal: feeExtra.subtotal || 0,
        });
    }

    /**
     * @internal
     * @returns {object}
     */
    _toProtobuf() {
        return {
            name: this.name,
            included: this.included,
            count: this.count,
            charged: this.charged,
            feePerUnit: this.feePerUnit,
            subtotal: this.subtotal,
        };
    }
}
