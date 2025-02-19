// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ICustomFee} HieroProto.proto.ICustomFee
 */

export default class CustomFee {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.feeCollectorAccountId]
     * @param {boolean} [props.allCollectorsAreExempt]
     */
    constructor(props = {}) {
        /**
         * @type {?AccountId}
         */
        this._feeCollectorAccountId = null;

        this._allCollectorsAreExempt = false;

        if (props.feeCollectorAccountId != null) {
            this.setFeeCollectorAccountId(props.feeCollectorAccountId);
        }

        if (props.allCollectorsAreExempt != null) {
            this.setAllCollectorsAreExempt(props.allCollectorsAreExempt);
        }
    }

    /**
     * @returns {?AccountId}
     */
    get feeCollectorAccountId() {
        return this._feeCollectorAccountId;
    }

    /**
     * @param {AccountId | string} feeCollectorAccountId
     * @returns {this}
     */
    setFeeCollectorAccountId(feeCollectorAccountId) {
        this._feeCollectorAccountId =
            typeof feeCollectorAccountId === "string"
                ? AccountId.fromString(feeCollectorAccountId)
                : feeCollectorAccountId;
        return this;
    }

    /**
     * @returns {boolean}
     */
    get allCollectorsAreExempt() {
        return this._allCollectorsAreExempt;
    }

    /**
     * @param {boolean} allCollectorsAreExempt
     * @returns {this}
     */
    setAllCollectorsAreExempt(allCollectorsAreExempt) {
        this._allCollectorsAreExempt = allCollectorsAreExempt;
        return this;
    }

    /**
     * @internal
     * @abstract
     * @param {HieroProto.proto.ICustomFee} info
     * @returns {CustomFee}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _fromProtobuf(info) {
        throw new Error("not implemented");
    }

    /**
     * @internal
     * @abstract
     * @returns {HieroProto.proto.ICustomFee}
     */
    _toProtobuf() {
        throw new Error("not implemented");
    }
}
