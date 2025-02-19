// SPDX-License-Identifier: Apache-2.0
import Transaction from "../transaction/Transaction.js";

/**
 * @typedef {import("../token/PendingAirdropId.js").default} PendingAirdropId
 */
export default class AirdropPendingTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {PendingAirdropId[]} [props.pendingAirdropIds]
     */
    constructor(props) {
        /**
         * @private
         * @type {PendingAirdropId[]}
         */
        super();

        /**
         * @private
         * @type {PendingAirdropId[]}
         */
        this._pendingAirdropIds = [];

        if (props?.pendingAirdropIds != null) {
            this._pendingAirdropIds = props.pendingAirdropIds;
        }
    }

    /**
     * @returns {PendingAirdropId[]}
     */
    get pendingAirdropIds() {
        return this._pendingAirdropIds;
    }

    /**
     *
     * @param {PendingAirdropId} pendingAirdropId
     * @returns {this}
     */
    addPendingAirdropId(pendingAirdropId) {
        this._requireNotFrozen();
        this._pendingAirdropIds.push(pendingAirdropId);
        return this;
    }

    /**
     *
     * @param {PendingAirdropId[]} pendingAirdropIds
     * @returns {this}
     */
    setPendingAirdropIds(pendingAirdropIds) {
        this._requireNotFrozen();
        this._pendingAirdropIds = pendingAirdropIds;
        return this;
    }
}
