// SPDX-License-Identifier: Apache-2.0

import HttpTransport from "./HttpTransport.js";
import HttpRequest from "./HttpRequest.js";
import HttpResponse from "./HttpResponse.js";
import HttpTransportConfiguration from "./HttpTransportConfiguration.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "./HttpTransportError.js";
import { mapSystemErrorCode } from "./errorCodes.js";
import { noCancellation, abortReason } from "./cancellation.js";
import * as utf8 from "../encoding/utf8.js";
import { SDK_NAME, SDK_VERSION } from "../version.js";

/**
 * @typedef {object} FetchHttpTransportOptions
 * @property {?RequestCache} [cache] - the `cache` mode handed to `fetch`.
 * `"no-store"` by default, so a mirror read is never served from an HTTP
 * cache. `null` sends no mode at all: React Native's `fetch` (whatwg-fetch)
 * turns `"no-store"` into a `_=<timestamp>` query parameter, which the
 * mirror node rejects with HTTP 400, so `NativeClient` passes `null`, and so
 * does the default whenever React Native is detected.
 */

/**
 * The `fetch`-backed transport: the SDK default in the browser and on React
 * Native, and available on Node for an application that wants the
 * platform's global `fetch` (and whatever dispatcher or proxy it has been
 * configured with) instead of the SDK's private connection pool.
 *
 * This is the constrained conformance profile. The HTTP stack belongs to
 * the platform, so:
 *
 * - `connectTimeout` is ignored; the platform's own connect bound applies.
 * - Redirects follow the platform's own bound, not `maxRedirects`.
 * - Every network failure is one opaque `TypeError`, so a bad host name or
 *   an untrusted certificate is reported as `connection-error` (and
 *   retried) rather than as `unknown-host-error` or `tls-error`. Under Node
 *   the failure carries a `cause.code` and is classified precisely.
 * - The body cap is enforced while streaming where the runtime exposes a
 *   readable body, and after buffering where it does not (React Native).
 * - There is no connection pool to drain, so `close` aborts outstanding
 *   requests immediately.
 */
export default class FetchHttpTransport extends HttpTransport {
    /**
     * @param {HttpTransportConfiguration | ConstructorParameters<typeof HttpTransportConfiguration>[0]} [configuration]
     * @param {FetchHttpTransportOptions} [options]
     */
    constructor(configuration, options = {}) {
        super();

        /**
         * @private
         * @type {HttpTransportConfiguration}
         */
        this._configuration = HttpTransportConfiguration.from(configuration);

        /**
         * @private
         * @type {?RequestCache}
         */
        this._cache =
            options.cache === undefined
                ? isReactNative()
                    ? null
                    : "no-store"
                : options.cache;

        /**
         * @private
         * @type {boolean}
         */
        this._closed = false;

        /**
         * Exchanges in flight, each with the function that aborts it with
         * a classified error.
         *
         * @private
         * @type {Map<AbortController, (error: HttpTransportError) => void>}
         */
        this._inFlight = new Map();
    }

    /**
     * @param {HttpTransportConfiguration | ConstructorParameters<typeof HttpTransportConfiguration>[0]} [configuration]
     * @param {FetchHttpTransportOptions} [options]
     * @returns {FetchHttpTransport}
     */
    static create(configuration, options) {
        return new FetchHttpTransport(configuration, options);
    }

    /**
     * The `cache` mode handed to `fetch`, or `null` when none is sent.
     *
     * @returns {?RequestCache}
     */
    get cache() {
        return this._cache;
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

        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        if (typeof fetch !== "function") {
            throw new Error(
                "FetchHttpTransport requires a global fetch(); inject an HttpTransport for this runtime",
            );
        }

        const controller = new AbortController();

        /** @type {?HttpTransportError} */
        let abortCause = null;

        /**
         * Abort the exchange with a classified reason. The first reason
         * wins, so a deadline that fires while `close()` runs is still
         * reported as a timeout.
         *
         * @param {HttpTransportError} error
         */
        const abortWith = (error) => {
            if (abortCause == null) {
                abortCause = error;
                controller.abort(error);
            }
        };

        this._inFlight.set(controller, abortWith);

        const onCallerAbort = () =>
            abortWith(
                new HttpTransportError(
                    HttpTransportErrorCode.CANCELLED_ERROR,
                    "the call was cancelled",
                    { cause: abortReason(signal) },
                ),
            );
        signal.addEventListener("abort", onCallerAbort);

        /** @type {ReturnType<typeof setTimeout> | null} */
        let timer = null;
        if (req.deadline != null) {
            timer = setTimeout(
                () =>
                    abortWith(
                        new HttpTransportError(
                            HttpTransportErrorCode.TIMEOUT_ERROR,
                            `the deadline of ${String(
                                req.deadline,
                            )} ms elapsed`,
                        ),
                    ),
                req.deadline,
            );
        }

        try {
            // eslint-disable-next-line n/no-unsupported-features/node-builtins
            const response = await fetch(req.url, {
                method: req.method,
                headers: this._headersFor(req),
                body:
                    req.body != null
                        ? /** @type {BodyInit} */ (req.body)
                        : undefined,
                signal: controller.signal,
                // Mirror node reads must never be served from an HTTP cache,
                // except where the runtime cannot express that (see
                // `FetchHttpTransportOptions.cache`).
                ...(this._cache != null ? { cache: this._cache } : {}),
            });

            const body = await this._readBody(
                response,
                abortWith,
                controller.signal,
            );

            // `Headers` is not iterable under every runtime's typings, and
            // React Native's polyfill only guarantees `forEach`.
            /** @type {Array<[string, string]>} */
            const headers = [];
            response.headers.forEach((value, name) => {
                headers.push([name, value]);
            });

            return new HttpResponse({
                statusCode: response.status,
                body,
                headers,
            });
        } catch (error) {
            throw this._classify(error, abortCause);
        } finally {
            if (timer != null) {
                clearTimeout(timer);
            }
            signal.removeEventListener("abort", onCallerAbort);
            this._inFlight.delete(controller);
        }
    }

    /**
     * Abort every exchange in flight and refuse new ones. There is no
     * connection pool behind `fetch` to drain, so `closeTimeout` is not
     * waited out; the returned promise is already settled.
     *
     * @override
     * @param {number} [closeTimeout]
     * @returns {Promise<void>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    close(closeTimeout) {
        if (!this._closed) {
            this._closed = true;
            for (const abortWith of [...this._inFlight.values()]) {
                abortWith(
                    new HttpTransportError(
                        HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                        "the transport was closed while the request was in flight",
                    ),
                );
            }
        }
        return Promise.resolve();
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
     * Buffer the body, failing one chunk past `maxResponseBytes` where the
     * runtime lets the body stream and after the fact where it does not.
     *
     * Every read races the transport's own abort signal: a platform `fetch`
     * errors the body stream when its signal aborts, but the deadline must
     * hold even on one that does not.
     *
     * @private
     * @param {Response} response
     * @param {(error: HttpTransportError) => void} abortWith
     * @param {AbortSignal} aborted - the controller signal of this exchange
     * @returns {Promise<Uint8Array>}
     */
    async _readBody(response, abortWith, aborted) {
        const max = this._configuration.maxResponseBytes;
        const tooLarge = () =>
            new HttpTransportError(
                HttpTransportErrorCode.RESPONSE_TOO_LARGE_ERROR,
                `the response body exceeded ${max} bytes`,
            );

        /** @type {?(() => void)} */
        let onAbort = null;
        /** @type {Promise<never>} */
        const abortion = new Promise((_, reject) => {
            onAbort = () => reject(abortReason(aborted));
            if (aborted.aborted) {
                onAbort();
            } else {
                aborted.addEventListener("abort", onAbort);
            }
        });
        // Nothing awaits `abortion` on its own; a rejection it settles with
        // must not surface as unhandled.
        abortion.catch(() => {});

        /**
         * @template T
         * @param {Promise<T>} read
         * @returns {Promise<T>}
         */
        const untilAborted = (read) => Promise.race([read, abortion]);

        try {
            const stream = response.body;
            if (stream != null && typeof stream.getReader === "function") {
                const reader = stream.getReader();
                /** @type {Uint8Array[]} */
                const chunks = [];
                let total = 0;
                try {
                    for (;;) {
                        const { done, value } = await untilAborted(
                            reader.read(),
                        );
                        if (done) {
                            break;
                        }
                        total += value.byteLength;
                        if (total > max) {
                            const error = tooLarge();
                            abortWith(error);
                            throw error;
                        }
                        chunks.push(value);
                    }
                } catch (error) {
                    reader.cancel().catch(() => {});
                    throw error;
                }
                return concat(chunks, total);
            }

            if (typeof response.arrayBuffer === "function") {
                const bytes = new Uint8Array(
                    await untilAborted(response.arrayBuffer()),
                );
                if (bytes.byteLength > max) {
                    throw tooLarge();
                }
                return bytes;
            }

            // Oldest React Native runtimes: no streams and no `arrayBuffer()`.
            const bytes = utf8.encode(await untilAborted(response.text()));
            if (bytes.byteLength > max) {
                throw tooLarge();
            }
            return bytes;
        } finally {
            if (onAbort != null) {
                aborted.removeEventListener("abort", onAbort);
            }
        }
    }

    /**
     * Map what `fetch` threw onto a transport error code.
     *
     * @private
     * @param {unknown} error
     * @param {?HttpTransportError} abortCause - set when this transport
     * aborted the exchange itself (deadline, close, body cap, cancellation)
     * @returns {unknown}
     */
    _classify(error, abortCause) {
        if (HttpTransportError.isHttpTransportError(error)) {
            return error;
        }

        // Our own abort wins over whatever `fetch` reports for it, so a
        // deadline is a `timeout-error` and never a `cancelled-error`.
        if (abortCause != null) {
            return abortCause;
        }

        if (!(error instanceof Error)) {
            return error;
        }

        if (error.name === "AbortError") {
            return new HttpTransportError(
                HttpTransportErrorCode.CANCELLED_ERROR,
                error.message,
                { cause: error },
            );
        }

        if (error.name === "TimeoutError") {
            return new HttpTransportError(
                HttpTransportErrorCode.TIMEOUT_ERROR,
                error.message,
                { cause: error },
            );
        }

        if (error instanceof TypeError) {
            // Every fetch network failure is a TypeError. Under Node the
            // undici cause carries a system error code; a browser gives
            // nothing more, and the collapse is a recognised network
            // failure rather than an unrecognised one.
            const cause = /** @type {{cause?: unknown}} */ (error).cause;
            const code =
                cause != null &&
                typeof (/** @type {{code?: unknown}} */ (cause).code) ===
                    "string"
                    ? mapSystemErrorCode(
                          /** @type {{code: string}} */ (cause).code,
                      )
                    : null;
            const detail =
                cause instanceof Error && cause.message.length > 0
                    ? `${error.message} (${cause.message})`
                    : error.message;
            return new HttpTransportError(
                code ?? HttpTransportErrorCode.CONNECTION_ERROR,
                detail,
                { cause: error },
            );
        }

        return error;
    }
}

/**
 * React Native sets `navigator.product` and nothing else does.
 *
 * @returns {boolean}
 */
function isReactNative() {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const nav = /** @type {{navigator?: {product?: unknown}}} */ (globalThis)
        .navigator;
    return nav != null && nav.product === "ReactNative";
}

/**
 * @param {Uint8Array[]} chunks
 * @param {number} total
 * @returns {Uint8Array}
 */
function concat(chunks, total) {
    if (chunks.length === 1) {
        return chunks[0];
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return out;
}
