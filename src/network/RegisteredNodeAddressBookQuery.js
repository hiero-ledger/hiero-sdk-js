// SPDX-License-Identifier: Apache-2.0

import RegisteredNode from "../node/RegisteredNode.js";
import RegisteredNodeAddressBook from "../node/RegisteredNodeAddressBook.js";
import MirrorNodeRestPath from "../mirror_node/MirrorNodeRestPath.js";
import {
    bodyJson,
    statusMessage,
} from "../mirror_node/MirrorNodeHttpClient.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 */

/**
 * @template {Channel} ChannelT
 * @typedef {import("../client/Client.js").default<ChannelT, MirrorChannel>} Client
 */

/**
 * Top-level paging envelope returned by
 * `GET /api/v1/network/registered-nodes`. Per-entry / per-endpoint shapes
 * are documented next to the model classes that own their parsing
 * (`RegisteredNode`, `RegisteredServiceEndpoint`).
 *
 * @typedef {object} RegisteredNodeAddressBookQueryResponse
 * @property {import("../node/RegisteredNode.js").RegisteredNodeJson[]} registered_nodes
 * @property {?{next: ?string}} links
 */

/**
 * Default page size limit for optimal pagination performance.
 * @constant {number}
 */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Mirror-node REST query for registered nodes.
 *
 * Talks to the mirror node's Java REST API at
 * `/api/v1/network/registered-nodes` through the client's shared HTTP
 * transport. Pure HTTP: no payment, no node rotation, no gRPC streaming,
 * so this class deliberately does not extend `Query`.
 *
 * Retry, backoff and timeouts follow the client's `MirrorNodeHttpRetryPolicy`
 * (see `Client.setMirrorNodeHttpConfig`). `setMaxAttempts` and
 * `setMaxBackoff` override only the field they name, for this query.
 *
 * Parsing of individual JSON entries lives on the model classes
 * (`RegisteredNode._fromJson`, `RegisteredServiceEndpoint._fromJson`).
 * This class just owns paging and the path-building.
 */
export default class RegisteredNodeAddressBookQuery {
    /**
     * @param {object} [props]
     * @param {number} [props.limit]
     */
    constructor(props = {}) {
        /**
         * Page limit for the query.
         * @private
         * @type {?number}
         */
        this._limit = null;

        /**
         * Per-instance override of the retry policy's `maxAttempts`. When
         * `null`, the client's policy applies.
         * @private
         * @type {?number}
         */
        this._maxAttempts = null;

        /**
         * Per-instance override of the retry policy's `maxBackoff` (ms).
         * When `null`, the client's policy applies.
         * @private
         * @type {?number}
         */
        this._maxBackoff = null;

        /**
         * Optional logger for retry diagnostics.
         * @private
         * @type {?import("../logger/Logger.js").default}
         */
        this._logger = null;

        if (props.limit != null) {
            this.setLimit(props.limit);
        }
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
     * Total attempts per page (one request plus retries).
     *
     * @param {number} attempts
     * @returns {this}
     */
    setMaxAttempts(attempts) {
        this._maxAttempts = attempts;
        return this;
    }

    /**
     * Cap on the backoff between attempts, in milliseconds.
     *
     * @param {number} backoff
     * @returns {this}
     */
    setMaxBackoff(backoff) {
        this._maxBackoff = backoff;
        return this;
    }

    /**
     * @param {import("../logger/Logger.js").default} logger
     * @returns {this}
     */
    setLogger(logger) {
        this._logger = logger;
        return this;
    }

    /**
     * @param {Client<Channel>} client
     * @param {number=} requestTimeout - total budget for the whole query in
     * milliseconds, every page and every retry included. Defaults to the
     * retry policy's `totalDeadline`, which in turn defaults to
     * `client.requestTimeout`.
     * @returns {Promise<RegisteredNodeAddressBook>}
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
     * @param {(value: RegisteredNodeAddressBook) => void} resolve
     * @param {(error: Error) => void} reject
     * @param {number=} requestTimeout
     * @returns {Promise<void>}
     */
    async _makeFetchRequest(client, resolve, reject, requestTimeout) {
        const http = client._mirrorNodeHttpClient({
            // `/network/registered-nodes` is served by the mirror node's
            // Java REST API, a different port on a local network.
            family: "rest-java",
            maxAttempts: this._maxAttempts,
            maxBackoff: this._maxBackoff,
            totalDeadline: requestTimeout,
            logger: this._logger ?? client._logger,
        });

        const effectiveLimit =
            this._limit != null ? this._limit : DEFAULT_PAGE_SIZE;

        /** @type {RegisteredNode[]} */
        const aggregatedNodes = [];

        /** @type {?MirrorNodeRestPath} */
        let path = MirrorNodeRestPath.of(
            `/network/registered-nodes?limit=${encodeURIComponent(
                effectiveLimit.toString(),
            )}`,
        );

        try {
            while (path != null) {
                const response = await http.get(path);
                if (!response.ok) {
                    throw new Error(statusMessage(response));
                }

                const data =
                    /** @type {RegisteredNodeAddressBookQueryResponse} */ (
                        bodyJson(response)
                    );

                if (data.registered_nodes != null) {
                    for (const entry of data.registered_nodes) {
                        aggregatedNodes.push(RegisteredNode._fromJson(entry));
                    }
                }

                const next = data.links?.next;
                path = next ? MirrorNodeRestPath.fromNextLink(next) : null;
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            reject(new Error(`Failed to query registered nodes: ${message}`));
            return;
        }

        resolve(
            new RegisteredNodeAddressBook({
                registeredNodes: aggregatedNodes,
            }),
        );
    }
}
