// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import FeeEstimateMode from "./enums/FeeEstimateMode.js";
import NetworkFee from "./NetworkFee.js";
import FeeEstimate from "./FeeEstimate.js";

/**
 * The response containing the estimated transaction fees.
 */
export default class FeeEstimateResponse {
    /**
     * @param {object} props
     * @param {number} props.mode - The mode that was used to calculate the fees
     * @param {NetworkFee} props.networkFee - The network fee component
     * @param {FeeEstimate} props.nodeFee - The node fee component
     * @param {FeeEstimate} props.serviceFee - The service fee component
     * @param {string[]} props.notes - An array of strings for any caveats
     * @param {Long | number} props.total - The sum of the network, node, and service subtotals in tinycents
     */
    constructor(props) {
        /**
         * The mode that was used to calculate the fees.
         * @readonly
         */
        this.mode = props.mode;

        /**
         * The network fee component which covers the cost of gossip, consensus,
         * signature verifications, fee payment, and storage.
         * @readonly
         */
        this.networkFee = props.networkFee;

        /**
         * The node fee component which is to be paid to the node that submitted the
         * transaction to the network.
         * @readonly
         */
        this.nodeFee = props.nodeFee;

        /**
         * The service fee component which covers execution costs, state saved in the
         * Merkle tree, and additional costs to the blockchain storage.
         * @readonly
         */
        this.serviceFee = props.serviceFee;

        /**
         * An array of strings for any caveats (e.g., ["Fallback to worst-case due to missing state"]).
         * @readonly
         */
        this.notes = props.notes || [];

        /**
         * The sum of the network, node, and service subtotals in tinycents.
         * @readonly
         */
        this.total = Long.fromValue(props.total);
    }

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
     * @property {number} baseFee
     * @property {FeeExtraJSON[]} extras
     */

    /**
     * @typedef {object} FeeEstimateResponseJSON
     * @property {string} mode
     * @property {NetworkFeeJSON} network
     * @property {FeeEstimateJSON} node
     * @property {FeeEstimateJSON} service
     * @property {string[]} notes
     * @property {number} total
     */

    /**
     * @internal
     * @param {FeeEstimateResponseJSON} response
     * @returns {FeeEstimateResponse}
     */
    static _fromJSON(response) {
        return new FeeEstimateResponse({
            mode:
                response.mode != null
                    ? Number(response.mode)
                    : FeeEstimateMode.STATE,
            networkFee: response.network
                ? NetworkFee._fromJSON(response.network)
                : new NetworkFee({ multiplier: 0, subtotal: 0 }),
            nodeFee: response.node
                ? FeeEstimate._fromJSON(response.node)
                : new FeeEstimate({ base: 0, extras: [] }),
            serviceFee: response.service
                ? FeeEstimate._fromJSON(response.service)
                : new FeeEstimate({ base: 0, extras: [] }),
            notes: response.notes || [],
            total: response.total || 0,
        });
    }
}
