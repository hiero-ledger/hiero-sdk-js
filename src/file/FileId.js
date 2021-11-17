import * as entity_id from "../EntityIdHelper.js";
import * as proto from "@exodus/hashgraph-proto";

/**
 * @typedef {import("long").Long} Long
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
     * @param {proto.IFileID} id
     * @returns {FileId}
     */
    static _fromProtobuf(id) {
        const fileId = new FileId(
            id.shardNum != null ? id.shardNum : 0,
            id.realmNum != null ? id.realmNum : 0,
            id.fileNum != null ? id.fileNum : 0
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
            client
        );
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {FileId}
     */
    static fromBytes(bytes) {
        return FileId._fromProtobuf(proto.FileID.decode(bytes));
    }

    /**
     * @internal
     * @returns {proto.IFileID}
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
        return proto.FileID.encode(this._toProtobuf()).finish();
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
            [other.shard, other.realm, other.num]
        );
    }
}
