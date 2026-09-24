// SPDX-License-Identifier: Apache-2.0

import Query from "../query/Query.js";
import NodeAddressBook from "../address_book/NodeAddressBook.js";
import FileId from "../file/FileId.js";
import NodeAddress from "../address_book/NodeAddress.js";
import MirrorNodeRestPath from "../mirror_node/MirrorNodeRestPath.js";
import {
    bodyJson,
    statusMessage,
} from "../mirror_node/MirrorNodeHttpClient.js";
import { isLoopbackHost } from "../mirror_node/localMirrorRestBaseUrl.js";
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
 * Uses the mirror node REST API (`GET /api/v1/network/nodes`) instead of gRPC
 * for web environments, through the client's shared HTTP transport.
 *
 * This query can be used to retrieve node addresses either from a specific file ID
 * or from the most recent address book if no file ID is specified. The response
 * contains node metadata including IP addresses and ports for both node and mirror
 * node services.
 *
 * Retry, backoff and timeouts follow the client's `MirrorNodeHttpRetryPolicy`
 * (see `Client.setMirrorNodeHttpConfig`). `setMaxAttempts` and
 * `setMaxBackoff` on the query override only the field they name.
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
     * Total attempts per page (one request plus retries), overriding the
     * client's mirror node HTTP retry policy for this query only.
     *
     * @param {number} attempts
     * @returns {this}
     */
    setMaxAttempts(attempts) {
        this._maxAttempts = attempts;
        return this;
    }

    /**
     * Cap on the backoff between attempts in milliseconds, overriding the
     * client's mirror node HTTP retry policy for this query only.
     *
     * @param {number} backoff
     * @returns {this}
     */
    setMaxBackoff(backoff) {
        this._maxBackoff = backoff;
        return this;
    }

    /**
     * @param {Client<Channel>} client
     * @param {number=} requestTimeout - total budget for the whole query in
     * milliseconds, covering every page and every retry, the same meaning
     * `requestTimeout` has on `Executable` and on the mirror node balance
     * queries. Defaults to the retry policy's `totalDeadline`, which in turn
     * defaults to `client.requestTimeout`; `0` or less also selects the
     * default. Independently, one attempt never waits longer than the
     * policy's `perAttemptTimeout` (30 s).
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

        /** @type {import("../MirrorNode.js").default} */
        let mirrorNode;
        try {
            mirrorNode = client._mirrorNetwork.nextMirrorNodeForRest();
        } catch (error) {
            reject(/** @type {Error} */ (error));
            return;
        }

        // This query still derives the base URL from the mirror node's
        // address rather than reading `client.mirrorRestApiBaseUrl`; that
        // second step of its migration lands with the local-port work.
        const { port, address } = mirrorNode.address;
        let baseUrl = `${
            isLoopbackHost(address) ? "http" : "https"
        }://${address}`;
        if (port) {
            baseUrl = `${baseUrl}:${port}`;
        }
        baseUrl = `${baseUrl}/api/v1`;

        const http = client._mirrorNodeHttpClient({
            family: "rest",
            baseUrl,
            maxAttempts: this._maxAttempts,
            maxBackoff: this._maxBackoff,
            totalDeadline: requestTimeout,
            logger: this._logger,
        });

        const params = new URLSearchParams();
        if (this._fileId != null) {
            params.append("file.id", this._fileId.toString());
        }
        // Use the specified limit, or default to DEFAULT_PAGE_SIZE for optimal pagination performance
        const effectiveLimit =
            this._limit != null ? this._limit : DEFAULT_PAGE_SIZE;
        params.append("limit", effectiveLimit.toString());

        this._addresses = [];

        /** @type {?MirrorNodeRestPath} */
        let path = MirrorNodeRestPath.of(`/network/nodes?${params.toString()}`);

        try {
            while (path != null) {
                const response = await http.get(path);
                if (!response.ok) {
                    throw new Error(statusMessage(response));
                }

                const data = /** @type {AddressBookQueryWebResponse} */ (
                    bodyJson(response)
                );
                const nodes = data.nodes || [];

                // Aggregate nodes from this page
                const pageNodes = nodes.map((node) =>
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
                        stake: node.stake?.toString(),
                    }),
                );
                this._addresses.push(...pageNodes);

                const next = data.links?.next;
                path = next ? MirrorNodeRestPath.fromNextLink(next) : null;
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            reject(new Error(`Failed to query address book: ${message}`));
            return;
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
