import AccountId from "../account/AccountId.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ICustomFee} proto.ICustomFee
 */

export default class CustomFee {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.feeCollectorAccountId]
     */
    constructor(props = {}) {
        /**
         * @type {?AccountId}
         */
        this._feeCollectorAccountId;

        if (props.feeCollectorAccountId != null) {
            this.setFeeCollectorAccountId(props.feeCollectorAccountId);
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
     * @internal
     * @abstract
     * @param {proto.ICustomFee} info
     * @returns {CustomFee}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _fromProtobuf(info) {
        throw new Error("not implemented");
    }

    /**
     * @internal
     * @abstract
     * @returns {proto.ICustomFee}
     */
    _toProtobuf() {
        throw new Error("not implemented");
    }
}
