// SPDX-License-Identifier: Apache-2.0
/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.PendingAirdropId} HieroProto.proto.PendingAirdropId
 */

import AccountId from "../account/AccountId.js";
import TokenId from "./TokenId.js";
import NftId from "./NftId.js";

/**
 * Represents the identifier for a pending airdrop in the Hedera network.
 *
 * A PendingAirdropId contains information about a pending token or NFT airdrop,
 * including the sender, receiver, and the token or NFT being airdropped. This class
 * is used to track and identify specific airdrops in the system.
 */
export default class PendingAirdropId {
    /**
     *
     * @param {object} props
     * @param {AccountId | string} [props.senderId]
     * @param {AccountId | string} [props.receiverId]
     * @param {TokenId | string | null} [props.tokenId]
     * @param {NftId | string | null} [props.nftId]
     */

    constructor(props = {}) {
        this._senderId = null;
        this._receiverId = null;
        this._tokenId = null;
        this._nftId = null;

        if (props.receiverId != null) {
            this.setReceiverId(props.receiverId);
        }
        if (props.senderId != null) {
            this.setSenderid(props.senderId);
        }

        if (props.tokenId != null) {
            this.setTokenId(props.tokenId);
        } else if (props.nftId != null) {
            this.setNftId(props.nftId);
        }
    }

    /**
     * @param {HieroProto.proto.PendingAirdropId} pb
     * @returns {PendingAirdropId}
     */
    static fromBytes(pb) {
        if (pb.senderId == null) {
            throw new Error("senderId is required");
        }

        if (pb.receiverId == null) {
            throw new Error("receiverId is required");
        }

        if (pb.fungibleTokenType == null && pb.nonFungibleToken == null) {
            throw new Error(
                "Either fungibleTokenType or nonFungibleToken is required",
            );
        }

        return new PendingAirdropId({
            senderId: AccountId._fromProtobuf(pb.senderId),
            receiverId: AccountId._fromProtobuf(pb.receiverId),
            nftId:
                pb.nonFungibleToken != null
                    ? NftId._fromProtobuf(pb.nonFungibleToken)
                    : null,
            tokenId:
                pb.fungibleTokenType != null
                    ? TokenId._fromProtobuf(pb.fungibleTokenType)
                    : null,
        });
    }

    /**
     *
     * @param {AccountId | string} senderId
     * @returns {this}
     */
    setSenderid(senderId) {
        this._senderId =
            typeof senderId === "string"
                ? AccountId.fromString(senderId)
                : senderId;
        return this;
    }

    /**
     * @param {AccountId | string} receiverId
     * @returns {this}
     */
    setReceiverId(receiverId) {
        this._receiverId =
            typeof receiverId === "string"
                ? AccountId.fromString(receiverId)
                : receiverId;
        return this;
    }

    /**
     * @param {TokenId | string} tokenId
     * @returns {this}
     */
    setTokenId(tokenId) {
        this._nftId = null;
        this._tokenId =
            typeof tokenId === "string" ? TokenId.fromString(tokenId) : tokenId;
        return this;
    }

    /**
     * @param {NftId | string} nftId
     * @returns {this}
     */
    setNftId(nftId) {
        this._tokenId = null;
        this._nftId =
            typeof nftId === "string" ? NftId.fromString(nftId) : nftId;
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get senderId() {
        return this._senderId;
    }

    /**
     * @returns {?AccountId}
     */
    get receiverId() {
        return this._receiverId;
    }

    /**
     * @returns {?TokenId}
     */
    get tokenId() {
        return this._tokenId;
    }

    /**
     * @returns {?NftId}
     */
    get nftId() {
        return this._nftId;
    }

    /**
     *  @returns {HieroProto.proto.PendingAirdropId}
     */
    toBytes() {
        return {
            senderId: this._senderId?._toProtobuf(),
            receiverId: this._receiverId?._toProtobuf(),
            fungibleTokenType: this._tokenId?._toProtobuf(),
            nonFungibleToken: this._nftId?._toProtobuf(),
        };
    }
}
