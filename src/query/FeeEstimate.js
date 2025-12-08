// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import FeeExtra from "./FeeExtra.js";

/**
 * The fee estimate for a component. Includes the base fee and any extras.
 */
export default class FeeEstimate {
    /**
     * @param {object} props
     * @param {Long | number} props.base - The base fee price, in tinycents
     * @param {FeeExtra[]} props.extras - The extra fees that apply for this fee component
     */
    constructor(props) {
        /**
         * The base fee price, in tinycents.
         * @readonly
         */
        this.base = Long.fromValue(props.base);

        /**
         * The extra fees that apply for this fee component.
         * @readonly
         */
        this.extras = props.extras || [];
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
     * @typedef {object} FeeEstimateJSON
     * @property {number} baseFee
     * @property {FeeExtraJSON[]} extras
     */

    /**
     * @internal
     * @param {FeeEstimateJSON} feeEstimate
     * @returns {FeeEstimate}
     */
    static _fromJSON(feeEstimate) {
        return new FeeEstimate({
            base: feeEstimate.baseFee || 0,
            extras: (feeEstimate.extras || []).map((extra) =>
                FeeExtra._fromJSON(extra),
            ),
        });
    }

    /**
     * @internal
     * @param {import("@hiero-ledger/proto").com.hedera.mirror.api.proto.IFeeEstimate} feeEstimate
     * @returns {FeeEstimate}
     */
    static _fromProtobuf(feeEstimate) {
        return new FeeEstimate({
            base: feeEstimate.base || 0,
            extras: (feeEstimate.extras || []).map((extra) =>
                FeeExtra._fromProtobuf(extra),
            ),
        });
    }

    /**
     * @internal
     * @returns {object}
     */
    _toProtobuf() {
        return {
            base: this.base,
            extras: this.extras.map((extra) => extra._toProtobuf()),
        };
    }
}
