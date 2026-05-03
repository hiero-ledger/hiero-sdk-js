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
 * Mirror-node REST shape for the `block_node` discriminator inside an
 * endpoint object.
 *
 * @typedef {object} RegisteredBlockNodeEndpointJson
 * @property {string[]} [endpoint_apis]
 */

/**
 * Mirror-node REST shape for the `general_service` discriminator inside an
 * endpoint object.
 *
 * @typedef {object} RegisteredGeneralServiceEndpointJson
 * @property {?string} [description]
 */

/**
 * Mirror-node REST shape for a single registered service endpoint.
 * Exactly one of `block_node`, `mirror_node`, `rpc_relay`, or
 * `general_service` is populated; alternately the mirror node may set
 * `type` as a discriminant string.
 *
 * @typedef {object} RegisteredServiceEndpointJson
 * @property {?RegisteredBlockNodeEndpointJson} [block_node]
 * @property {?string} [domain_name]
 * @property {?RegisteredGeneralServiceEndpointJson} [general_service]
 * @property {?string} [ip_address]
 * @property {?Record<string, never>} [mirror_node]
 * @property {number} port
 * @property {boolean} requires_tls
 * @property {?Record<string, never>} [rpc_relay]
 * @property {?string} [type]
 */

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
     * Sets the IP address for this endpoint. Per the proto contract this must
     * be 4 bytes (IPv4) or 16 bytes (IPv6) in big-endian order; the consensus
     * node enforces that with `INVALID_REGISTERED_ENDPOINT_ADDRESS`. The SDK
     * does not pre-check the length so the network's status code is what
     * surfaces.
     *
     * @param {Uint8Array} ipAddress
     * @returns {this}
     * @throws {TypeError} If ipAddress is null/undefined.
     * @throws {Error} If domainName is already set (proto `oneof` slot).
     */
    setIpAddress(ipAddress) {
        if (ipAddress == null) {
            throw new TypeError("ipAddress must not be null or undefined.");
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
     * Sets the fully-qualified domain name for this endpoint. Per the proto
     * contract this must be a valid ASCII FQDN of at most 250 chars; the
     * consensus node enforces that with `INVALID_REGISTERED_ENDPOINT_ADDRESS`.
     *
     * @param {string} domainName
     * @returns {this}
     * @throws {TypeError} If domainName is null/undefined.
     * @throws {Error} If ipAddress is already set (proto `oneof` slot).
     */
    setDomainName(domainName) {
        if (domainName == null) {
            throw new TypeError("domainName must not be null or undefined.");
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
     * Sets the port. Per the proto contract this must be in `[0, 65535]`;
     * the consensus node enforces that with `INVALID_REGISTERED_ENDPOINT`.
     *
     * @param {number} port
     * @returns {this}
     */
    setPort(port) {
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
     * Construct an endpoint from a mirror-node REST JSON object,
     * dispatching to the correct subclass based on which discriminator
     * field is populated.
     *
     * @internal
     * @param {RegisteredServiceEndpointJson} json
     * @returns {RegisteredServiceEndpoint}
     */
    static _fromJson(json) {
        const endpointType =
            RegisteredServiceEndpoint._getJsonEndpointType(json);

        switch (endpointType) {
            case "blockNode":
                return BlockNodeServiceEndpoint._fromJson(json);
            case "mirrorNode":
                return MirrorNodeServiceEndpoint._fromJson(json);
            case "rpcRelay":
                return RpcRelayServiceEndpoint._fromJson(json);
            case "generalService":
                return GeneralServiceEndpoint._fromJson(json);
            default:
                throw new Error(
                    "Registered service endpoint response did not include a recognized endpoint type.",
                );
        }
    }

    /**
     * @private
     * @param {RegisteredServiceEndpointJson} json
     * @returns {RegisteredServiceEndpointType | null}
     */
    static _getJsonEndpointType(json) {
        if (json.type != null) {
            const normalized = json.type
                .replace(/[^A-Za-z0-9]/g, "")
                .toUpperCase();
            switch (normalized) {
                case "BLOCKNODE":
                    return "blockNode";
                case "MIRRORNODE":
                    return "mirrorNode";
                case "RPCRELAY":
                    return "rpcRelay";
                case "GENERALSERVICE":
                    return "generalService";
            }
        }

        if (json.block_node != null) return "blockNode";
        if (json.mirror_node != null) return "mirrorNode";
        if (json.rpc_relay != null) return "rpcRelay";
        if (json.general_service != null) return "generalService";

        return null;
    }

    /**
     * Apply the four common JSON fields (ip address, domain name, port,
     * tls) to a freshly-constructed subclass instance. Throws if neither
     * an ip address nor a domain name is present, since either-or is
     * required by the proto contract.
     *
     * @protected
     * @param {RegisteredServiceEndpointJson} json
     * @returns {void}
     */
    _applyJsonBaseFields(json) {
        if (json.ip_address != null) {
            this.setIpAddress(parseIpAddress(json.ip_address));
        } else if (json.domain_name != null) {
            this.setDomainName(json.domain_name);
        } else {
            throw new Error(
                "Registered service endpoint response did not include an IP address or domain name.",
            );
        }

        this.setPort(json.port);
        this.setRequiresTls(json.requires_tls);
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
     * @param {RegisteredServiceEndpointJson} json
     * @returns {BlockNodeServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new BlockNodeServiceEndpoint();
        endpoint._applyJsonBaseFields(json);

        const apis = json.block_node?.endpoint_apis;
        if (apis != null && apis.length > 0) {
            endpoint.setEndpointApis(
                apis.map((api) => BlockNodeApi._fromString(api)),
            );
        }
        return endpoint;
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
     * @param {RegisteredServiceEndpointJson} json
     * @returns {MirrorNodeServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new MirrorNodeServiceEndpoint();
        endpoint._applyJsonBaseFields(json);
        return endpoint;
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
     * @param {RegisteredServiceEndpointJson} json
     * @returns {RpcRelayServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new RpcRelayServiceEndpoint();
        endpoint._applyJsonBaseFields(json);
        return endpoint;
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
     * Sets the description. Pass `null` to clear it. Per the proto contract
     * the description must not exceed 100 bytes when encoded as UTF-8 — the
     * consensus node enforces that.
     *
     * @param {?string} description
     * @returns {this}
     */
    setDescription(description) {
        this._description = description != null ? description : null;
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
     * @param {RegisteredServiceEndpointJson} json
     * @returns {GeneralServiceEndpoint}
     */
    static _fromJson(json) {
        const endpoint = new GeneralServiceEndpoint();
        endpoint._applyJsonBaseFields(json);
        if (json.general_service?.description != null) {
            endpoint.setDescription(json.general_service.description);
        }
        return endpoint;
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

// -----------------------------------------------------------------------------
// IP-address-string parsing helpers — used only by the JSON factories above.
// Mirror node returns IPv4 in dotted-quad form ("127.0.0.1") and IPv6 in
// either bracketed ("[::1]") or unbracketed colon form. We need bytes for the
// proto wire shape and for downstream comparisons.
// -----------------------------------------------------------------------------

/**
 * @param {string} ipAddress
 * @returns {Uint8Array}
 */
function parseIpAddress(ipAddress) {
    return ipAddress.includes(":")
        ? parseIpv6Address(ipAddress)
        : parseIpv4Address(ipAddress);
}

/**
 * @param {string} ipAddress
 * @returns {Uint8Array}
 */
function parseIpv4Address(ipAddress) {
    const octets = ipAddress.split(".");

    if (octets.length !== 4) {
        throw new Error(`Invalid IPv4 address: ${ipAddress}`);
    }

    return Uint8Array.from(
        octets.map((octet) => {
            if (!/^\d+$/.test(octet)) {
                throw new Error(`Invalid IPv4 address: ${ipAddress}`);
            }

            const value = Number(octet);

            if (!Number.isInteger(value) || value < 0 || value > 255) {
                throw new Error(`Invalid IPv4 address: ${ipAddress}`);
            }

            return value;
        }),
    );
}

/**
 * @param {string} ipAddress
 * @returns {Uint8Array}
 */
function parseIpv6Address(ipAddress) {
    const normalizedAddress =
        ipAddress.startsWith("[") && ipAddress.endsWith("]")
            ? ipAddress.slice(1, -1)
            : ipAddress;

    const parts = normalizedAddress.split("::");

    if (parts.length > 2) {
        throw new Error(`Invalid IPv6 address: ${ipAddress}`);
    }

    const left = parseIpv6Groups(parts[0]);
    const right = parts.length === 2 ? parseIpv6Groups(parts[1]) : [];
    const zeroFillSize =
        parts.length === 2 ? 8 - (left.length + right.length) : 0;

    if (
        zeroFillSize < 0 ||
        (parts.length === 1 && left.length !== 8) ||
        (parts.length === 2 && zeroFillSize === 0)
    ) {
        throw new Error(`Invalid IPv6 address: ${ipAddress}`);
    }

    /** @type {number[]} */
    const groups = [...left];

    if (parts.length === 2) {
        for (let i = 0; i < zeroFillSize; i++) {
            groups.push(0);
        }

        groups.push(...right);
    }

    if (groups.length !== 8) {
        throw new Error(`Invalid IPv6 address: ${ipAddress}`);
    }

    const bytes = new Uint8Array(16);

    for (let i = 0; i < groups.length; i++) {
        bytes[i * 2] = (groups[i] >> 8) & 0xff;
        bytes[i * 2 + 1] = groups[i] & 0xff;
    }

    return bytes;
}

/**
 * @param {string} segment
 * @returns {number[]}
 */
function parseIpv6Groups(segment) {
    if (segment === "") {
        return [];
    }

    const groups = [];

    for (const part of segment.split(":")) {
        if (part === "") {
            throw new Error(`Invalid IPv6 address segment: ${segment}`);
        }

        if (part.includes(".")) {
            const ipv4Bytes = parseIpv4Address(part);
            groups.push((ipv4Bytes[0] << 8) | ipv4Bytes[1]);
            groups.push((ipv4Bytes[2] << 8) | ipv4Bytes[3]);
            continue;
        }

        if (!/^[0-9a-fA-F]{1,4}$/.test(part)) {
            throw new Error(`Invalid IPv6 address segment: ${segment}`);
        }

        groups.push(parseInt(part, 16));
    }

    return groups;
}
