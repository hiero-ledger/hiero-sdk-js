// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import NetworkFee from "./NetworkFee.js";
import FeeEstimate from "./FeeEstimate.js";

/**
 * @typedef {object} NetworkFeeJSON
 * @property {number} multiplier
 * @property {number} subtotal
 */

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
 * @property {number} base
 * @property {FeeExtraJSON[]} extras
 */

/**
 * @typedef {object} FeeEstimateResponseJSON
 * @property {number} [high_volume_multiplier]
 * @property {NetworkFeeJSON} [network]
 * @property {FeeEstimateJSON} [node]
 * @property {FeeEstimateJSON} [service]
 * @property {number} [total]
 */

/**
 * The response containing the estimated transaction fees per HIP-1261.
 */
export default class FeeEstimateResponse {
    /**
     * @param {object} props
     * @param {Long | number} [props.highVolumeMultiplier] - The high-volume pricing
     *   multiplier per HIP-1313. 1 means no high-volume pricing applied; values > 1
     *   indicate high-volume pricing was simulated.
     * @param {NetworkFee} props.networkFee - The network fee component.
     * @param {FeeEstimate} props.nodeFee - The node fee component.
     * @param {FeeEstimate} props.serviceFee - The service fee component.
     * @param {Long | number} props.total - The sum of the network, node, and service
     *   subtotals in tinycents.
     */
    constructor(props) {
        /**
         * The high-volume pricing multiplier per HIP-1313. A value of 1 indicates
         * no high-volume pricing. A value > 1 applies when the transaction's
         * highVolume flag is true and throttle utilization is non-zero.
         *
         * @readonly
         */
        this.highVolumeMultiplier = Long.fromValue(
            props.highVolumeMultiplier != null ? props.highVolumeMultiplier : 1,
        );

        /**
         * The network fee component which covers the cost of gossip, consensus,
         * signature verifications, fee payment, and storage.
         *
         * @readonly
         */
        this.networkFee = props.networkFee;

        /**
         * The node fee component which is to be paid to the node that submitted
         * the transaction to the network.
         *
         * @readonly
         */
        this.nodeFee = props.nodeFee;

        /**
         * The service fee component which covers execution costs, state saved in
         * the Merkle tree, and additional costs to the blockchain storage.
         *
         * @readonly
         */
        this.serviceFee = props.serviceFee;

        /**
         * The sum of the network, node, and service subtotals in tinycents.
         *
         * @readonly
         */
        this.total = Long.fromValue(props.total);
    }

    /**
     * @internal
     * @param {FeeEstimateResponseJSON} response
     * @returns {FeeEstimateResponse}
     */
    static _fromJSON(response) {
        return new FeeEstimateResponse({
            highVolumeMultiplier:
                response.high_volume_multiplier != null
                    ? response.high_volume_multiplier
                    : 1,
            networkFee: response.network
                ? NetworkFee._fromJSON(response.network)
                : new NetworkFee({ multiplier: 0, subtotal: 0 }),
            nodeFee: response.node
                ? FeeEstimate._fromJSON(response.node)
                : new FeeEstimate({ base: 0, extras: [] }),
            serviceFee: response.service
                ? FeeEstimate._fromJSON(response.service)
                : new FeeEstimate({ base: 0, extras: [] }),
            total: response.total || 0,
        });
    }
}
