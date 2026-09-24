// SPDX-License-Identifier: Apache-2.0

import HttpMethod from "../http/HttpMethod.js";
import HttpRequest from "../http/HttpRequest.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../http/HttpTransportError.js";
import { normalizeRequestHeaders } from "../http/headers.js";
import {
    abortReason,
    cancellableSleep,
    noCancellation,
} from "../http/cancellation.js";
import MirrorNodeHttpError, {
    MirrorNodeHttpErrorCode,
} from "./MirrorNodeHttpError.js";
import MirrorNodeHttpRetryPolicy from "./MirrorNodeHttpRetryPolicy.js";
import MirrorNodeRestPath from "./MirrorNodeRestPath.js";
import * as utf8 from "../encoding/utf8.js";

/**
 * @typedef {import("../http/HttpTransport.js").default} HttpTransport
 * @typedef {import("../http/HttpResponse.js").default} HttpResponse
 * @typedef {import("../logger/Logger.js").default} Logger
 */

/**
 * @typedef {object} MirrorNodeHttpClientOptions
 * @property {Record<string, string>} [requestHeaders] - the client's
 * caller headers, sent on every request below the endpoint's own
 * @property {?AbortSignal} [closeSignal] - aborted by `Client.close()`; the
 * adapter then starts no new attempt and interrupts any backoff sleep
 * @property {?Logger} [logger]
 * @property {() => number} [random] - the jitter source, `Math.random` by
 * default
 * @property {() => number} [now] - the clock, `Date.now` by default
 */

const MAX_ERROR_DETAIL_LENGTH = 500;

/**
 * The mirror node REST adapter: base URL resolution, retry, backoff,
 * `Retry-After`, per-attempt and total deadlines, and status
 * classification, above a policy-free `HttpTransport`.
 *
 * One instance is one *call*: one query execution, every page included.
 * The base URL is fixed for the whole call and `totalDeadline` starts when
 * the instance is created. `maxAttempts` is counted per request, so each
 * page of a paginated walk gets the budget afresh. Instances are cheap and
 * own nothing: they never close the transport they were handed.
 *
 * `get` and `post` return the response as received on any status the
 * policy does not retry, 4xx included. They add exactly two failures of
 * their own: `retries-exhausted-error` when a retryable status survived
 * every attempt, and `deadline-exceeded-error` when the total deadline
 * elapsed or a `Retry-After` exceeded the time left in it. A transport
 * failure that is not recognised as retryable surfaces after one attempt.
 *
 * @internal
 */
export default class MirrorNodeHttpClient {
    /**
     * @param {object} props
     * @param {string} props.baseUrl
     * @param {HttpTransport} props.transport
     * @param {MirrorNodeHttpRetryPolicy} props.retryPolicy
     * @param {Record<string, string>} [props.requestHeaders]
     * @param {?AbortSignal} [props.closeSignal]
     * @param {?Logger} [props.logger]
     * @param {() => number} [props.random]
     * @param {() => number} [props.now]
     */
    constructor(props) {
        if (
            typeof props.baseUrl !== "string" ||
            !/^https?:\/\/[^\s]+$/.test(props.baseUrl)
        ) {
            throw new TypeError(
                `MirrorNodeHttpClient.baseUrl must be an absolute http(s) URL, got ${String(
                    props.baseUrl,
                )}`,
            );
        }

        /**
         * @private
         * @type {string}
         */
        this._baseUrl = props.baseUrl.replace(/\/+$/, "");

        /**
         * @private
         * @type {HttpTransport}
         */
        this._transport = props.transport;

        /**
         * @private
         * @type {MirrorNodeHttpRetryPolicy}
         */
        this._retryPolicy = MirrorNodeHttpRetryPolicy.from(props.retryPolicy);

        /**
         * @private
         * @type {Record<string, string>}
         */
        this._requestHeaders = normalizeRequestHeaders(props.requestHeaders);

        /**
         * @private
         * @type {?AbortSignal}
         */
        this._closeSignal = props.closeSignal ?? null;

        /**
         * @private
         * @type {?Logger}
         */
        this._logger = props.logger ?? null;

        /**
         * @private
         * @type {() => number}
         */
        this._random = props.random ?? Math.random;

        /**
         * @private
         * @type {() => number}
         */
        this._now = props.now ?? Date.now;

        /**
         * Epoch milliseconds at which the call's total deadline elapses, or
         * `null` when the call is unbounded.
         *
         * @private
         * @type {?number}
         */
        this._deadlineAt =
            this._retryPolicy.totalDeadline > 0
                ? this._now() + this._retryPolicy.totalDeadline
                : null;
    }

    /**
     * @param {string} baseUrl
     * @param {HttpTransport} transport
     * @param {MirrorNodeHttpRetryPolicy} retryPolicy
     * @param {MirrorNodeHttpClientOptions} [options]
     * @returns {MirrorNodeHttpClient}
     */
    static create(baseUrl, transport, retryPolicy, options = {}) {
        return new MirrorNodeHttpClient({
            baseUrl,
            transport,
            retryPolicy,
            ...options,
        });
    }

    /**
     * @returns {string}
     */
    get baseUrl() {
        return this._baseUrl;
    }

    /**
     * @returns {MirrorNodeHttpRetryPolicy}
     */
    get retryPolicy() {
        return this._retryPolicy;
    }

    /**
     * Milliseconds left before the call's total deadline, or `null` when
     * the call is unbounded.
     *
     * @returns {?number}
     */
    get remainingTime() {
        return this._deadlineAt != null ? this._deadlineAt - this._now() : null;
    }

    /**
     * @param {MirrorNodeRestPath | string} path
     * @param {AbortSignal} [signal]
     * @param {Record<string, string>} [headers] - per-endpoint headers,
     * above the client's `requestHeaders`
     * @returns {Promise<HttpResponse>}
     */
    get(path, signal = noCancellation(), headers = {}) {
        return this._send(HttpMethod.GET, path, null, null, signal, headers);
    }

    /**
     * A `POST` is retried like a `GET`: every mirror REST endpoint in scope
     * is read-only, and the body is replayed byte for byte on each attempt.
     *
     * @param {MirrorNodeRestPath | string} path
     * @param {string} contentType
     * @param {Uint8Array} body
     * @param {AbortSignal} [signal]
     * @param {Record<string, string>} [headers]
     * @returns {Promise<HttpResponse>}
     */
    post(path, contentType, body, signal = noCancellation(), headers = {}) {
        return this._send(
            HttpMethod.POST,
            path,
            contentType,
            body,
            signal,
            headers,
        );
    }

    /**
     * @private
     * @param {string} method
     * @param {MirrorNodeRestPath | string} path
     * @param {?string} contentType
     * @param {?Uint8Array} body
     * @param {AbortSignal} signal
     * @param {Record<string, string>} endpointHeaders
     * @returns {Promise<HttpResponse>}
     */
    async _send(method, path, contentType, body, signal, endpointHeaders) {
        const restPath =
            path instanceof MirrorNodeRestPath
                ? path
                : MirrorNodeRestPath.of(path);
        const url = restPath.resolve(this._baseUrl);

        /** @type {Record<string, string>} */
        const headers = {
            accept: "application/json",
            ...this._requestHeaders,
            ...normalizeRequestHeaders(endpointHeaders),
        };

        const policy = this._retryPolicy;
        /** @type {?HttpResponse} */
        let lastResponse = null;
        /** @type {unknown} */
        let lastError = null;

        for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
            this._throwIfClosed();
            if (signal.aborted) {
                throw cancelled(signal);
            }

            const remaining = this.remainingTime;
            if (remaining != null && remaining <= 0) {
                throw this._deadlineExceeded(lastResponse, lastError);
            }

            /** @type {?number} */
            let attemptDeadline = remaining;
            if (policy.perAttemptTimeout > 0) {
                attemptDeadline =
                    remaining != null
                        ? Math.min(policy.perAttemptTimeout, remaining)
                        : policy.perAttemptTimeout;
            }

            const request = new HttpRequest({
                method,
                url,
                body,
                contentType,
                headers,
                deadline: attemptDeadline,
            });

            /** @type {HttpResponse} */
            let response;
            try {
                response = await this._transport.roundTrip(request, signal);
            } catch (error) {
                if (
                    HttpTransportError.hasCode(
                        error,
                        HttpTransportErrorCode.CANCELLED_ERROR,
                    ) ||
                    HttpTransportError.hasCode(
                        error,
                        HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                    ) ||
                    !HttpTransportError.isRetryable(error)
                ) {
                    // Terminal, or not recognised: one attempt, surfaced
                    // as it is.
                    throw error;
                }
                lastError = error;
                if (attempt >= policy.maxAttempts) {
                    throw error;
                }
                await this._backoff(
                    attempt,
                    null,
                    signal,
                    `${method} ${url}`,
                    /** @type {Error} */ (error).message,
                );
                continue;
            }

            if (!policy.isRetryableStatus(response.statusCode)) {
                return response;
            }

            lastResponse = response;
            const reason = statusMessage(response);
            if (attempt >= policy.maxAttempts) {
                throw new MirrorNodeHttpError(
                    MirrorNodeHttpErrorCode.RETRIES_EXHAUSTED_ERROR,
                    `retries exhausted after ${attempt} attempts. Last error: ${reason}`,
                    { response },
                );
            }

            await this._backoff(
                attempt,
                parseRetryAfter(response, this._now()),
                signal,
                `${method} ${url}`,
                reason,
                response,
            );
        }

        // `maxAttempts >= 1`, so the loop always returns or throws.
        throw lastError ?? new Error("unreachable");
    }

    /**
     * Wait before the next attempt: the `Retry-After` the node asked for,
     * else exponential backoff with full jitter. Either is bounded by the
     * time left in the call, and the sleep is interrupted by cancellation
     * or by `Client.close()`.
     *
     * @private
     * @param {number} attempt - the attempt that just failed, 1-based
     * @param {?number} retryAfterMs
     * @param {AbortSignal} signal
     * @param {string} target
     * @param {string} reason
     * @param {?HttpResponse} [response]
     * @returns {Promise<void>}
     */
    async _backoff(attempt, retryAfterMs, signal, target, reason, response) {
        const remaining = this.remainingTime ?? Infinity;

        /** @type {number} */
        let wait;
        if (retryAfterMs != null) {
            if (retryAfterMs > remaining) {
                throw new MirrorNodeHttpError(
                    MirrorNodeHttpErrorCode.DEADLINE_EXCEEDED_ERROR,
                    `the mirror node asked to retry after ${retryAfterMs} ms but only ${Math.max(
                        0,
                        Math.floor(remaining),
                    )} ms of the ${
                        this._retryPolicy.totalDeadline
                    } ms request deadline remain. Last error: ${reason}`,
                    { response: response ?? null },
                );
            }
            wait = retryAfterMs;
        } else {
            wait = this.backoffFor(attempt - 1);
            if (wait >= remaining) {
                throw new MirrorNodeHttpError(
                    MirrorNodeHttpErrorCode.DEADLINE_EXCEEDED_ERROR,
                    `request deadline of ${this._retryPolicy.totalDeadline} ms exceeded. Last error: ${reason}`,
                    { response: response ?? null },
                );
            }
        }

        if (this._logger != null) {
            this._logger.debug(
                `${target} failed during attempt ${attempt} (${reason}). Waiting ${wait} ms before next attempt`,
            );
        }

        try {
            await cancellableSleep(wait, [signal, this._closeSignal]);
        } catch (error) {
            if (this._closeSignal != null && this._closeSignal.aborted) {
                throw new HttpTransportError(
                    HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                    "the client was closed while waiting to retry",
                    { cause: error },
                );
            }
            throw cancelled(signal, error);
        }
    }

    /**
     * The computed backoff before retry `retryIndex` (zero-based): a
     * uniform draw from `[0, min(maxBackoff, initialBackoff * 2^retryIndex))`.
     * Full jitter rather than a fixed curve, because every SDK retrying a
     * throttled mirror node on the same curve re-converges on it.
     *
     * @param {number} retryIndex
     * @returns {number}
     */
    backoffFor(retryIndex) {
        const cap = Math.min(
            this._retryPolicy.maxBackoff,
            this._retryPolicy.initialBackoff * 2 ** retryIndex,
        );
        if (cap <= 0) {
            return 0;
        }
        const draw = Math.floor(this._random() * cap);
        return Math.min(Math.max(draw, 0), cap);
    }

    /**
     * @private
     */
    _throwIfClosed() {
        if (this._closeSignal != null && this._closeSignal.aborted) {
            throw new HttpTransportError(
                HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                "the client is closed",
            );
        }
    }

    /**
     * @private
     * @param {?HttpResponse} lastResponse
     * @param {unknown} lastError
     * @returns {MirrorNodeHttpError}
     */
    _deadlineExceeded(lastResponse, lastError) {
        /** @type {?string} */
        let last = null;
        if (lastResponse != null) {
            last = statusMessage(lastResponse);
        } else if (lastError instanceof Error) {
            last = lastError.message;
        }
        return new MirrorNodeHttpError(
            MirrorNodeHttpErrorCode.DEADLINE_EXCEEDED_ERROR,
            `request deadline of ${
                this._retryPolicy.totalDeadline
            } ms exceeded${last != null ? `. Last error: ${last}` : ""}`,
            { response: lastResponse, cause: lastError },
        );
    }
}

/**
 * @param {AbortSignal} signal
 * @param {unknown} [cause]
 * @returns {HttpTransportError}
 */
function cancelled(signal, cause) {
    return new HttpTransportError(
        HttpTransportErrorCode.CANCELLED_ERROR,
        "the call was cancelled",
        { cause: cause ?? abortReason(signal) },
    );
}

/**
 * Parse a `Retry-After` header in both permitted forms, delta-seconds and
 * HTTP-date, into milliseconds to wait. A date already in the past means
 * "now". Returns `null` when the response carries no usable value.
 *
 * @param {HttpResponse} response
 * @param {number} now - epoch milliseconds
 * @returns {?number}
 */
export function parseRetryAfter(response, now) {
    const value = response.header("retry-after");
    if (value == null) {
        return null;
    }
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
        return Number(trimmed) * 1000;
    }
    const date = Date.parse(trimmed);
    if (Number.isNaN(date)) {
        return null;
    }
    return Math.max(0, date - now);
}

/**
 * The body decoded as UTF-8, or an empty string when it is empty or not
 * decodable.
 *
 * @param {HttpResponse} response
 * @returns {string}
 */
export function bodyText(response) {
    if (response.body.byteLength === 0) {
        return "";
    }
    try {
        return utf8.decode(response.body);
    } catch {
        return "";
    }
}

/**
 * The body parsed as JSON. Throws a `SyntaxError` on a malformed body, and
 * returns `null` on an empty one.
 *
 * @param {HttpResponse} response
 * @returns {unknown}
 */
export function bodyJson(response) {
    const text = bodyText(response);
    if (text.length === 0) {
        return null;
    }
    return JSON.parse(text);
}

/**
 * A short, human-readable detail from a mirror node error body. The mirror
 * node's envelope is `{"_status":{"messages":[{"message":"...","detail":"..."}]}}`:
 * `message` is the HTTP reason phrase ("Bad Request") and `detail` the
 * actual cause ("Unable to parse transaction"), so both are kept. A body
 * that is not the envelope is returned truncated.
 *
 * @param {HttpResponse} response
 * @returns {string}
 */
export function errorDetail(response) {
    const text = bodyText(response).trim();
    if (text.length === 0) {
        return "";
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed =
            /** @type {{_status?: {messages?: {message?: unknown, detail?: unknown}[]}}} */ (
                JSON.parse(text)
            );
        const first = parsed?._status?.messages?.[0];
        const detail = first?.detail;
        const message = first?.message;
        if (typeof detail === "string" && detail.length > 0) {
            return typeof message === "string" && message.length > 0
                ? `${message}: ${detail}`
                : detail;
        }
        if (typeof message === "string" && message.length > 0) {
            return message;
        }
    } catch {
        // not the envelope; fall through to the raw text
    }
    return text.slice(0, MAX_ERROR_DETAIL_LENGTH);
}

/**
 * `HTTP <status>[: <detail>]`, the message every mirror REST query builds
 * from a response it did not expect.
 *
 * @param {HttpResponse} response
 * @returns {string}
 */
export function statusMessage(response) {
    const detail = errorDetail(response);
    return `HTTP ${response.statusCode}${
        detail.length > 0 ? `: ${detail}` : ""
    }`;
}
