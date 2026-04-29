// SPDX-License-Identifier: Apache-2.0

import Long from "long";

/**
 * The network fee component which covers the cost of gossip, consensus,
 * signature verifications, fee payment, and storage.
 */
export default class NetworkFee {
    /**
     * @param {object} props
     * @param {number} props.multiplier - Multiplied by the node fee to determine the total network fee
     * @param {Long | number} props.subtotal - The subtotal in tinycents for the network fee component
     */
    constructor(props) {
        /**
         * Multiplied by the node fee to determine the total network fee.
         * @readonly
         */
        this.multiplier = props.multiplier;

        /**
         * The subtotal in tinycents for the network fee component which is calculated by
         * multiplying the node subtotal by the network multiplier.
         * @readonly
         */
        this.subtotal = Long.fromValue(props.subtotal);
    }

    /**
     * @typedef {object} NetworkFeeJSON
     * @property {number} multiplier
     * @property {number} subtotal
     */

    /**
     * @internal
     * @param {NetworkFeeJSON} networkFee
     * @returns {NetworkFee}
     */
    static _fromJSON(networkFee) {
        return new NetworkFee({
            multiplier: networkFee.multiplier || 0,
            subtotal: networkFee.subtotal || 0,
        });
    }
}
