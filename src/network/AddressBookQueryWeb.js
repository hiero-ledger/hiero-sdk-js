// SPDX-License-Identifier: Apache-2.0

import Query from "../query/Query.js";
import NodeAddressBook from "../address_book/NodeAddressBook.js";
import FileId from "../file/FileId.js";
import { RST_STREAM } from "../Executable.js";
import NodeAddress from "../address_book/NodeAddress.js";
import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
} from "../constants/ClientConstants.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../channel/MirrorChannel.js").MirrorError} MirrorError
 */

/**
 * @template {Channel} ChannelT
 * @typedef {import("../client/Client.js").default<ChannelT, MirrorChannel>} Client<ChannelT, MirrorChannel>
 */

/**
 * @typedef {object} EndpointWebResponse
 * @property {string} domain_name
 * @property {string} ip_address_v4
 * @property {number} port
 */

/**
 * @typedef {object} AddressBookQueryWebResponse
 * @property {Array<{
 *   admin_key: {
 *     key: string,
 *     _type: string,
 *   },
 *   decline_reward: boolean,
 *   grpc_proxy_endpoint: EndpointWebResponse,
 *   file_id: string,
 *   memo: string,
 *   public_key: string,
 *   node_id: number,
 *   node_account_id: string,
 *   node_cert_hash: string,
 *   address: string,
 *   service_endpoints: EndpointWebResponse[],
 *   description: string,
 *   stake: number
 * }>} nodes
 */

/**
 * Web-compatible query to get a list of Hedera network node addresses from a mirror node.
 * Uses fetch API instead of gRPC for web environments.
 *
 * This query can be used to retrieve node addresses either from a specific file ID
 * or from the most recent address book if no file ID is specified. The response
 * contains node metadata including IP addresses and ports for both node and mirror
 * node services.
 * @augments {Query<NodeAddressBook>}
 */
export default class AddressBookQueryWeb extends Query {
    /**
     * @param {object} props
     * @param {FileId | string} [props.fileId]
     * @param {number} [props.limit]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?FileId}
         */
        this._fileId = null;
        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }

        /**
         * Page limit for the query
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
                    // Retry on all errors which are not `MirrorError` because they're
                    // likely lower level HTTP errors
                    return true;
                } else {
                    // Retry on `NOT_FOUND`, `RESOURCE_EXHAUSTED`, `UNAVAILABLE`, and conditionally on `INTERNAL`
                    // if the message matches the right regex.
                    switch (error.code) {
                        // INTERNAL
                        // eslint-disable-next-line no-fallthrough
                        case 13:
                            return RST_STREAM.test(error.details.toString());
                        // NOT_FOUND
                        // eslint-disable-next-line no-fallthrough
                        case 5:
                        // RESOURCE_EXHAUSTED
                        // eslint-disable-next-line no-fallthrough
                        case 8:
                        // UNAVAILABLE
                        // eslint-disable-next-line no-fallthrough
                        case 14:
                        case 17:
                            return true;
                        default:
                            return false;
                    }
                }
            }

            return false;
        };

        /** @type {NodeAddress[]} */
        this._addresses = [];
    }

    /**
     * @returns {?FileId}
     */
    get fileId() {
        return this._fileId;
    }

    /**
     * @param {FileId | string} fileId
     * @returns {AddressBookQueryWeb}
     */
    setFileId(fileId) {
        this._fileId =
            typeof fileId === "string"
                ? FileId.fromString(fileId)
                : fileId.clone();

        return this;
    }

    /**
     * Page limit for the query
     * @returns {?number}
     */
    get limit() {
        return this._limit;
    }

    /**
     * Set the page limit for the query
     * @param {number} limit
     * @returns {AddressBookQueryWeb}
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
     * @returns {Promise<NodeAddressBook>}
     */
    execute(client, requestTimeout) {
        // Extra validation when initializing the client with only a mirror network
        if (client._network._network.size === 0 && !client._timer) {
            throw new Error(
                "The client's network update period is required. Please set it using the setNetworkUpdatePeriod method.",
            );
        }

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
     * @param {(value: NodeAddressBook) => void} resolve
     * @param {(error: Error) => void} reject
     * @param {number=} requestTimeout
     */
    async _makeFetchRequest(client, resolve, reject, requestTimeout) {
        const { port, address } =
            client._mirrorNetwork.getNextMirrorNode().address;

        let baseUrl = `${
            address.includes("127.0.0.1") || address.includes("localhost")
                ? "http"
                : "https"
        }://${address}`;

        if (port) {
            baseUrl = `${baseUrl}:${port}`;
        }

        const url = new URL(`${baseUrl}/api/v1/network/nodes`);

        if (this._fileId != null) {
            url.searchParams.append("file.id", this._fileId.toString());
        }
        if (this._limit != null) {
            url.searchParams.append("limit", this._limit.toString());
        }

        for (let attempt = 0; attempt <= this._maxAttempts; attempt++) {
            try {
                // eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(url.toString(), {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                    },
                    signal: requestTimeout
                        ? AbortSignal.timeout(requestTimeout)
                        : undefined,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const data = /** @type {AddressBookQueryWebResponse} */ (
                    await response.json()
                );

                const nodes = data.nodes || [];

                // eslint-disable-next-line ie11/no-loop-func
                this._addresses = nodes.map((node) =>
                    NodeAddress.fromJSON({
                        nodeId: node.node_id.toString(),
                        accountId: node.node_account_id,
                        addresses: this._handleAddressesFromGrpcProxyEndpoint(
                            node,
                            client,
                        ),
                        certHash: node.node_cert_hash,
                        publicKey: node.public_key,
                        description: node.description,
                        stake: node.stake.toString(),
                    }),
                );

                const addressBook = new NodeAddressBook({
                    nodeAddresses: this._addresses,
                });

                resolve(addressBook);
                return;
            } catch (error) {
                console.error("Error in _makeFetchRequest:", error);
                const message =
                    error instanceof Error ? error.message : String(error);

                // Check if we should retry
                if (
                    attempt < this._maxAttempts &&
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
                            `Error getting nodes from mirror for file ${
                                this._fileId != null
                                    ? this._fileId.toString()
                                    : "UNKNOWN"
                            } during attempt ${
                                attempt + 1
                            }. Waiting ${delay} ms before next attempt: ${message}`,
                        );
                    }

                    // Wait before next attempt
                    // eslint-disable-next-line ie11/no-loop-func
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }

                // If we shouldn't retry or have exhausted attempts, reject
                const maxAttemptsReached = attempt >= this._maxAttempts;
                const errorMessage = maxAttemptsReached
                    ? `Failed to query address book after ${
                          this._maxAttempts + 1
                      } attempts. Last error: ${message}`
                    : `Failed to query address book: ${message}`;
                reject(new Error(errorMessage));
                return;
            }
        }

        // This should never be reached, but just in case
        reject(new Error("failed to query address book"));
    }

    /**
     * Handles the grpc_proxy_endpoint fallback logic for a node.
     * @param {AddressBookQueryWebResponse['nodes'][number]} node - The node object from the mirror node response.
     * @param {Client<Channel>} client - The client instance.
     * @returns {Array<{address: string, port: string}>}
     */
    _handleAddressesFromGrpcProxyEndpoint(node, client) {
        const grpcProxyEndpoint = node.grpc_proxy_endpoint;

        if (
            grpcProxyEndpoint &&
            grpcProxyEndpoint.domain_name &&
            grpcProxyEndpoint.port
        ) {
            return [
                {
                    address: grpcProxyEndpoint.domain_name,
                    port: grpcProxyEndpoint.port.toString(),
                },
            ];
        }

        let networkConstant;
        const ledgerId = client._network.ledgerId;

        if (ledgerId && ledgerId.isMainnet()) {
            networkConstant = MAINNET;
        } else if (ledgerId && ledgerId.isTestnet()) {
            networkConstant = WEB_TESTNET;
        } else if (ledgerId && ledgerId.isPreviewnet()) {
            networkConstant = WEB_PREVIEWNET;
        } else {
            return [];
        }

        const nodeAccountId = node.node_account_id;

        for (const [address, accountIdObj] of Object.entries(networkConstant)) {
            if (accountIdObj.toString() === nodeAccountId) {
                const [domain_name, port] = address.split(":");

                return [
                    {
                        address: domain_name,
                        port,
                    },
                ];
            }
        }

        return [];
    }
}
