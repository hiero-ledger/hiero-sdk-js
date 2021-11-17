import AccountId from "../account/AccountId.js";
import TokenId from "../token/TokenId.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITokenAssociation} proto.ITokenAssociation
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
        this._accountId;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        /**
         * @type {?TokenId}
         */
        this._tokenId;

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        }
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
     * @param {proto.ITokenAssociation} association
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
     * @returns {proto.ITokenAssociation}
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
}
