// SPDX-License-Identifier: Apache-2.0

import HttpTransport from "../../../src/http/HttpTransport.js";
import HttpRequest from "../../../src/http/HttpRequest.js";
import HttpResponse from "../../../src/http/HttpResponse.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../../src/http/HttpTransportError.js";

/**
 * @typedef {HttpResponse | {error: unknown} | {hang: true} | {delay: number, response: HttpResponse}} Scripted
 */

/**
 * Build an `HttpResponse` from a JSON-serialisable body.
 *
 * @param {number} statusCode
 * @param {unknown} [body]
 * @param {Record<string, string | string[]>} [headers]
 * @returns {HttpResponse}
 */
export function jsonResponse(statusCode, body, headers = {}) {
    return new HttpResponse({
        statusCode,
        body:
            body === undefined
                ? new Uint8Array(0)
                : new TextEncoder().encode(JSON.stringify(body)),
        headers: { "content-type": "application/json", ...headers },
    });
}

/**
 * A mirror node error envelope.
 *
 * @param {number} statusCode
 * @param {string} detail
 * @param {Record<string, string | string[]>} [headers]
 * @returns {HttpResponse}
 */
export function errorResponse(statusCode, detail, headers = {}) {
    return jsonResponse(
        statusCode,
        { _status: { messages: [{ message: "Error", detail }] } },
        headers,
    );
}

/**
 * An `HttpTransport` for tests: records every request and answers from a
 * script (a queue of responses, errors and hangs) or from a handler.
 *
 * A hang behaves like a server that never answers: the exchange settles
 * only when the request's `deadline` elapses (`timeout-error`), the
 * caller's signal aborts (`cancelled-error`), or the transport is closed
 * (`client-closed-error`), exactly as the real transports do.
 */
export default class FakeHttpTransport extends HttpTransport {
    /**
     * @param {(request: HttpRequest, index: number, signal: AbortSignal) => HttpResponse | Promise<HttpResponse>} [handler]
     */
    constructor(handler) {
        super();

        /** @type {HttpRequest[]} */
        this.requests = [];

        /** @type {AbortSignal[]} */
        this.signals = [];

        /** @type {number[]} */
        this.closeCalls = [];

        /** @type {boolean} */
        this.closed = false;

        /**
         * @private
         * @type {Scripted[]}
         */
        this._script = [];

        /**
         * @private
         * @type {Set<(error: HttpTransportError) => void>}
         */
        this._hanging = new Set();

        /** @type {((request: HttpRequest, index: number, signal: AbortSignal) => HttpResponse | Promise<HttpResponse>) | null} */
        this.handler = handler ?? null;
    }

    /**
     * Queue a response for the next unanswered request.
     *
     * @param {HttpResponse} response
     * @returns {this}
     */
    respond(response) {
        this._script.push(response);
        return this;
    }

    /**
     * @param {number} statusCode
     * @param {unknown} [body]
     * @param {Record<string, string | string[]>} [headers]
     * @returns {this}
     */
    respondJson(statusCode, body, headers) {
        return this.respond(jsonResponse(statusCode, body, headers));
    }

    /**
     * Queue a response that arrives after `delay` milliseconds.
     *
     * @param {number} delay
     * @param {HttpResponse} response
     * @returns {this}
     */
    respondAfter(delay, response) {
        this._script.push({ delay, response });
        return this;
    }

    /**
     * Queue a failure for the next request.
     *
     * @param {unknown} error
     * @returns {this}
     */
    fail(error) {
        this._script.push({ error });
        return this;
    }

    /**
     * Queue a request that never answers.
     *
     * @returns {this}
     */
    hang() {
        this._script.push({ hang: true });
        return this;
    }

    /**
     * @override
     * @param {HttpRequest} request
     * @param {AbortSignal} signal
     * @returns {Promise<HttpResponse>}
     */
    async roundTrip(request, signal) {
        if (this.closed) {
            throw new HttpTransportError(
                HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                "the transport is closed",
            );
        }

        const req = HttpRequest.from(request);
        const index = this.requests.length;
        this.requests.push(req);
        this.signals.push(signal);

        if (signal.aborted) {
            throw new HttpTransportError(
                HttpTransportErrorCode.CANCELLED_ERROR,
                "the call was cancelled",
            );
        }

        const next = this._script.shift();
        if (next === undefined) {
            if (this.handler == null) {
                throw new Error(
                    `FakeHttpTransport: no response scripted for request ${index} (${req.method} ${req.url})`,
                );
            }
            return this.handler(req, index, signal);
        }

        if (next instanceof HttpResponse) {
            return next;
        }

        if ("error" in next) {
            throw next.error;
        }

        if ("delay" in next) {
            return this._settleLater(req, signal, next.delay, next.response);
        }

        return this._settleLater(req, signal, null, null);
    }

    /**
     * @override
     * @param {number} [closeTimeout]
     * @returns {Promise<void>}
     */
    close(closeTimeout) {
        this.closeCalls.push(closeTimeout ?? 0);
        this.closed = true;
        for (const fail of [...this._hanging]) {
            fail(
                new HttpTransportError(
                    HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
                    "the transport was closed while the request was in flight",
                ),
            );
        }
        return Promise.resolve();
    }

    /**
     * @private
     * @param {HttpRequest} request
     * @param {AbortSignal} signal
     * @param {?number} delay - `null` hangs forever
     * @param {?HttpResponse} response
     * @returns {Promise<HttpResponse>}
     */
    _settleLater(request, signal, delay, response) {
        return new Promise((resolve, reject) => {
            /** @type {Array<() => void>} */
            const cleanups = [];
            let settled = false;

            /**
             * @param {HttpTransportError} error
             */
            const fail = (error) => {
                if (settled) return;
                settled = true;
                for (const cleanup of cleanups) cleanup();
                this._hanging.delete(fail);
                reject(error);
            };
            this._hanging.add(fail);

            const onAbort = () =>
                fail(
                    new HttpTransportError(
                        HttpTransportErrorCode.CANCELLED_ERROR,
                        "the call was cancelled",
                    ),
                );
            signal.addEventListener("abort", onAbort);
            cleanups.push(() => signal.removeEventListener("abort", onAbort));

            if (request.deadline != null) {
                const timer = setTimeout(
                    () =>
                        fail(
                            new HttpTransportError(
                                HttpTransportErrorCode.TIMEOUT_ERROR,
                                `the deadline of ${request.deadline} ms elapsed`,
                            ),
                        ),
                    request.deadline,
                );
                cleanups.push(() => clearTimeout(timer));
            }

            if (delay != null && response != null) {
                const timer = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    for (const cleanup of cleanups) cleanup();
                    this._hanging.delete(fail);
                    resolve(response);
                }, delay);
                cleanups.push(() => clearTimeout(timer));
            }
        });
    }
}
