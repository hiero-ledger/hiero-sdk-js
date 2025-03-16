// SPDX-License-Identifier: Apache-2.0

import * as entity_id from "../EntityIdHelper.js";
import * as HieroProto from "@hashgraph/proto";

/**
 * @typedef {import("long")} Long
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * Class representing a unique identifier for a scheduled transaction on the Hedera network.
 *
 * A ScheduleId consists of three components:
 * Shard ID: The shard number where the schedule exists
 * Realm ID: The realm number within the shard
 * Schedule Number: The unique number identifying the schedule
 * @augments {EntityId<HieroProto.proto.IScheduleID>}
 */

export default class ScheduleId {
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
     * @returns {ScheduleId}
     */
    static fromString(text) {
        const result = entity_id.fromString(text);
        const id = new ScheduleId(result);
        id._checksum = result.checksum;
        return id;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IScheduleID} id
     * @returns {ScheduleId}
     */
    static _fromProtobuf(id) {
        const scheduleId = new ScheduleId(
            id.shardNum != null ? id.shardNum : 0,
            id.realmNum != null ? id.realmNum : 0,
            id.scheduleNum != null ? id.scheduleNum : 0,
        );

        return scheduleId;
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
     * @returns {ScheduleId}
     */
    static fromBytes(bytes) {
        return ScheduleId._fromProtobuf(
            HieroProto.proto.ScheduleID.decode(bytes),
        );
    }

    /**
     * @param {string} address
     * @returns {ScheduleId}
     */
    static fromSolidityAddress(address) {
        return new ScheduleId(...entity_id.fromSolidityAddress(address));
    }

    /**
     * @returns {string}
     */
    toSolidityAddress() {
        return entity_id.toSolidityAddress([this.shard, this.realm, this.num]);
    }

    /**
     * @internal
     * @returns {HieroProto.proto.ScheduleID}
     */
    _toProtobuf() {
        return {
            scheduleNum: this.num,
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
        return HieroProto.proto.ScheduleID.encode(this._toProtobuf()).finish();
    }

    /**
     * @returns {ScheduleId}
     */
    clone() {
        const id = new ScheduleId(this);
        id._checksum = this._checksum;
        return id;
    }

    /**
     * @param {ScheduleId} other
     * @returns {number}
     */
    compare(other) {
        return entity_id.compare(
            [this.shard, this.realm, this.num],
            [other.shard, other.realm, other.num],
        );
    }
}
