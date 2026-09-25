// SPDX-License-Identifier: Apache-2.0

import http from "http";
import https from "https";
import zlib from "zlib";
import HttpTransport from "./HttpTransport.js";
import HttpRequest from "./HttpRequest.js";
import HttpResponse from "./HttpResponse.js";
import HttpTransportConfiguration from "./HttpTransportConfiguration.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "./HttpTransportError.js";
import { mapSystemErrorCode } from "./errorCodes.js";
import { noCancellation, abortReason } from "./cancellation.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";

/**
 * @typedef {import("http").ClientRequest} ClientRequest
 * @typedef {import("http").IncomingMessage} IncomingMessage
 */

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * The only request headers that survive a redirect to another origin. Every
 * caller header, `Authorization` included, is dropped on a cross-origin hop.
 */
const CROSS_ORIGIN_SAFE_HEADERS = new Set([
    "accept",
    "content-type",
    "x-user-agent",
]);

/**
 * The Node.js transport, and the SDK default there. It is the full
 * conformance profile: a private keep-alive connection pool that nothing
 * else in the process shares, a connect timeout separate from the read
 * deadline, at most `maxRedirects` redirects with caller headers dropped on
 * a cross-origin hop, a streaming body cap that fails one chunk past
 * `maxResponseBytes`, and a bounded drain on `close`.
 *
 * It uses whatever proxy configuration Node applied to its own global
 * agents at startup (`--use-env-proxy` or `NODE_USE_ENV_PROXY`, Node 24.5 /
 * 22.19 and later, reading `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY`), so
 * it agrees with `http.globalAgent` in every case. A proxy installed on the
 * global `fetch` through `undici.setGlobalDispatcher()` is not seen here; an
 * application using one injects `FetchHttpTransport` instead.
 *
 * Bodies are decoded transparently when a server compresses them; the body
 * cap applies to the decoded bytes, which is what the SDK allocates.
 */
export default class NodeHttpTransport extends HttpTransport {
    /**
     * @param {HttpTransportConfiguration | ConstructorParameters<typeof HttpTransportConfiguration>[0]} [configuration]
     */
    constructor(configuration) {
        super();

        /**
         * @private
         * @type {HttpTransportConfiguration}
         */
        this._configuration = HttpTransportConfiguration.from(configuration);

        /**
         * @private
         * @type {http.Agent}
         */
        this._httpAgent = new http.Agent({
            keepAlive: true,
            ...proxyOptionsOf(http.globalAgent),
        });

        /**
         * @private
         * @type {https.Agent}
         */
        this._httpsAgent = new https.Agent({
            keepAlive: true,
            ...proxyOptionsOf(https.globalAgent),
        });

        /**
         * `close()` was called: no new `roundTrip` starts.
         *
         * @private
         * @type {boolean}
         */
        this._closed = false;

        /**
         * The drain is over: no new exchange starts, not even a redirect
         * hop of a call that was in flight when `close()` was called.
         *
         * @private
         * @type {boolean}
         */
        this._aborted = false;

        /**
         * Calls (`roundTrip` invocations, redirects included) in flight.
         * This is what the close drain waits for.
         *
         * @private
         * @type {number}
         */
        this._calls = 0;

        /**
         * Exchanges in flight, each with the function that fails it with a
         * classified error.
         *
         * @private
         * @type {Map<ClientRequest, (error: HttpTransportError) => void>}
         */
        this._exchanges = new Map();

        /**
         * Resolvers waiting for the in-flight calls to drain.
         *
         * @private
         * @type {Array<() => void>}
         */
        this._drainWaiters = [];
    }

    /**
     * @param {HttpTransportConfiguration | ConstructorParameters<typeof HttpTransportConfiguration>[0]} [configuration]
     * @returns {NodeHttpTransport}
     */
    static create(configuration) {
        return new NodeHttpTransport(configuration);
    }

    /**
     * @returns {HttpTransportConfiguration}
     */
    get configuration() {
        return this._configuration;
    }

    /**
     * @returns {boolean}
     */
    get closed() {
        return this._closed;
    }

    /**
     * Number of calls currently in flight.
     *
     * @returns {number}
     */
    get inFlight() {
        return this._calls;
    }

    /**
     * @override
     * @param {HttpRequest} request
     * @param {AbortSignal} [signal]
     * @returns {Promise<HttpResponse>}
     */
    async roundTrip(request, signal = noCancellation()) {
        if (this._closed) {
            throw new HttpTransportError(
                HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                "the transport is closed",
            );
        }

        const req = HttpRequest.from(request);

        if (signal.aborted) {
            throw new HttpTransportError(
                HttpTransportErrorCode.CANCELLED_ERROR,
                "the call was cancelled before the request was sent",
                { cause: abortReason(signal) },
            );
        }

        const deadlineAt =
            req.deadline != null ? Date.now() + req.deadline : null;

        this._calls += 1;
        try {
            return await this._follow(req, deadlineAt, signal);
        } finally {
            this._calls -= 1;
            if (this._calls === 0) {
                const waiters = this._drainWaiters;
                this._drainWaiters = [];
                for (const waiter of waiters) {
                    waiter();
                }
            }
        }
    }

    /**
     * Perform the exchange and follow its redirects, up to `maxRedirects`.
     *
     * @private
     * @param {HttpRequest} req
     * @param {?number} deadlineAt
     * @param {AbortSignal} signal
     * @returns {Promise<HttpResponse>}
     */
    async _follow(req, deadlineAt, signal) {
        let url = req.url;
        let method = req.method;
        let headers = this._headersFor(req);
        let body = req.body;

        for (let hop = 0; ; hop++) {
            // A call that was in flight when `close()` was called may keep
            // following redirects for as long as the drain lasts, and no
            // longer.
            if (this._aborted) {
                throw new HttpTransportError(
                    HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                    "the transport was closed while the request was in flight",
                );
            }

            const response = await this._exchange(
                url,
                method,
                headers,
                body,
                deadlineAt,
                req.deadline,
                signal,
            );

            // Past the redirect bound the 3xx is returned as received: a
            // non-2xx status is a successful exchange, and the layer above
            // treats a 3xx as terminal.
            if (
                !REDIRECT_STATUSES.has(response.statusCode) ||
                hop >= this._configuration.maxRedirects
            ) {
                return response;
            }

            const location = response.header("location");
            if (location == null) {
                return response;
            }

            /** @type {URL} */
            let next;
            try {
                next = new URL(location, url);
            } catch {
                return response;
            }
            if (next.protocol !== "http:" && next.protocol !== "https:") {
                return response;
            }

            if (new URL(url).origin !== next.origin) {
                headers = stripForCrossOrigin(headers);
            }

            if (
                response.statusCode === 303 ||
                ((response.statusCode === 301 || response.statusCode === 302) &&
                    method === "POST")
            ) {
                method = "GET";
                body = null;
                delete headers["content-type"];
            }

            url = next.toString();
        }
    }

    /**
     * Stop accepting new work, wait up to `closeTimeout` milliseconds for
     * calls in flight (redirects included), then destroy whatever remains
     * together with the connection pool. Idempotent; never rejects.
     *
     * @override
     * @param {number} [closeTimeout]
     * @returns {Promise<void>}
     */
    async close(closeTimeout = 0) {
        if (this._closed) {
            return;
        }
        this._closed = true;

        if (this._calls > 0 && closeTimeout > 0) {
            /** @type {ReturnType<typeof setTimeout> | null} */
            let timer = null;
            await Promise.race([
                new Promise((resolve) => {
                    this._drainWaiters.push(() => resolve(undefined));
                }),
                new Promise((resolve) => {
                    timer = setTimeout(() => resolve(undefined), closeTimeout);
                    // Neither the drain nor the timer may keep the process
                    // alive: `Client.close()` does not await this.
                    timer.unref();
                }),
            ]);
            if (timer != null) {
                clearTimeout(timer);
            }
        }

        this._aborted = true;
        for (const fail of [...this._exchanges.values()]) {
            fail(
                new HttpTransportError(
                    HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                    "the transport was closed while the request was in flight",
                ),
            );
        }

        this._httpAgent.destroy();
        this._httpsAgent.destroy();
    }

    /**
     * Header precedence, later winning: the transport's `defaultHeaders`,
     * then the request's headers, then its `contentType`, then the SDK
     * identity header, which nothing may override.
     *
     * @private
     * @param {HttpRequest} request
     * @returns {Record<string, string>}
     */
    _headersFor(request) {
        /** @type {Record<string, string>} */
        const headers = {
            ...this._configuration.defaultHeaders,
            ...request.headers,
        };
        if (request.contentType != null) {
            headers["content-type"] = request.contentType;
        }
        delete headers["user-agent"];
        headers["x-user-agent"] = `${SDK_NAME}/${SDK_VERSION}`;
        return headers;
    }

    /**
     * One request and one response, no redirects.
     *
     * @private
     * @param {string} url
     * @param {string} method
     * @param {Record<string, string>} headers
     * @param {?Uint8Array} body
     * @param {?number} deadlineAt - epoch milliseconds
     * @param {?number} deadline - the request's deadline, for messages
     * @param {AbortSignal} signal
     * @returns {Promise<HttpResponse>}
     */
    _exchange(url, method, headers, body, deadlineAt, deadline, signal) {
        return new Promise((resolve, reject) => {
            const target = new URL(url);
            const isHttps = target.protocol === "https:";

            /** @type {Record<string, string>} */
            const requestHeaders = { ...headers };
            if (body != null) {
                requestHeaders["content-length"] = String(body.byteLength);
            }

            const req = (isHttps ? https : http).request(target, {
                method,
                headers: requestHeaders,
                agent: isHttps ? this._httpsAgent : this._httpAgent,
            });

            let settled = false;
            /** @type {Array<() => void>} */
            const cleanups = [];

            const settle = () => {
                settled = true;
                for (const cleanup of cleanups) {
                    cleanup();
                }
                this._exchanges.delete(req);
            };

            /**
             * @param {unknown} error
             */
            const fail = (error) => {
                if (settled) {
                    return;
                }
                settle();
                reject(error);
            };

            /**
             * Fail with our own classified error and tear the exchange
             * down; the `error` event that follows is ignored.
             *
             * @param {HttpTransportError} error
             */
            const destroyWith = (error) => {
                fail(error);
                req.destroy(error);
            };

            this._exchanges.set(req, destroyWith);

            const onCallerAbort = () =>
                destroyWith(
                    new HttpTransportError(
                        HttpTransportErrorCode.CANCELLED_ERROR,
                        "the call was cancelled",
                        { cause: abortReason(signal) },
                    ),
                );
            signal.addEventListener("abort", onCallerAbort);
            cleanups.push(() =>
                signal.removeEventListener("abort", onCallerAbort),
            );

            if (deadlineAt != null) {
                const remaining = deadlineAt - Date.now();
                if (remaining <= 0) {
                    destroyWith(
                        new HttpTransportError(
                            HttpTransportErrorCode.TIMEOUT_ERROR,
                            `the deadline of ${String(
                                deadline,
                            )} ms elapsed before the request was sent`,
                        ),
                    );
                    return;
                }
                const timer = setTimeout(
                    () =>
                        destroyWith(
                            new HttpTransportError(
                                HttpTransportErrorCode.TIMEOUT_ERROR,
                                `the deadline of ${String(
                                    deadline,
                                )} ms elapsed`,
                            ),
                        ),
                    remaining,
                );
                cleanups.push(() => clearTimeout(timer));
            }

            const connectTimeout = this._configuration.connectTimeout;
            if (connectTimeout > 0) {
                req.on("socket", (socket) => {
                    const tlsSocket = /** @type {import("tls").TLSSocket} */ (
                        socket
                    );
                    const connected =
                        !socket.connecting &&
                        (!isHttps ||
                            tlsSocket.authorized === true ||
                            tlsSocket.authorizationError != null);
                    if (connected) {
                        // A pooled socket: nothing to bound.
                        return;
                    }
                    const timer = setTimeout(
                        () =>
                            destroyWith(
                                new HttpTransportError(
                                    HttpTransportErrorCode.TIMEOUT_ERROR,
                                    `the connect timeout of ${connectTimeout} ms elapsed`,
                                ),
                            ),
                        connectTimeout,
                    );
                    const clear = () => clearTimeout(timer);
                    socket.once(isHttps ? "secureConnect" : "connect", clear);
                    socket.once("error", clear);
                    socket.once("close", clear);
                    cleanups.push(clear);
                });
            }

            req.on("error", (error) => fail(this._mapError(error)));

            req.on("response", (res) => {
                res.on("error", (error) => fail(this._mapError(error)));
                this._readBody(res, destroyWith)
                    .then((bytes) => {
                        if (settled) {
                            return;
                        }
                        const response = new HttpResponse({
                            statusCode: res.statusCode ?? 0,
                            body: bytes,
                            headers: rawHeaderPairs(res.rawHeaders),
                        });
                        settle();
                        resolve(response);
                    })
                    .catch((error) => fail(this._mapError(error)));
            });

            if (body != null) {
                req.end(
                    Buffer.from(body.buffer, body.byteOffset, body.byteLength),
                );
            } else {
                req.end();
            }
        });
    }

    /**
     * Buffer the response body, decoding a compressed one and failing one
     * chunk past `maxResponseBytes` without reading the remainder.
     *
     * @private
     * @param {IncomingMessage} res
     * @param {(error: HttpTransportError) => void} destroyWith
     * @returns {Promise<Uint8Array>}
     */
    _readBody(res, destroyWith) {
        return new Promise((resolve, reject) => {
            const max = this._configuration.maxResponseBytes;
            const encoding = (res.headers["content-encoding"] ?? "")
                .trim()
                .toLowerCase();

            /** @type {NodeJS.ReadableStream} */
            let stream = res;
            if (encoding === "gzip" || encoding === "x-gzip") {
                stream = res.pipe(zlib.createGunzip());
            } else if (encoding === "deflate") {
                stream = res.pipe(zlib.createInflate());
            } else if (encoding === "br") {
                stream = res.pipe(zlib.createBrotliDecompress());
            }

            /** @type {Buffer[]} */
            const chunks = [];
            let total = 0;

            stream.on("data", (/** @type {Buffer} */ chunk) => {
                total += chunk.length;
                if (total > max) {
                    const error = new HttpTransportError(
                        HttpTransportErrorCode.RESPONSE_TOO_LARGE_ERROR,
                        `the response body exceeded ${max} bytes`,
                    );
                    destroyWith(error);
                    reject(error);
                    return;
                }
                chunks.push(chunk);
            });
            stream.on("error", reject);
            stream.on("end", () => resolve(Buffer.concat(chunks, total)));
        });
    }

    /**
     * Map a Node.js failure onto a transport error. Anything without a
     * recognised system error code is returned as it is, so it surfaces
     * after one attempt instead of being retried.
     *
     * @private
     * @param {unknown} error
     * @returns {unknown}
     */
    _mapError(error) {
        if (HttpTransportError.isHttpTransportError(error)) {
            return error;
        }
        if (!(error instanceof Error)) {
            return error;
        }

        const code = /** @type {{code?: unknown}} */ (error).code;
        if (typeof code === "string") {
            const mapped = mapSystemErrorCode(code);
            if (mapped != null) {
                return new HttpTransportError(mapped, error.message, {
                    cause: error,
                });
            }
        }

        if (error.message === "socket hang up" || error.message === "aborted") {
            return new HttpTransportError(
                HttpTransportErrorCode.CONNECTION_ERROR,
                error.message,
                { cause: error },
            );
        }

        return error;
    }
}

/**
 * The proxy configuration Node applied to one of its own global agents at
 * startup (`--use-env-proxy`, `NODE_OPTIONS`, or `NODE_USE_ENV_PROXY` with
 * Node's own reading of its value), handed to a private agent so that it
 * makes the same decision. Node decides once, at startup, so it is read back
 * rather than re-derived from the environment. Undefined on older Node,
 * where nothing changes.
 *
 * @param {http.Agent} globalAgent
 * @returns {{proxyEnv?: http.AgentOptions["proxyEnv"]}}
 */
function proxyOptionsOf(globalAgent) {
    // `options` is not in the type declarations, but every `Agent` keeps
    // the options it was created with.
    const options =
        /** @type {{options?: {proxyEnv?: http.AgentOptions["proxyEnv"]}}} */ (
            globalAgent
        ).options;
    const proxyEnv = options != null ? options.proxyEnv : undefined;
    return proxyEnv != null ? { proxyEnv } : {};
}

/**
 * Drop every header but the safe set before following a redirect to
 * another origin.
 *
 * @param {Record<string, string>} headers
 * @returns {Record<string, string>}
 */
function stripForCrossOrigin(headers) {
    /** @type {Record<string, string>} */
    const kept = {};
    for (const [name, value] of Object.entries(headers)) {
        if (CROSS_ORIGIN_SAFE_HEADERS.has(name)) {
            kept[name] = value;
        }
    }
    return kept;
}

/**
 * Group Node's flat `rawHeaders` list into pairs so a repeated header keeps
 * every value.
 *
 * @param {string[]} rawHeaders
 * @returns {Array<[string, string]>}
 */
function rawHeaderPairs(rawHeaders) {
    /** @type {Array<[string, string]>} */
    const pairs = [];
    for (let i = 0; i + 1 < rawHeaders.length; i += 2) {
        pairs.push([rawHeaders[i], rawHeaders[i + 1]]);
    }
    return pairs;
}
