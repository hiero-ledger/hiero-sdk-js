// SPDX-License-Identifier: Apache-2.0

import * as entity_id from "../EntityIdHelper.js";
import * as HieroProto from "@hashgraph/proto";
import Long from "long";
import EvmAddress from "../EvmAddress.js";
import * as util from "../util.js";

/**
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * The ID for a crypto-currency file on Hedera.
 */
export default class FileId {
    /**
     * @param {number | Long | import("../EntityIdHelper").IEntityId} props
     * @param {(number | Long)=} realm
     * @param {(number | Long)=} num
     */
    constructor(props, realm, num) {
        const result = entity_id.constructor(props, realm, num);

        this.shard = result.shard;
        this.realm = result.realm;
        this.num = result.num;

        /**
         * @type {string | null}
         */
        this._checksum = null;
    }

    /**
     * @param {number} shard
     * @param {number} realm
     * @returns {FileId}
     */
    static getAddressBookFileIdFor(shard = 0, realm = 0) {
        return new FileId({ num: 102, shard, realm });
    }

    /**
     * @param {number} shard
     * @param {number} realm
     * @returns {FileId}
     */
    static getFeeScheduleFileIdFor(shard = 0, realm = 0) {
        return new FileId({ num: 111, shard, realm });
    }

    /**
     * @param {number} shard
     * @param {number} realm
     * @returns {FileId}
     */
    static getExchangeRatesFileIdFor(shard = 0, realm = 0) {
        return new FileId({ num: 112, shard, realm });
    }

    /**
     * @param {string} text
     * @returns {FileId}
     */
    static fromString(text) {
        const result = entity_id.fromString(text);
        const id = new FileId(result);
        id._checksum = result.checksum;
        return id;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IFileID} id
     * @returns {FileId}
     */
    static _fromProtobuf(id) {
        const fileId = new FileId(
            id.shardNum != null ? Long.fromString(id.shardNum.toString()) : 0,
            id.realmNum != null ? Long.fromString(id.realmNum.toString()) : 0,
            id.fileNum != null ? Long.fromString(id.fileNum.toString()) : 0,
        );

        return fileId;
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
        entity_id.validateChecksum(
            this.shard,
            this.realm,
            this.num,
            this._checksum,
            client,
        );
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FileId}
     */
    static fromBytes(bytes) {
        return FileId._fromProtobuf(HieroProto.proto.FileID.decode(bytes));
    }

    /**
     * @param {string} address
     * @deprecated - Use `fromEvmAddress` instead
     * @returns {FileId}
     */
    static fromSolidityAddress(address) {
        const [shard, realm, file] = entity_id.fromSolidityAddress(address);
        return new FileId(shard, realm, file);
    }

    /**
     * @param {number} shard
     * @param {number} realm
     * @param {string} address
     * @returns {FileId}
     */
    static fromEvmAddress(shard, realm, address) {
        const addressBytes = EvmAddress.fromString(address).toBytes();
        const isLongZero = util.isLongZeroAddress(addressBytes);

        if (!isLongZero) {
            throw new Error(
                "FileId.fromEvmAddress does not support non-long-zero addresses",
            );
        }

        const [shardLong, realmLong, fileLong] = entity_id.fromEvmAddress(
            shard,
            realm,
            address,
        );
        return new FileId(shardLong, realmLong, fileLong);
    }

    /**
     * @deprecated - Use `toEvmAddress` instead
     * @returns {string} solidity address
     */
    toSolidityAddress() {
        return entity_id.toSolidityAddress([this.shard, this.realm, this.num]);
    }

    /**
     * @returns {string}
     */
    toEvmAddress() {
        return entity_id.toEvmAddress(null, this.num);
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IFileID}
     */
    _toProtobuf() {
        return {
            fileNum: this.num,
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
        return entity_id.toStringWithChecksum(this.toString(), client);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.FileID.encode(this._toProtobuf()).finish();
    }

    /**
     * @returns {FileId}
     */
    clone() {
        const id = new FileId(this);
        id._checksum = this._checksum;
        return id;
    }

    /**
     * @param {FileId} other
     * @returns {number}
     */
    compare(other) {
        return entity_id.compare(
            [this.shard, this.realm, this.num],
            [other.shard, other.realm, other.num],
        );
    }
}

/**
 * The public node address book for the current network.
 */
FileId.ADDRESS_BOOK = new FileId(102);

/**
 * The current fee schedule for the network.
 */
FileId.FEE_SCHEDULE = new FileId(111);

/**
 * The current exchange rate of HBAR to USD.
 */
FileId.EXCHANGE_RATES = new FileId(112);
