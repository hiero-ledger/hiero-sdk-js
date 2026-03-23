// SPDX-License-Identifier: Apache-2.0

import * as EntityIdHelper from '../EntityIdHelper.js';
import * as HieroProto from '@hiero-ledger/proto';
import Long from 'long';
import EvmAddress from '../EvmAddress.js';
import * as util from '../util.js';

/**
 * @typedef {import('../client/Client.js').default<import('../channel/Channel.js').default, import('../channel/MirrorChannel.js').default>} Client
 */

/**
 * The ID for a crypto-currency file on Hedera.
 */
export default class FileId {
    /**
     * @param {number | Long | import('../EntityIdHelper').IEntityId} props
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
        const result = EntityIdHelper.fromString(text);
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
     * @returns {FileId}
     */
