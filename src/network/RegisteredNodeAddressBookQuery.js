// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import { RST_STREAM } from "../Executable.js";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";
import Query from "../query/Query.js";
import BlockNodeApi from "../node/BlockNodeApi.js";
import BlockNodeServiceEndpoint from "../node/BlockNodeServiceEndpoint.js";
import GeneralServiceEndpoint from "../node/GeneralServiceEndpoint.js";
import MirrorNodeServiceEndpoint from "../node/MirrorNodeServiceEndpoint.js";
import RegisteredNode from "../node/RegisteredNode.js";
import RegisteredNodeAddressBook from "../node/RegisteredNodeAddressBook.js";
import RpcRelayServiceEndpoint from "../node/RpcRelayServiceEndpoint.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../channel/MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * @template {Channel} ChannelT
 * @typedef {import("../client/Client.js").default<ChannelT, MirrorChannel>} Client
 */

/**
 * @typedef {object} MirrorNodeKeyResponse
 * @property {string} key
 * @property {string} _type
 */

/**
 * @typedef {object} RegisteredBlockNodeEndpointResponse
 * @property {string[]} [endpoint_apis]
 */

/**
 * @typedef {object} RegisteredGeneralServiceEndpointResponse
 * @property {?string} [description]
 */

/**
 * @typedef {object} RegisteredServiceEndpointResponse
 * @property {?RegisteredBlockNodeEndpointResponse} [block_node]
 * @property {?string} [domain_name]
 * @property {?RegisteredGeneralServiceEndpointResponse} [general_service]
 * @property {?string} [ip_address]
 * @property {?Record<string, never>} [mirror_node]
 * @property {number} port
 * @property {boolean} requires_tls
 * @property {?Record<string, never>} [rpc_relay]
 * @property {?string} [type]
 */

/**
 * @typedef {object} RegisteredNodeResponse
 * @property {MirrorNodeKeyResponse} admin_key
 * @property {?string} [created_timestamp]
 * @property {?string} [description]
 * @property {number | string | Long} registered_node_id
 * @property {RegisteredServiceEndpointResponse[]} service_endpoints
 * @property {{from: string, to: ?string}} timestamp
 */

/**
 * @typedef {object} RegisteredNodeAddressBookQueryResponse
 * @property {RegisteredNodeResponse[]} registered_nodes
 * @property {?{next: ?string}} links
 */

/**
 * Default page size limit for optimal pagination performance.
 * @constant {number}
 */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Fetch-based mirror-node query for registered nodes.
 *
 * The SDK-facing design kept this as `RegisteredNodeAddressBookQuery`. The
 * concrete transport was intentionally left open until the mirror node exposed
 * `/api/v1/network/registered-nodes`; now that endpoint exists on the Java REST
 * API, the SDK can use a shared fetch implementation for both Node and browser
 * environments.
 *
 * @augments {Query<RegisteredNodeAddressBook>}
 */
export default class RegisteredNodeAddressBookQuery extends Query {
    /**
     * @param {object} [props]
     * @param {number} [props.limit]
     */
    constructor(props = {}) {
        super();

        /**
         * Page limit for the query.
         * @private
         * @type {?number}
         */
        this._limit = null;

        if (props.limit != null) {
            this.setLimit(props.limit);
        }

        /**
         * @private
         * @type {(error: MirrorError | Error | null) => boolean}
         */
        this._retryHandler = (error) => {
            if (error != null) {
                if (error instanceof Error) {
                    return true;
                }

                switch (error.code) {
                    case 13:
                        return RST_STREAM.test(error.details.toString());
                    case 5:
                    case 8:
                    case 14:
                    case 17:
                        return true;
                    default:
                        return false;
                }
            }

            return false;
        };

        /**
         * @private
         * @type {RegisteredNode[]}
         */
        this._registeredNodes = [];
    }

    /**
     * @returns {?number}
     */
    get limit() {
        return this._limit;
    }

    /**
     * @param {number} limit
     * @returns {this}
     */
    setLimit(limit) {
        this._limit = limit;
        return this;
    }

    /**
     * @param {number} attempts
     * @returns {this}
     */
    setMaxAttempts(attempts) {
        this._maxAttempts = attempts;
        return this;
    }

    /**
     * @param {number} backoff
     * @returns {this}
     */
    setMaxBackoff(backoff) {
        this._maxBackoff = backoff;
        return this;
    }

    /**
     * @param {Client<Channel>} client
     * @param {number=} requestTimeout
     * @returns {Promise<RegisteredNodeAddressBook>}
     */
    execute(client, requestTimeout) {
        return new Promise((resolve, reject) => {
            void this._makeFetchRequest(
                client,
                resolve,
                reject,
                requestTimeout,
            );
        });
    }

    /**
     * @private
     * @param {Client<Channel>} client
     * @param {(value: RegisteredNodeAddressBook) => void} resolve
     * @param {(error: Error) => void} reject
     * @param {number=} requestTimeout
     * @returns {Promise<void>}
     */
    async _makeFetchRequest(client, resolve, reject, requestTimeout) {
        const baseUrl = client.mirrorRestJavaApiBaseUrl;

        this._registeredNodes = [];
        let nextUrl = null;
        let isLastPage = false;

        const initialUrl = new URL(`${baseUrl}/network/registered-nodes`);
        const effectiveLimit =
            this._limit != null ? this._limit : DEFAULT_PAGE_SIZE;
        initialUrl.searchParams.append("limit", effectiveLimit.toString());

        const maxAttempts = this._maxAttempts ?? client.maxAttempts;

        while (!isLastPage) {
            const currentUrl = nextUrl ? new URL(nextUrl, baseUrl) : initialUrl;

            for (let attempt = 0; attempt <= maxAttempts; attempt++) {
                try {
                    // eslint-disable-next-line n/no-unsupported-features/node-builtins
                    const response = await fetch(currentUrl.toString(), {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: requestTimeout
                            ? AbortSignal.timeout(requestTimeout)
                            : undefined,
                    });

                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`,
                        );
                    }

                    const responseJson = /** @type {unknown} */ (
                        await response.json()
                    );
                    const data =
                        /** @type {RegisteredNodeAddressBookQueryResponse} */ (
                            responseJson
                        );

                    /** @type {RegisteredNode[]} */
                    const registeredNodes = [];

                    if (data.registered_nodes != null) {
                        for (const registeredNode of data.registered_nodes) {
                            registeredNodes.push(
                                RegisteredNodeAddressBookQuery._registeredNodeFromResponse(
                                    registeredNode,
                                ),
                            );
                        }
                    }

                    this._registeredNodes.push(...registeredNodes);
                    nextUrl = data.links?.next ?? null;

                    if (nextUrl == null) {
                        isLastPage = true;
                    }

                    break;
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : String(error);

                    if (
                        attempt < maxAttempts &&
                        !client.isClientShutDown &&
                        this._retryHandler(
                            /** @type {MirrorError | Error | null} */ (error),
                        )
                    ) {
                        const delay = Math.min(
                            250 * 2 ** attempt,
                            this._maxBackoff,
                        );

                        if (this._logger) {
                            this._logger.debug(
                                `Error getting registered nodes from mirror node during attempt ${
                                    attempt + 1
                                }. Waiting ${delay} ms before next attempt: ${message}`,
                            );
                        }

                        // eslint-disable-next-line ie11/no-loop-func
                        await new Promise((resolveDelay) =>
                            setTimeout(resolveDelay, delay),
                        );
                        continue;
                    }

                    const maxAttemptsReached = attempt >= maxAttempts;
                    const errorMessage = maxAttemptsReached
                        ? `Failed to query registered nodes after ${
                              maxAttempts + 1
                          } attempts. Last error: ${message}`
                        : `Failed to query registered nodes: ${message}`;
                    reject(new Error(errorMessage));
                    return;
                }
            }
        }

        resolve(
            new RegisteredNodeAddressBook({
                registeredNodes: this._registeredNodes,
            }),
        );
    }

    /**
     * @private
     * @param {RegisteredNodeResponse} registeredNode
     * @returns {RegisteredNode}
     */
    static _registeredNodeFromResponse(registeredNode) {
        return new RegisteredNode({
            registeredNodeId: Long.fromString(
                registeredNode.registered_node_id.toString(),
            ),
            adminKey: RegisteredNodeAddressBookQuery._keyFromResponse(
                registeredNode.admin_key,
            ),
            description:
                registeredNode.description != null
                    ? registeredNode.description
                    : null,
            serviceEndpoints: registeredNode.service_endpoints.map((endpoint) =>
                RegisteredNodeAddressBookQuery._serviceEndpointFromResponse(
                    endpoint,
                ),
            ),
        });
    }

    /**
     * @private
     * @param {MirrorNodeKeyResponse} key
     * @returns {Key}
     */
    static _keyFromResponse(key) {
        const keyType = normalizeEnumName(key._type);

        switch (keyType) {
            case "ED25519":
                return PublicKey.fromStringED25519(key.key);
            case "ECDSASECP256K1":
                return PublicKey.fromStringECDSA(key.key);
            case "PROTOBUFENCODED": {
                const protobufKey = HieroProto.proto.Key.decode(
                    hexToBytes(key.key),
                );
                const decodedKey = Key._fromProtobufKey(protobufKey);

                if (decodedKey == null) {
                    throw new Error(
                        "Mirror node returned a protobuf-encoded admin key that could not be decoded.",
                    );
                }

                return decodedKey;
            }
            default:
                throw new Error(
                    `Unsupported registered node admin key type: ${key._type}`,
                );
        }
    }

    /**
     * @private
     * @param {RegisteredServiceEndpointResponse} endpoint
     * @returns {import("../node/RegisteredServiceEndpoint.js").default}
     */
    static _serviceEndpointFromResponse(endpoint) {
        const endpointType =
            RegisteredNodeAddressBookQuery._endpointTypeFromResponse(endpoint);

        switch (endpointType) {
            case "BLOCKNODE": {
                const blockNodeEndpoint =
                    new BlockNodeServiceEndpoint().setEndpointApis(
                        endpoint.block_node?.endpoint_apis != null
                            ? endpoint.block_node.endpoint_apis.map((api) =>
                                  RegisteredNodeAddressBookQuery._blockNodeApiFromResponse(
                                      api,
                                  ),
                              )
                            : [],
                    );

                RegisteredNodeAddressBookQuery._applyCommonEndpointFields(
                    blockNodeEndpoint,
                    endpoint,
                );
                return blockNodeEndpoint;
            }
            case "MIRRORNODE": {
                const mirrorNodeEndpoint = new MirrorNodeServiceEndpoint();
                RegisteredNodeAddressBookQuery._applyCommonEndpointFields(
                    mirrorNodeEndpoint,
                    endpoint,
                );
                return mirrorNodeEndpoint;
            }
            case "RPCRELAY": {
                const rpcRelayEndpoint = new RpcRelayServiceEndpoint();
                RegisteredNodeAddressBookQuery._applyCommonEndpointFields(
                    rpcRelayEndpoint,
                    endpoint,
                );
                return rpcRelayEndpoint;
            }
            case "GENERALSERVICE": {
                const generalServiceEndpoint = new GeneralServiceEndpoint();
                RegisteredNodeAddressBookQuery._applyCommonEndpointFields(
                    generalServiceEndpoint,
                    endpoint,
                );
                generalServiceEndpoint.setDescription(
                    endpoint.general_service?.description != null
                        ? endpoint.general_service.description
                        : null,
                );
                return generalServiceEndpoint;
            }
            default:
                throw new Error(
                    `Unsupported registered service endpoint type: ${String(
                        endpoint.type ?? "UNKNOWN",
                    )}`,
                );
        }
    }

    /**
     * @private
     * @param {string} endpointApi
     * @returns {BlockNodeApi}
     */
    static _blockNodeApiFromResponse(endpointApi) {
        switch (normalizeEnumName(endpointApi)) {
            case "OTHER":
                return BlockNodeApi.Other;
            case "STATUS":
                return BlockNodeApi.Status;
            case "PUBLISH":
                return BlockNodeApi.Publish;
            case "SUBSCRIBESTREAM":
                return BlockNodeApi.SubscribeStream;
            case "STATEPROOF":
                return BlockNodeApi.StateProof;
            case "UNRECOGNIZED":
                throw new Error(
                    "Mirror node returned an unrecognized block node API.",
                );
            default:
                throw new Error(
                    `Unsupported block node API returned by mirror node: ${endpointApi}`,
                );
        }
    }

    /**
     * @private
     * @param {RegisteredServiceEndpointResponse} endpoint
     * @returns {string}
     */
    static _endpointTypeFromResponse(endpoint) {
        if (endpoint.type != null) {
            return normalizeEnumName(endpoint.type);
        }

        if (endpoint.block_node != null) {
            return "BLOCKNODE";
        }

        if (endpoint.general_service != null) {
            return "GENERALSERVICE";
        }

        if (endpoint.mirror_node != null) {
            return "MIRRORNODE";
        }

        if (endpoint.rpc_relay != null) {
            return "RPCRELAY";
        }

        throw new Error(
            "Registered service endpoint response did not include a type.",
        );
    }

    /**
     * @private
     * @param {import("../node/RegisteredServiceEndpoint.js").default} serviceEndpoint
     * @param {RegisteredServiceEndpointResponse} endpoint
     * @returns {void}
     */
    static _applyCommonEndpointFields(serviceEndpoint, endpoint) {
        if (endpoint.ip_address != null) {
            serviceEndpoint.setIpAddress(parseIpAddress(endpoint.ip_address));
        } else if (endpoint.domain_name != null) {
            serviceEndpoint.setDomainName(endpoint.domain_name);
        } else {
            throw new Error(
                "Registered service endpoint response did not include an IP address or domain name.",
            );
        }

        serviceEndpoint.setPort(endpoint.port);
        serviceEndpoint.setRequiresTls(endpoint.requires_tls);
    }
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeEnumName(value) {
    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
function hexToBytes(text) {
    const normalized = text.startsWith("0x") ? text.slice(2) : text;

    if (normalized.length % 2 !== 0 || /[^0-9a-fA-F]/.test(normalized)) {
        throw new Error("Mirror node returned an invalid hex-encoded key.");
    }

    const bytes = new Uint8Array(normalized.length / 2);

    for (let i = 0; i < normalized.length; i += 2) {
        bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }

    return bytes;
}

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
