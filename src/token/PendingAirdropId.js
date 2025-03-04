// SPDX-License-Identifier: Apache-2.0
/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.PendingAirdropId} HieroProto.proto.PendingAirdropId
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
     * @param {AccountId} [props.senderId]
     * @param {AccountId} [props.receiverId]
     * @param {TokenId?} [props.tokenId]
     * @param {NftId?} [props.nftId]
     */
    constructor(props = {}) {
        this._senderId = null;
        this._receiverId = null;
        this._tokenId = null;
        this._nftId = null;

        if (props.receiverId) {
            this._receiverId = props.receiverId;
        }
        if (props.senderId) {
            this._senderId = props.senderId;
        }
        if (props.tokenId) {
            this._tokenId = new TokenId(props.tokenId);
        } else if (props.nftId) {
            this._nftId = new NftId(props.nftId?.tokenId, props.nftId?.serial);
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
     * @param {AccountId} senderId
     * @returns {this}
     */
    setSenderid(senderId) {
        this._senderId = senderId;
        return this;
    }

    /**
     * @param {AccountId} receiverId
     * @returns {this}
     */
    setReceiverId(receiverId) {
        this._receiverId = receiverId;
        return this;
    }

    /**
     * @param {TokenId} tokenId
     * @returns {this}
     */
    setTokenId(tokenId) {
        this._nftId = null;
        this._tokenId = tokenId;
        return this;
    }

    /**
     * @param {NftId} nftId
     * @returns {this}
     */
    setNftId(nftId) {
        this._tokenId = null;
        this._nftId = nftId;
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
            senderId: this.senderId?._toProtobuf(),
            receiverId: this._receiverId?._toProtobuf(),
            fungibleTokenType: this._tokenId?._toProtobuf(),
            nonFungibleToken: this._nftId?._toProtobuf(),
        };
    }
}
