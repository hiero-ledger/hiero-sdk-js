import NftId from "./NftId.js";
import AccountId from "../account/AccountId.js";
import Timestamp from "../Timestamp.js";
import * as hex from "../encoding/hex.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").TokenFreezeStatus} proto.TokenFreezeStatus
 * @typedef {import("@exodus/hashgraph-proto").TokenKycStatus} proto.TokenKycStatus
 * @typedef {import("@exodus/hashgraph-proto").TokenPauseStatus} proto.TokenPauseStatus
 * @typedef {import("@exodus/hashgraph-proto").ITokenNftInfo} proto.ITokenNftInfo
 * @typedef {import("@exodus/hashgraph-proto").INftID} proto.INftID
 * @typedef {import("@exodus/hashgraph-proto").ITimestamp} proto.ITimestamp
 * @typedef {import("@exodus/hashgraph-proto").ITokenID} proto.ITokenID
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 * @typedef {import("@exodus/hashgraph-proto").IKey} proto.IKey
 * @typedef {import("@exodus/hashgraph-proto").IDuration} proto.IDuration
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 */
export default class TokenNftInfo {
    /**
     * @private
     * @param {object} props
     * @param {NftId} props.nftId;
     * @param {AccountId} props.accountId;
     * @param {Timestamp} props.creationTime;
     * @param {Uint8Array | null} props.metadata;
     */
    constructor(props) {
        /**
         * ID of the nft instance
         *
         * @readonly
         */
        this.nftId = props.nftId;

        /**
         * @readonly
         */
        this.accountId = props.accountId;

        /**
         * @readonly
         */
        this.creationTime = props.creationTime;

        /**
         * @readonly
         */
        this.metadata = props.metadata;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {proto.ITokenNftInfo} info
     * @returns {TokenNftInfo}
     */
    static _fromProtobuf(info) {
        return new TokenNftInfo({
            nftId: NftId._fromProtobuf(
                /** @type {proto.INftID} */ (info.nftID)
            ),
            accountId: AccountId._fromProtobuf(
                /** @type {proto.IAccountID} */ (info.accountID)
            ),
            creationTime: Timestamp._fromProtobuf(
                /** @type {proto.ITimestamp} */ (info.creationTime)
            ),
            metadata: info.metadata !== undefined ? info.metadata : null,
        });
    }

    /**
     * @returns {proto.ITokenNftInfo}
     */
    _toProtobuf() {
        return {
            nftID: this.nftId._toProtobuf(),
            accountID: this.accountId._toProtobuf(),
            creationTime: this.creationTime._toProtobuf(),
            metadata: this.metadata,
        };
    }

    /**
     * @typedef {object} TokenNftInfoJson
     * @property {string} nftId
     * @property {string} accountId
     * @property {string} creationTime
     * @property {string | null} metadata
     * @returns {TokenNftInfoJson}
     */
    toJson() {
        return {
            nftId: this.nftId.toString(),
            accountId: this.accountId.toString(),
            creationTime: this.creationTime.toString(),
            metadata: this.metadata != null ? hex.encode(this.metadata) : null,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJson());
    }
}
