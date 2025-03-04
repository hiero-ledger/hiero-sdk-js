// SPDX-License-Identifier: Apache-2.0

import NftId from "./NftId.js";
import AccountId from "../account/AccountId.js";
import Timestamp from "../Timestamp.js";
import * as hex from "../encoding/hex.js";
import LedgerId from "../LedgerId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.TokenFreezeStatus} HieroProto.proto.TokenFreezeStatus
 * @typedef {import("@hashgraph/proto").proto.TokenKycStatus} HieroProto.proto.TokenKycStatus
 * @typedef {import("@hashgraph/proto").proto.TokenPauseStatus} HieroProto.proto.TokenPauseStatus
 * @typedef {import("@hashgraph/proto").proto.ITokenNftInfo} HieroProto.proto.ITokenNftInfo
 * @typedef {import("@hashgraph/proto").proto.INftID} HieroProto.proto.INftID
 * @typedef {import("@hashgraph/proto").proto.ITimestamp} HieroProto.proto.ITimestamp
 * @typedef {import("@hashgraph/proto").proto.ITokenID} HieroProto.proto.ITokenID
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 * @typedef {import("@hashgraph/proto").proto.IKey} HieroProto.proto.IKey
 * @typedef {import("@hashgraph/proto").proto.IDuration} HieroProto.proto.IDuration
 */

export default class TokenNftInfo {
    /**
     * @private
     * @param {object} props
     * @param {NftId} props.nftId
     * @param {AccountId} props.accountId
     * @param {Timestamp} props.creationTime
     * @param {Uint8Array | null} props.metadata
     * @param {LedgerId|null} props.ledgerId
     * @param {AccountId|null} props.spenderId
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

        this.ledgerId = props.ledgerId;

        this.spenderId = props.spenderId;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITokenNftInfo} info
     * @returns {TokenNftInfo}
     */
    static _fromProtobuf(info) {
        return new TokenNftInfo({
            nftId: NftId._fromProtobuf(
                /** @type {HieroProto.proto.INftID} */ (info.nftID),
            ),
            accountId: AccountId._fromProtobuf(
                /** @type {HieroProto.proto.IAccountID} */ (info.accountID),
            ),
            creationTime: Timestamp._fromProtobuf(
                /** @type {HieroProto.proto.ITimestamp} */ (info.creationTime),
            ),
            metadata: info.metadata !== undefined ? info.metadata : null,
            ledgerId:
                info.ledgerId != null
                    ? LedgerId.fromBytes(info.ledgerId)
                    : null,
            spenderId:
                info.spenderId != null
                    ? AccountId._fromProtobuf(info.spenderId)
                    : null,
        });
    }

    /**
     * @returns {HieroProto.proto.ITokenNftInfo}
     */
    _toProtobuf() {
        return {
            nftID: this.nftId._toProtobuf(),
            accountID: this.accountId._toProtobuf(),
            creationTime: this.creationTime._toProtobuf(),
            metadata: this.metadata,
            ledgerId: this.ledgerId != null ? this.ledgerId.toBytes() : null,
            spenderId:
                this.spenderId != null ? this.spenderId._toProtobuf() : null,
        };
    }

    /**
     * @typedef {object} TokenNftInfoJson
     * @property {string} nftId
     * @property {string} accountId
     * @property {string} creationTime
     * @property {string | null} metadata
     * @property {string | null} ledgerId
     * @property {string | null} spenderId
     * @returns {TokenNftInfoJson}
     */
    toJson() {
        return {
            nftId: this.nftId.toString(),
            accountId: this.accountId.toString(),
            creationTime: this.creationTime.toString(),
            metadata: this.metadata != null ? hex.encode(this.metadata) : null,
            ledgerId: this.ledgerId != null ? this.ledgerId.toString() : null,
            spenderId:
                this.spenderId != null ? this.spenderId.toString() : null,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJson());
    }
}
