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

const DOMAIN_NAME_MAX_LENGTH = 250;
const GENERAL_SERVICE_DESCRIPTION_MAX_BYTES = 100;
const IPV4_BYTE_LENGTH = 4;
const IPV6_BYTE_LENGTH = 16;
const PORT_MIN = 0;
const PORT_MAX = 65535;

/**
 * @param {string} value
 * @returns {number}
 */
function utf8ByteLength(value) {
    return new TextEncoder().encode(value).length;
}

/**
 * A service endpoint published by a registered node.
 *
 * Abstract base class. Use one of the concrete subclasses
 * (`BlockNodeServiceEndpoint`, `MirrorNodeServiceEndpoint`,
 * `RpcRelayServiceEndpoint`, `GeneralServiceEndpoint`) instead of
 * instantiating this class directly.
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
     * Sets the IP address for this endpoint. Must be exactly 4 bytes (IPv4)
     * or 16 bytes (IPv6) in big-endian order.
     *
     * @param {Uint8Array} ipAddress
     * @returns {this}
     * @throws {TypeError} If ipAddress is null/undefined.
     * @throws {Error} If ipAddress is not 4 or 16 bytes, or if domainName is already set.
     */
    setIpAddress(ipAddress) {
        if (ipAddress == null) {
            throw new TypeError("ipAddress must not be null or undefined.");
        }

        if (
            ipAddress.length !== IPV4_BYTE_LENGTH &&
            ipAddress.length !== IPV6_BYTE_LENGTH
        ) {
            throw new Error(
                `IP address must be 4 bytes (IPv4) or 16 bytes (IPv6); got ${ipAddress.length} bytes.`,
            );
        }

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
     * Sets the fully-qualified domain name for this endpoint.
     *
     * @param {string} domainName
     * @returns {this}
     * @throws {TypeError} If domainName is null/undefined.
     * @throws {Error} If domainName exceeds 250 ASCII characters or if ipAddress is already set.
     */
    setDomainName(domainName) {
        if (domainName == null) {
            throw new TypeError("domainName must not be null or undefined.");
        }

        if (domainName.length > DOMAIN_NAME_MAX_LENGTH) {
            throw new Error(
                `Domain name must be at most ${DOMAIN_NAME_MAX_LENGTH} ASCII characters.`,
            );
        }

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
        if (!Number.isInteger(port) || port < PORT_MIN || port > PORT_MAX) {
            throw new Error(
                `Port must be an integer in the range [${PORT_MIN}, ${PORT_MAX}].`,
            );
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
        if (typeof requiresTls !== "boolean") {
            throw new TypeError("requiresTls must be a boolean.");
        }

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
     * Validates that the endpoint satisfies the proto-required oneOf
     * constraints (must have either an ipAddress or a domainName set).
     * Called by transaction `freezeWith` for each endpoint before send.
     *
     * @internal
     * @returns {void}
     * @throws {Error} If neither ipAddress nor domainName is set.
     */
    _validate() {
        if (this._ipAddress == null && this._domainName == null) {
            throw new Error(
                "RegisteredServiceEndpoint must have either an IP address or a domain name set.",
            );
        }
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
 *   endpointApis?: ?((BlockNodeApi | number)[]),
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
        }
    }

    /**
     * @param {Array<BlockNodeApi | number>} endpointApis
     * @returns {this}
     */
    setEndpointApis(endpointApis) {
        if (endpointApis == null) {
            throw new TypeError("endpointApis must not be null or undefined.");
        }

        this._endpointApis = endpointApis.map((endpointApi) =>
            endpointApi instanceof BlockNodeApi
                ? endpointApi
                : BlockNodeApi._fromCode(endpointApi),
        );
        return this;
    }

    /**
     * @param {BlockNodeApi | number} endpointApi
     * @returns {this}
     */
    addEndpointApi(endpointApi) {
        if (endpointApi == null) {
            throw new TypeError("endpointApi must not be null or undefined.");
        }

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
        return [...this._endpointApis];
    }

    /**
     * @internal
     * @param {IRegisteredServiceEndpoint} endpoint
     * @returns {BlockNodeServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new BlockNodeServiceEndpoint({
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
            endpointApis:
                endpoint.blockNode?.endpointApi != null
                    ? endpoint.blockNode.endpointApi
                    : null,
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
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
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
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
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
 * @typedef {RegisteredServiceEndpointProps & { description?: ?string }} GeneralServiceEndpointProps
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
        this._description = null;

        this._setType("generalService");

        if (props.description != null) {
            this.setDescription(props.description);
        }
    }

    /**
     * Sets the description. Pass `null` to clear it.
     *
     * @param {?string} description
     * @returns {this}
     * @throws {Error} If description exceeds 100 UTF-8 bytes.
     */
    setDescription(description) {
        if (description == null) {
            this._description = null;
            return this;
        }

        if (
            utf8ByteLength(description) > GENERAL_SERVICE_DESCRIPTION_MAX_BYTES
        ) {
            throw new Error(
                `Description must be at most ${GENERAL_SERVICE_DESCRIPTION_MAX_BYTES} bytes when encoded as UTF-8.`,
            );
        }

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
            ipAddress: endpoint.ipAddress != null ? endpoint.ipAddress : null,
            domainName:
                endpoint.domainName != null ? endpoint.domainName : null,
            port: endpoint.port != null ? endpoint.port : null,
            requiresTls:
                endpoint.requiresTls != null ? endpoint.requiresTls : null,
            description:
                endpoint.generalService?.description != null
                    ? endpoint.generalService.description
                    : null,
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
                    this._description != null ? this._description : null,
            },
        };
    }
}
