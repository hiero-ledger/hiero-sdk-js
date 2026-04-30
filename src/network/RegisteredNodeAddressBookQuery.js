// SPDX-License-Identifier: Apache-2.0

import RegisteredNode from "../node/RegisteredNode.js";
import RegisteredNodeAddressBook from "../node/RegisteredNodeAddressBook.js";
import { isRetryableNetworkError, readErrorDetail } from "./mirrorRestRetry.js";

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
 * Initial retry backoff in milliseconds for transient mirror errors.
 * @constant {number}
 */
const INITIAL_BACKOFF_MS = 250;

/**
 * Fetch-based mirror-node query for registered nodes.
 *
 * Talks to the mirror node's Java REST API at
 * `/api/v1/network/registered-nodes`. Pure HTTP — no payment, no node
 * rotation, no gRPC streaming — so this class deliberately does not
 * extend `Query`.
 *
 * Parsing of individual JSON entries lives on the model classes
 * (`RegisteredNode._fromJson`, `RegisteredServiceEndpoint._fromJson`).
 * This class just owns paging, retry, and the URL-building.
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
         * Per-instance override for max retry attempts. When `null`, the
         * client's `maxAttempts` is used at fetch time.
         * @private
         * @type {?number}
         */
        this._maxAttempts = null;

        /**
         * Per-instance override for max retry backoff (ms). When `null`, the
         * client's `maxBackoff` is used at fetch time.
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
     * @param {import("../logger/Logger.js").default} logger
     * @returns {this}
     */
    setLogger(logger) {
        this._logger = logger;
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
        // For local environments, use port 8084 instead of 5551 — that is
        // the port for the mirror node Java REST API which exposes the
        // /network/registered-nodes endpoint. Mirrors the precedent in
        // FeeEstimateQuery._buildRequestUrl.
        let baseUrl = client.mirrorRestApiBaseUrl;
        if (baseUrl.includes("127.0.0.1") || baseUrl.includes("localhost")) {
            baseUrl = baseUrl.replace(":5551", ":8084");
        }

        const initialUrl = new URL(`${baseUrl}/network/registered-nodes`);
        const effectiveLimit =
            this._limit != null ? this._limit : DEFAULT_PAGE_SIZE;
        initialUrl.searchParams.append("limit", effectiveLimit.toString());

        const maxAttempts = this._maxAttempts ?? client.maxAttempts;
        const maxBackoff = this._maxBackoff ?? client.maxBackoff;

        /** @type {RegisteredNode[]} */
        const aggregatedNodes = [];
        let nextUrl = null;
        let isLastPage = false;

        while (!isLastPage) {
            const currentUrl = nextUrl ? new URL(nextUrl, baseUrl) : initialUrl;

            try {
                const data = await this._fetchPage(
                    currentUrl,
                    maxAttempts,
                    maxBackoff,
                    requestTimeout,
                );

                if (data.registered_nodes != null) {
                    for (const entry of data.registered_nodes) {
                        aggregatedNodes.push(RegisteredNode._fromJson(entry));
                    }
                }

                nextUrl = data.links?.next ?? null;
                if (nextUrl == null) {
                    isLastPage = true;
                }
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                reject(
                    new Error(`Failed to query registered nodes: ${message}`),
                );
                return;
            }
        }

        resolve(
            new RegisteredNodeAddressBook({
                registeredNodes: aggregatedNodes,
            }),
        );
    }

    /**
     * Fetch a single page with retry on transient failures (5xx, network).
     * Throws immediately on 4xx — those are caller errors, not transient.
     *
     * @private
     * @param {URL} url
     * @param {number} maxAttempts
     * @param {number} maxBackoff
     * @param {number=} requestTimeout
     * @returns {Promise<RegisteredNodeAddressBookQueryResponse>}
     */
    async _fetchPage(url, maxAttempts, maxBackoff, requestTimeout) {
        let lastError = null;
        let backoff = INITIAL_BACKOFF_MS;
        const totalAttempts = maxAttempts + 1;

        for (let attempt = 1; attempt <= totalAttempts; attempt++) {
            try {
                // eslint-disable-next-line n/no-unsupported-features/node-builtins
                const response = await fetch(url.toString(), {
                    method: "GET",
                    cache: "no-store",
                    headers: { Accept: "application/json" },
                    signal: requestTimeout
                        ? AbortSignal.timeout(requestTimeout)
                        : undefined,
                });

                if (response.ok) {
                    const responseJson = /** @type {unknown} */ (
                        await response.json()
                    );
                    return /** @type {RegisteredNodeAddressBookQueryResponse} */ (
                        responseJson
                    );
                }

                const errorDetail = await readErrorDetail(response);

                if (
                    response.status === 500 ||
                    response.status === 503 ||
                    response.status === 504
                ) {
                    lastError = new Error(
                        `HTTP ${response.status}${
                            errorDetail ? `: ${errorDetail}` : ""
                        }`,
                    );
                    if (attempt < totalAttempts) {
                        this._logRetry(attempt, backoff, lastError.message);
                        await sleep(backoff);
                        backoff = Math.min(backoff * 2, maxBackoff);
                        continue;
                    }
                    throw lastError;
                }

                // Any other non-ok (4xx, redirects, etc.) — caller's problem.
                throw new Error(
                    `HTTP ${response.status}${
                        errorDetail ? `: ${errorDetail}` : ""
                    }`,
                );
            } catch (err) {
                lastError = /** @type {Error} */ (err);
                if (attempt < totalAttempts && isRetryableNetworkError(err)) {
                    this._logRetry(attempt, backoff, lastError.message);
                    await sleep(backoff);
                    backoff = Math.min(backoff * 2, maxBackoff);
                    continue;
                }
                throw lastError;
            }
        }

        throw lastError ?? new Error("Failed to fetch registered nodes page");
    }

    /**
     * @private
     * @param {number} attempt
     * @param {number} backoff
     * @param {string} message
     */
    _logRetry(attempt, backoff, message) {
        if (this._logger) {
            this._logger.debug(
                `Error getting registered nodes from mirror node during attempt ${attempt}. Waiting ${backoff} ms before next attempt: ${message}`,
            );
        }
    }
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
