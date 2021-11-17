import * as entity_id from "../EntityIdHelper.js";
import { Key } from "@exodus/hashgraph-cryptography";
import * as proto from "@exodus/hashgraph-proto";

/**
 * @typedef {import("long").Long} Long
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * The ID for a crypto-currency contract on Hedera.
 */
export default class ContractId extends Key {
    /**
     * @param {number | Long | import("../EntityIdHelper").IEntityId} props
     * @param {(number | Long)=} realm
     * @param {(number | Long)=} num
     */
    constructor(props, realm, num) {
        super();

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
     * @returns {ContractId}
     */
    static fromString(text) {
        const result = entity_id.fromString(text);
        const id = new ContractId(result);
        id._checksum = result.checksum;
        return id;
    }

    /**
     * @internal
     * @param {proto.IContractID} id
     * @returns {ContractId}
     */
    static _fromProtobuf(id) {
        const contractId = new ContractId(
            id.shardNum != null ? id.shardNum : 0,
            id.realmNum != null ? id.realmNum : 0,
            id.contractNum != null ? id.contractNum : 0
        );

        return contractId;
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
     * @returns {ContractId}
     */
    static fromBytes(bytes) {
        return ContractId._fromProtobuf(proto.ContractID.decode(bytes));
    }

    /**
     * @param {string} address
     * @returns {ContractId}
     */
    static fromSolidityAddress(address) {
        const [shard, realm, contract] = entity_id.fromSolidityAddress(address);
        return new ContractId(shard, realm, contract);
    }

    /**
     * @returns {string}
     */
    toSolidityAddress() {
        return entity_id.toSolidityAddress([this.shard, this.realm, this.num]);
    }

    /**
     * @internal
     * @returns {proto.IContractID}
     */
    _toProtobuf() {
        return {
            contractNum: this.num,
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
        return proto.ContractID.encode(this._toProtobuf()).finish();
    }

    /**
     * @returns {ContractId}
     */
    clone() {
        const id = new ContractId(this);
        id._checksum = this._checksum;
        return id;
    }

    /**
     * @param {ContractId} other
     * @returns {number}
     */
    compare(other) {
        return entity_id.compare(
            [this.shard, this.realm, this.num],
            [other.shard, other.realm, other.num]
        );
    }
}
