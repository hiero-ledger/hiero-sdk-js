// SPDX-License-Identifier: Apache-2.0

import Query from "../query/Query.js";
import NodeAddressBook from "../address_book/NodeAddressBook.js";
import FileId from "../file/FileId.js";
import NodeAddress from "../address_book/NodeAddress.js";
import { isRetryableNetworkError, readErrorDetail } from "./mirrorRestRetry.js";
import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
} from "../constants/ClientConstants.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
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
 * @property {?{next: ?string}} links - Links object containing pagination information
 */

/**
 * Default page size limit for optimal pagination performance
 * @constant {number}
 */
const DEFAULT_PAGE_SIZE = 25;

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
     * @param {number} [props.limit] - Page size limit (defaults to 25 for optimal performance)
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
        return new Promise((resolve, reject) => {
            // `_makeFetchRequest` is async: a throw outside its retry loop
            // rejects its own promise, so forward that or `execute()` never settles.
            this._makeFetchRequest(
                client,
                resolve,
                reject,
                requestTimeout,
            ).catch(reject);
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
        // This class overrides `execute()`, so `Executable._setupExecution`
        // never runs and the client logger has to be picked up here.
        this._logger = this._logger ?? client._logger;

        const mirrorNode = client._mirrorNetwork.getNextMirrorNode();
        if (mirrorNode == null) {
            reject(
                new Error(
                    "Client has no mirror network configured or no healthy mirror nodes are available",
                ),
            );
            return;
        }
        const { port, address } = mirrorNode.address;

        let baseUrl = `${
            address.includes("127.0.0.1") || address.includes("localhost")
                ? "http"
                : "https"
        }://${address}`;

        if (port) {
            baseUrl = `${baseUrl}:${port}`;
        }

        // Initialize aggregated results
        this._addresses = [];
        let nextUrl = null;
        let isLastPage = false;

        // Build initial URL
        const initialUrl = new URL(`${baseUrl}/api/v1/network/nodes`);
        if (this._fileId != null) {
            initialUrl.searchParams.append("file.id", this._fileId.toString());
        }

        // Use the specified limit, or default to DEFAULT_PAGE_SIZE for optimal pagination performance
        const effectiveLimit =
            this._limit != null ? this._limit : DEFAULT_PAGE_SIZE;
        initialUrl.searchParams.append("limit", effectiveLimit.toString());
        const maxAttempts = this._maxAttempts ?? client.maxAttempts;
        const maxBackoff = this._maxBackoff ?? client.maxBackoff;
        // Fetch all pages
        while (!isLastPage) {
            const currentUrl = nextUrl ? new URL(nextUrl, baseUrl) : initialUrl;

            for (let attempt = 0; attempt <= maxAttempts; attempt++) {
                try {
                    // eslint-disable-next-line n/no-unsupported-features/node-builtins
                    const response = await fetch(currentUrl.toString(), {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: requestTimeout
                            ? AbortSignal.timeout(requestTimeout)
                            : undefined,
                    });

                    if (!response.ok) {
                        // `HTTP <status>` is the shape `isRetryableNetworkError`
                        // classifies on: 5xx retries, everything else is terminal.
                        const detail = await readErrorDetail(response);
                        throw new Error(
                            `HTTP ${response.status}${
                                detail ? `: ${detail}` : ""
                            }`,
                        );
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const data = /** @type {AddressBookQueryWebResponse} */ (
                        await response.json()
                    );

                    const nodes = data.nodes || [];

                    // Aggregate nodes from this page
                    const pageNodes = nodes.map((node) =>
                        NodeAddress.fromJSON({
                            nodeId: node.node_id.toString(),
                            accountId: node.node_account_id,
                            addresses:
                                this._handleAddressesFromGrpcProxyEndpoint(
                                    node,
                                    client,
                                ),
                            certHash: node.node_cert_hash,
                            publicKey: node.public_key,
                            description: node.description,
                            stake: node.stake?.toString(),
                        }),
                    );

                    this._addresses.push(...pageNodes);
                    nextUrl = data.links?.next || null;

                    // If no more pages, set flag to exit loop
                    if (!nextUrl) {
                        isLastPage = true;
                    }

                    // Move to next page
                    break;
                } catch (error) {
                    const message =
                        error instanceof Error ? error.message : String(error);

                    // Retry only transient failures: 5xx, timeouts and
                    // transport errors. A 4xx or a malformed body is terminal.
                    if (
                        attempt < maxAttempts &&
                        !client.isClientShutDown &&
                        isRetryableNetworkError(error)
                    ) {
                        const delay = Math.min(250 * 2 ** attempt, maxBackoff);

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
                        await new Promise((resolve) =>
                            setTimeout(resolve, delay),
                        );
                        continue;
                    }

                    // If we shouldn't retry or have exhausted attempts, reject
                    const maxAttemptsReached = attempt >= maxAttempts;
                    const errorMessage = maxAttemptsReached
                        ? `Failed to query address book after ${
                              maxAttempts + 1
                          } attempts. Last error: ${message}`
                        : `Failed to query address book: ${message}`;
                    reject(new Error(errorMessage));
                    return;
                }
            }
        }

        // Return the aggregated results
        const addressBook = new NodeAddressBook({
            nodeAddresses: this._addresses,
        });
        resolve(addressBook);
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
