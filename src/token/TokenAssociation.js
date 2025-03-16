// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import TokenId from "../token/TokenId.js";
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITokenAssociation} HieroProto.proto.ITokenAssociation
 */

/**
 * @typedef {object} TokenAssociationJSON
 * @property {?string} accountId
 * @property {?string} tokenId
 */

export default class TokenAssociation {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.accountId]
     * @param {TokenId | string} [props.tokenId]
     */
    constructor(props = {}) {
        /**
         * @type {?AccountId}
         */
        this._accountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        /**
         * @type {?TokenId}
         */
        this._tokenId = null;

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }

        this._defaultMaxTransactionFee = new Hbar(5);
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId;
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
     * @internal
     * @abstract
     * @param {HieroProto.proto.ITokenAssociation} association
     * @returns {TokenAssociation}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _fromProtobuf(association) {
        return new TokenAssociation({
            accountId:
                association.accountId != null
                    ? AccountId._fromProtobuf(association.accountId)
                    : undefined,
            tokenId:
                association.tokenId != null
                    ? TokenId._fromProtobuf(association.tokenId)
                    : undefined,
        });
    }

    /**
     * @internal
     * @abstract
     * @returns {HieroProto.proto.ITokenAssociation}
     */
    _toProtobuf() {
        return {
            accountId:
                this._accountId != null
                    ? this._accountId._toProtobuf()
                    : undefined,
            tokenId:
                this._tokenId != null ? this._tokenId._toProtobuf() : undefined,
        };
    }

    /**
     * @returns {TokenAssociationJSON}
     */
    toJSON() {
        return {
            accountId: this._accountId?.toString() || null,
            tokenId: this._tokenId?.toString() || null,
        };
    }
}
