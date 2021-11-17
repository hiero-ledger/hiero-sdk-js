import * as entity_id from "../EntityIdHelper.js";
import { TopicID as ProtoTopicID } from "@exodus/hashgraph-proto";

/**
 * @typedef {import("long").Long} Long
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITopicID} proto.ITopicID
 */

/**
 * Unique identifier for a topic (used by the consensus service).
 */
export default class TopicId {
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
     * @returns {TopicId}
     */
    static fromString(text) {
        const result = entity_id.fromString(text);
        const id = new TopicId(result);
        id._checksum = result.checksum;
        return id;
    }

    /**
     * @internal
     * @param {proto.ITopicID} id
     * @returns {TopicId}
     */
    static _fromProtobuf(id) {
        const topicId = new TopicId(
            id.shardNum != null ? id.shardNum : 0,
            id.realmNum != null ? id.realmNum : 0,
            id.topicNum != null ? id.topicNum : 0
        );

        return topicId;
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
     * @returns {TopicId}
     */
    static fromBytes(bytes) {
        return TopicId._fromProtobuf(ProtoTopicID.decode(bytes));
    }

    /**
     * @returns {proto.ITopicID}
     */
    _toProtobuf() {
        return {
            topicNum: this.num,
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
        return ProtoTopicID.encode(this._toProtobuf()).finish();
    }

    /**
     * @returns {TopicId}
     */
    clone() {
        const id = new TopicId(this);
        id._checksum = this._checksum;
        return id;
    }

    /**
     * @param {TopicId} other
     * @returns {number}
     */
    compare(other) {
        return entity_id.compare(
            [this.shard, this.realm, this.num],
            [other.shard, other.realm, other.num]
        );
    }
}
