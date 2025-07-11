// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import Endpoint from "./Endpoint.js";
import * as utf8 from "../encoding/utf8.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.INodeAddress} HieroProto.proto.INodeAddress
 */

/**
 * @typedef {import("./Endpoint.js").EndPointJson} EndpointJson
 */

/**
 * @typedef {object} NodeAddressJson
 * @property {string | null} publicKey
 * @property {string | null} nodeId
 * @property {string | null} accountId
 * @property {string | null} certHash
 * @property {EndpointJson[] | null} addresses
 * @property {string | null} description
 * @property {string | null} stake
 */

export default class NodeAddress {
    /**
     * @param {object} props
     * @param {string} [props.publicKey]
     * @param {Long} [props.nodeId]
     * @param {AccountId | string} [props.accountId]
     * @param {Uint8Array} [props.certHash]
     * @param {Endpoint[]} [props.addresses]
     * @param {string} [props.description]
     * @param {Long} [props.stake]
     */
    constructor(props = {}) {
        /**
         * @type {string | null}
         */
        this._publicKey = null;

        if (props.publicKey != null) {
            this.setPublicKey(props.publicKey);
        }

        /**
         * @type {Long |null}
         */
        this._nodeId = null;

        if (props.nodeId != null) {
            this.setNodeId(props.nodeId);
        }

        /**
         * @type {AccountId | null}
         */
        this._accountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        /**
         * @type {Uint8Array | null}
         */
        this._certHash = null;

        if (props.certHash != null) {
            this.setCertHash(props.certHash);
        }

        /**
         * @type {Endpoint[]}
         */
        this._addresses = [];

        if (props.addresses != null) {
            this.setAddresses(props.addresses);
        }

        /**
         * @type {string | null}
         */
        this._description = null;

        if (props.description != null) {
            this.setDescription(props.description);
        }

        /**
         * @type {Long | null}
         */
        this._stake = null;

        if (props.stake != null) {
            this.setStake(props.stake);
        }
    }

    /**
     * @returns {?string}
     */
    get publicKey() {
        return this._publicKey;
    }

    /**
     * @param {string} publicKey
     * @returns {this}
     */
    setPublicKey(publicKey) {
        this._publicKey = publicKey;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get nodeId() {
        return this._nodeId;
    }

    /**
     * @param {Long} nodeId
     * @returns {this}
     */
    setNodeId(nodeId) {
        this._nodeId = nodeId;
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get certHash() {
        return this._certHash;
    }

    /**
     * @param {Uint8Array} certHash
     * @returns {this}
     */
    setCertHash(certHash) {
        this._certHash = certHash;
        return this;
    }

    /**
     * @returns {Endpoint[]}
     */
    get addresses() {
        return this._addresses;
    }

    /**
     * @param {Endpoint[]} addresses
     * @returns {this}
     */
    setAddresses(addresses) {
        this._addresses = addresses;
        return this;
    }

    /**
     * @returns {?string}
     */
    get description() {
        return this._description;
    }

    /**
     * @param {string} description
     * @returns {this}
     */
    setDescription(description) {
        this._description = description;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get stake() {
        return this._stake;
    }

    /**
     * @param {Long} stake
     * @returns {this}
     */
    setStake(stake) {
        this._stake = stake;
        return this;
    }

    /**
     * @internal
     * @param {HieroProto.proto.INodeAddress} nodeAddress
     * @returns {NodeAddress}
     */
    static _fromProtobuf(nodeAddress) {
        return new NodeAddress({
            publicKey:
                nodeAddress.RSA_PubKey != null
                    ? nodeAddress.RSA_PubKey
                    : undefined,
            nodeId: nodeAddress.nodeId != null ? nodeAddress.nodeId : undefined,
            accountId:
                nodeAddress.nodeAccountId != null
                    ? AccountId._fromProtobuf(nodeAddress.nodeAccountId)
                    : undefined,
            certHash:
                nodeAddress.nodeCertHash != null
                    ? nodeAddress.nodeCertHash
                    : undefined,
            addresses:
                nodeAddress.serviceEndpoint != null
                    ? nodeAddress.serviceEndpoint.map((address) =>
                          Endpoint._fromProtobuf(address),
                      )
                    : undefined,
            description:
                nodeAddress.description != null
                    ? nodeAddress.description
                    : undefined,
            stake: nodeAddress.stake != null ? nodeAddress.stake : undefined,
        });
    }

    /**
     * @returns {HieroProto.proto.INodeAddress}
     */
    _toProtobuf() {
        return {
            RSA_PubKey: this._publicKey,
            nodeId: this._nodeId,
            nodeAccountId:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            nodeCertHash: this._certHash,
            serviceEndpoint: this._addresses.map((address) =>
                address._toProtobuf(),
            ),
            description: this._description,
            stake: this._stake,
        };
    }

    /**
     * @param {NodeAddressJson} json
     * @returns {NodeAddress}
     */
    static fromJSON(json) {
        return new NodeAddress({
            publicKey: json.publicKey ?? undefined,
            nodeId:
                json.nodeId != null ? Long.fromString(json.nodeId) : undefined,
            accountId: json.accountId
                ? AccountId.fromString(json.accountId)
                : undefined,
            certHash:
                json.certHash != null ? utf8.encode(json.certHash) : undefined,
            addresses:
                json.addresses != null
                    ? json.addresses.map((address) =>
                          Endpoint.fromJSON(address),
                      )
                    : undefined,
            description: json.description ?? undefined,
            stake: json.stake != null ? Long.fromString(json.stake) : undefined,
        });
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @returns {NodeAddressJson}
     */
    toJSON() {
        return {
            publicKey: this._publicKey,
            nodeId: this._nodeId != null ? this._nodeId.toString() : null,
            accountId:
                this._accountId != null ? this._accountId.toString() : null,
            certHash:
                this._certHash != null ? utf8.decode(this._certHash) : null,
            addresses: this._addresses.map((address) => address.toJSON()),
            description: this._description,
            stake: this._stake != null ? this._stake.toString() : null,
        };
    }
}
