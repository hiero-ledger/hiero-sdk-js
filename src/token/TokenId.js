// SPDX-License-Identifier: Apache-2.0

import * as EntityIdHelper from "../EntityIdHelper.js";
import * as HieroProto from "@hashgraph/proto";
import EvmAddress from "../EvmAddress.js";
import * as util from "../util.js";

/**
 * @typedef {import("long")} Long
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * The ID for a crypto-currency token on Hedera.
 */
export default class TokenId {
    /**
     * @param {number | Long | import("../EntityIdHelper").IEntityId} props
     * @param {(number | Long)=} realm
     * @param {(number | Long)=} num
     */
    constructor(props, realm, num) {
        const result = EntityIdHelper.constructor(props, realm, num);

        this.shard = result.shard;
        this.realm = result.realm;
        this.num = result.num;

        /**
         * @type {string | null}
         */
        this._checksum = null;
    }

    /**
     * @param {string} text
     * @returns {TokenId}
     */
    static fromString(text) {
        const result = EntityIdHelper.fromString(text);
        const id = new TokenId(result);
        id._checksum = result.checksum;
        return id;
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITokenID} id
     * @returns {TokenId}
     */
    static _fromProtobuf(id) {
        const tokenId = new TokenId(
            id.shardNum != null ? id.shardNum : 0,
            id.realmNum != null ? id.realmNum : 0,
            id.tokenNum != null ? id.tokenNum : 0,
        );

        return tokenId;
    }

    /**
     * @returns {string | null}
     */
    get checksum() {
        return this._checksum;
    }

    /**
     * @deprecated - Use `validateChecksum` instead
     * @param {Client} client
     */
    validate(client) {
        console.warn("Deprecated: Use `validateChecksum` instead");
        this.validateChecksum(client);
    }

    /**
     * @param {Client} client
     */
    validateChecksum(client) {
        EntityIdHelper.validateChecksum(
            this.shard,
            this.realm,
            this.num,
            this._checksum,
            client,
        );
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {TokenId}
     */
    static fromBytes(bytes) {
        return TokenId._fromProtobuf(HieroProto.proto.TokenID.decode(bytes));
    }

    /**
     * @param {string} address
     * @deprecated - Use `fromEvmAddress` instead
     * @returns {TokenId}
     */
    static fromSolidityAddress(address) {
        return new TokenId(...EntityIdHelper.fromSolidityAddress(address));
    }

    /**
     * @param {number} shard
     * @param {number} realm
     * @param {string} address
     * @returns {TokenId}
     */
    static fromEvmAddress(shard, realm, address) {
        const addressBytes = EvmAddress.fromString(address).toBytes();
        const isLongZero = util.isLongZeroAddress(addressBytes);

        if (!isLongZero) {
            throw new Error(
                "TokenId.fromEvmAddress does not support non-long-zero addresses",
            );
        }

        const [shardLong, realmLong, tokenLong] = EntityIdHelper.fromEvmAddress(
            shard,
            realm,
            address,
        );
        return new TokenId(shardLong, realmLong, tokenLong);
    }

    /**
     * @deprecated - Use `toEvmAddress` instead
     * @returns {string} solidity address
     */
    toSolidityAddress() {
        return EntityIdHelper.toSolidityAddress([
            this.shard,
            this.realm,
            this.num,
        ]);
    }

    /**
     * @returns {string}
     */
    toEvmAddress() {
        return EntityIdHelper.toEvmAddress(this.num);
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ITokenID}
     */
    _toProtobuf() {
        return {
            tokenNum: this.num,
            shardNum: this.shard,
            realmNum: this.realm,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.shard.toString()}.${this.realm.toString()}.${this.num.toString()}`;
    }

    /**
     * @param {Client} client
     * @returns {string}
     */
    toStringWithChecksum(client) {
        return EntityIdHelper.toStringWithChecksum(this.toString(), client);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.TokenID.encode(this._toProtobuf()).finish();
    }

    /**
     * @returns {TokenId}
     */
    clone() {
        const id = new TokenId(this);
        id._checksum = this._checksum;
        return id;
    }

    /**
     * @param {TokenId} other
     * @returns {number}
     */
    compare(other) {
        return EntityIdHelper.compare(
            [this.shard, this.realm, this.num],
            [other.shard, other.realm, other.num],
        );
    }
}
