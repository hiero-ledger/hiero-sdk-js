// SPDX-License-Identifier: Apache-2.0

import BlockNodeApi from "./BlockNodeApi.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredServiceEndpoint} IRegisteredServiceEndpoint
 */

/**
 * @typedef {"blockNode" | "mirrorNode" | "rpcRelay"} RegisteredServiceEndpointType
 */

/**
 * @typedef {object} RegisteredServiceEndpointProps
 * @property {?Uint8Array} [ipAddress]
 * @property {?string} [domainName]
 * @property {?number} [port]
 * @property {?boolean} [requiresTls]
 */

/**
 * A service endpoint published by a registered node.
 */
export default class RegisteredServiceEndpoint {
    /**
     * @param {RegisteredServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {?Uint8Array}
         */
        this._ipAddress = null;

        /**
         * @protected
         * @type {?string}
         */
        this._domainName = null;

        /**
         * @protected
         * @type {number}
         */
        this._port = 0;

        /**
         * @protected
         * @type {boolean}
         */
        this._requiresTls = false;

        /**
         * @protected
         * @type {?RegisteredServiceEndpointType}
         */
        this._type = null;

        if (props.ipAddress != null) {
            this.setIpAddress(props.ipAddress);
        }

        if (props.domainName != null) {
            this.setDomainName(props.domainName);
        }

        if (props.port != null) {
            this.setPort(props.port);
        }

        if (props.requiresTls != null) {
            this.setRequiresTls(props.requiresTls);
        }
    }

    /**
     * @returns {RegisteredServiceEndpointType}
     */
    get type() {
        if (this._type == null) {
            throw new Error(
                "RegisteredServiceEndpoint type is not set; use a concrete endpoint subtype.",
            );
        }

        return this._type;
    }

    /**
     * @protected
     * @param {RegisteredServiceEndpointType} type
     * @returns {void}
     */
    _setType(type) {
        this._type = type;
    }

    /**
     * @param {Uint8Array} ipAddress
     * @returns {this}
     */
    setIpAddress(ipAddress) {
        if (this._domainName != null) {
            throw new Error(
                "Cannot set IP address when domain name is already set.",
            );
        }

        this._ipAddress = ipAddress;
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get ipAddress() {
        return this._ipAddress;
    }

    /**
     * @param {string} domainName
     * @returns {this}
     */
    setDomainName(domainName) {
        if (this._ipAddress != null) {
            throw new Error(
                "Cannot set domain name when IP address is already set.",
            );
        }

        this._domainName = domainName;
        return this;
    }

    /**
     * @returns {?string}
     */
    get domainName() {
        return this._domainName;
    }

    /**
     * @param {number} port
     * @returns {this}
     */
    setPort(port) {
        if (!Number.isInteger(port) || port < 0 || port > 65535) {
            throw new Error("Port must be an integer in the range [0, 65535].");
        }

        this._port = port;
        return this;
    }

    /**
     * @returns {number}
     */
    get port() {
        return this._port;
    }

    /**
     * @param {boolean} requiresTls
     * @returns {this}
     */
    setRequiresTls(requiresTls) {
        this._requiresTls = requiresTls;
        return this;
    }

    /**
     * @returns {boolean}
     */
    get requiresTls() {
        return this._requiresTls;
    }

    /**
     * @internal
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobufBase() {
        return {
            ipAddress: this._ipAddress,
            domainName: this._domainName,
            port: this._port,
            requiresTls: this._requiresTls,
        };
    }

    /**
     * @internal
     * @abstract
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobuf() {
        throw new Error("not implemented");
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {RegisteredServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        const endpointType =
            RegisteredServiceEndpoint._getEndpointType(endpoint);

        switch (endpointType) {
            case "blockNode":
                return BlockNodeServiceEndpoint._fromProtobuf(endpoint);
            case "mirrorNode":
                return MirrorNodeServiceEndpoint._fromProtobuf(endpoint);
            case "rpcRelay":
                return RpcRelayServiceEndpoint._fromProtobuf(endpoint);
            default:
                throw new Error(
                    "Unable to decode registered service endpoint: endpoint type is missing.",
                );
        }
    }

    /**
     * @private
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {RegisteredServiceEndpointType | null}
     */
    static _getEndpointType(endpoint) {
        const endpointWithOneOf =
            /** @type {{ endpointType?: RegisteredServiceEndpointType }} */ (
                endpoint
            );

        if (endpointWithOneOf.endpointType != null) {
            return endpointWithOneOf.endpointType;
        }

        if (endpoint.blockNode != null) {
            return "blockNode";
        }

        if (endpoint.mirrorNode != null) {
            return "mirrorNode";
        }

        if (endpoint.rpcRelay != null) {
            return "rpcRelay";
        }

        return null;
    }
}

/**
 * @typedef {RegisteredServiceEndpointProps & { endpointApi?: (BlockNodeApi | number | null) }} BlockNodeServiceEndpointProps
 */

/**
 * A registered service endpoint for a block node.
 */
export class BlockNodeServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {BlockNodeServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);

        /**
         * @private
         * @type {BlockNodeApi}
         */
        this._endpointApi = BlockNodeApi.Other;

        this._setType("blockNode");

        if (props.endpointApi != null) {
            this.setEndpointApi(props.endpointApi);
        }
    }

    /**
     * @param {BlockNodeApi | number} endpointApi
     * @returns {this}
     */
    setEndpointApi(endpointApi) {
        this._endpointApi =
            endpointApi instanceof BlockNodeApi
                ? endpointApi
                : BlockNodeApi._fromCode(endpointApi);
        return this;
    }

    /**
     * @returns {BlockNodeApi}
     */
    get endpointApi() {
        return this._endpointApi;
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {BlockNodeServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new BlockNodeServiceEndpoint({
            ipAddress:
                endpoint.ipAddress != null ? endpoint.ipAddress : undefined,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : undefined,
            port: endpoint.port != null ? endpoint.port : undefined,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : undefined,
            endpointApi:
                endpoint.blockNode?.endpointApi != null
                    ? endpoint.blockNode.endpointApi
                    : undefined,
        });
    }

    /**
     * @internal
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobuf() {
        return {
            ...this._toProtobufBase(),
            blockNode: {
                endpointApi: this._endpointApi.valueOf(),
            },
        };
    }
}

/**
 * A registered service endpoint for a mirror node.
 */
export class MirrorNodeServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {RegisteredServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);
        this._setType("mirrorNode");
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {MirrorNodeServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new MirrorNodeServiceEndpoint({
            ipAddress:
                endpoint.ipAddress != null ? endpoint.ipAddress : undefined,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : undefined,
            port: endpoint.port != null ? endpoint.port : undefined,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : undefined,
        });
    }

    /**
     * @internal
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobuf() {
        return {
            ...this._toProtobufBase(),
            mirrorNode: {},
        };
    }
}

/**
 * A registered service endpoint for an RPC relay.
 */
export class RpcRelayServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {RegisteredServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);
        this._setType("rpcRelay");
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {RpcRelayServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new RpcRelayServiceEndpoint({
            ipAddress:
                endpoint.ipAddress != null ? endpoint.ipAddress : undefined,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : undefined,
            port: endpoint.port != null ? endpoint.port : undefined,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : undefined,
        });
    }

    /**
     * @internal
     * @returns {IRegisteredServiceEndpoint}
     */
    _toProtobuf() {
        return {
            ...this._toProtobufBase(),
            rpcRelay: {},
        };
    }
}
