// SPDX-License-Identifier: Apache-2.0

import TokenId from "./TokenId.js";
import AccountId from "../account/AccountId.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IAssessedCustomFee} HieroProto.proto.IAssessedCustomFee
 */

/**
 * @typedef {object} AssessedCustomFeeJSON
 * @property {?string} feeCollectorAccountId
 * @property {?string} tokenId
 * @property {?string} amount
 * @property {string[]} payerAccountIds
 */

/**
 * Represents an assessed custom fee that has been evaluated and attached to a transaction.
 * This includes details about who collects the fee, which token the fee is paid in,
 * the amount of the fee, and which accounts are responsible for paying it.
 */
export default class AssessedCustomFee {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.feeCollectorAccountId]
     * @param {TokenId | string} [props.tokenId]
     * @param {Long | number} [props.amount]
     * @param {AccountId[]} [props.payerAccountIds]
     */
    constructor(props = {}) {
        /**
         * @type {?AccountId}
         */
        this._feeCollectorAccountId = null;

        if (props.feeCollectorAccountId != null) {
            this.setFeeCollectorAccountId(props.feeCollectorAccountId);
        }

        /**
         * @type {?TokenId}
         */
        this._tokenId = null;

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        /**
         * @type {?Long}
         */
        this._amount = null;

        if (props.amount != null) {
            this.setAmount(props.amount);
        }

        /**
         * @type {?AccountId[]}
         */
        this._payerAccountIds = null;

        if (props.payerAccountIds != null) {
            this.setPayerAccountIds(props.payerAccountIds);
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
     * @returns {?TokenId}
     */
    get tokenId() {
        return this._tokenId;
    }

    /**
     * @param {TokenId | string} tokenId
     * @returns {this}
     */
    setTokenId(tokenId) {
        this._tokenId =
            typeof tokenId === "string" ? TokenId.fromString(tokenId) : tokenId;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get amount() {
        return this._amount;
    }

    /**
     * @param {Long | number} amount
     * @returns {AssessedCustomFee}
     */
    setAmount(amount) {
        this._amount =
            typeof amount === "number" ? Long.fromNumber(amount) : amount;
        return this;
    }

    /**
     * @returns {?AccountId[]}
     */
    get payerAccountIds() {
        return this._payerAccountIds;
    }

    /**
     * @param {AccountId[]} payerAccountIds
     * @returns {AssessedCustomFee}
     */
    setPayerAccountIds(payerAccountIds) {
        this._payerAccountIds = payerAccountIds;
        return this;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IAssessedCustomFee} fee
     * @returns {AssessedCustomFee}
     */
    static _fromProtobuf(fee) {
        return new AssessedCustomFee({
            feeCollectorAccountId:
                fee.feeCollectorAccountId != null
                    ? AccountId._fromProtobuf(fee.feeCollectorAccountId)
                    : undefined,
            tokenId:
                fee.tokenId != null
                    ? TokenId._fromProtobuf(fee.tokenId)
                    : undefined,
            amount: fee.amount != null ? fee.amount : undefined,
            payerAccountIds:
                fee.effectivePayerAccountId != null
                    ? fee.effectivePayerAccountId.map((id) =>
                          AccountId._fromProtobuf(id),
                      )
                    : undefined,
        });
    }

    /**
     * @internal
     * @abstract
     * @returns {HieroProto.proto.IAssessedCustomFee}
     */
    _toProtobuf() {
        return {
            feeCollectorAccountId:
                this.feeCollectorAccountId != null
                    ? this.feeCollectorAccountId._toProtobuf()
                    : null,
            tokenId: this._tokenId != null ? this._tokenId._toProtobuf() : null,
            amount: this._amount,
            effectivePayerAccountId:
                this._payerAccountIds != null
                    ? this._payerAccountIds.map((id) => id._toProtobuf())
                    : null,
        };
    }

    /**
     * @returns {AssessedCustomFeeJSON}
     */
    toJSON() {
        return {
            feeCollectorAccountId:
                this.feeCollectorAccountId?.toString() || null,
            tokenId: this._tokenId?.toString() || null,
            amount: this._amount?.toString() || null,
            payerAccountIds:
                this._payerAccountIds?.map((id) => id.toString()) || [],
        };
    }
}
