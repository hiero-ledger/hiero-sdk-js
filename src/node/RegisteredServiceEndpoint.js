// SPDX-License-Identifier: Apache-2.0

import BlockNodeApi from "./BlockNodeApi.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredServiceEndpoint} IRegisteredServiceEndpoint
 */

/**
 * @typedef {"blockNode" | "mirrorNode" | "rpcRelay" | "generalService"} RegisteredServiceEndpointType
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
            case "generalService":
                return GeneralServiceEndpoint._fromProtobuf(endpoint);
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

        if (endpoint.generalService != null) {
            return "generalService";
        }

        return null;
    }
}

/**
 * @typedef {RegisteredServiceEndpointProps & {
 *   endpointApi?: (BlockNodeApi | number | null),
 *   endpointApis?: ((BlockNodeApi | number)[] | null),
 * }} BlockNodeServiceEndpointProps
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
         * @type {BlockNodeApi[]}
         */
        this._endpointApis = [BlockNodeApi.Other];

        this._setType("blockNode");

        if (props.endpointApis != null) {
            this.setEndpointApis(props.endpointApis);
        } else if (props.endpointApi != null) {
            this.setEndpointApi(props.endpointApi);
        }
    }

    /**
     * @param {Array<BlockNodeApi | number>} endpointApis
     * @returns {this}
     */
    setEndpointApis(endpointApis) {
        this._endpointApis = endpointApis.map((endpointApi) =>
            endpointApi instanceof BlockNodeApi
                ? endpointApi
                : BlockNodeApi._fromCode(endpointApi),
        );
        return this;
    }

    /**
     * Backward-compatible shorthand for replacing the API list with one value.
     *
     * @param {BlockNodeApi | number} endpointApi
     * @returns {this}
     */
    setEndpointApi(endpointApi) {
        return this.setEndpointApis([endpointApi]);
    }

    /**
     * @param {BlockNodeApi | number} endpointApi
     * @returns {this}
     */
    addEndpointApi(endpointApi) {
        this._endpointApis.push(
            endpointApi instanceof BlockNodeApi
                ? endpointApi
                : BlockNodeApi._fromCode(endpointApi),
        );
        return this;
    }

    /**
     * @returns {BlockNodeApi[]}
     */
    get endpointApis() {
        return this._endpointApis;
    }

    /**
     * Backward-compatible singular view of the first configured API.
     *
     * @returns {?BlockNodeApi}
     */
    get endpointApi() {
        return this._endpointApis.length > 0 ? this._endpointApis[0] : null;
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
            endpointApis:
                endpoint.blockNode?.endpointApi != null
                    ? Array.isArray(endpoint.blockNode.endpointApi)
                        ? endpoint.blockNode.endpointApi
                        : [endpoint.blockNode.endpointApi]
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
                endpointApi: this._endpointApis.map((endpointApi) =>
                    endpointApi.valueOf(),
                ),
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

/**
 * @typedef {RegisteredServiceEndpointProps & { description?: (string | null) }} GeneralServiceEndpointProps
 */

/**
 * A registered service endpoint for a general-purpose service.
 */
export class GeneralServiceEndpoint extends RegisteredServiceEndpoint {
    /**
     * @param {GeneralServiceEndpointProps} [props]
     */
    constructor(props = {}) {
        super(props);

        /**
         * @private
         * @type {?string}
         */
        this._description =
            props.description != null ? props.description : null;

        this._setType("generalService");
    }

    /**
     * @param {?string} description
     * @returns {this}
     */
    setDescription(description) {
        this._description = description;
        return this;
    }

    /**
     * @returns {?string}
     */
    get description() {
        return this._description;
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {GeneralServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new GeneralServiceEndpoint({
            ipAddress:
                endpoint.ipAddress != null ? endpoint.ipAddress : undefined,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : undefined,
            port: endpoint.port != null ? endpoint.port : undefined,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : undefined,
            description:
                endpoint.generalService?.description != null
                    ? endpoint.generalService.description
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
            generalService: {
                description:
                    this._description != null ? this._description : undefined,
            },
        };
    }
}
