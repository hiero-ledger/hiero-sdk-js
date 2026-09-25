// SPDX-License-Identifier: Apache-2.0

import HttpMethod from "./HttpMethod.js";
import { freezeHeaders, normalizeRequestHeaders } from "./headers.js";

const URL_PATTERN = /^https?:\/\/[^\s]+$/;
/** @type {Set<string>} */
const METHODS = new Set(Object.values(HttpMethod));

/**
 * One HTTP exchange, as handed to an `HttpTransport`.
 *
 * - `url` is absolute and already resolved. The transport never joins
 *   anything.
 * - `body` and `contentType` are `null` on a bodyless request.
 * - `headers` is never null. An empty map is the absence of headers, and
 *   header names are lowercase. Request headers are single-valued.
 * - `deadline` bounds the whole exchange in milliseconds, body included,
 *   not time-to-first-byte. A transport must abandon the exchange and fail
 *   with `timeout-error` when it elapses. It is `null` when the caller
 *   imposes no bound of its own.
 *
 * Instances are immutable. Derive a changed copy with
 * `new HttpRequest({ ...request, deadline: 1000 })`.
 */
export default class HttpRequest {
    /**
     * @param {object} props
     * @param {string} props.method - one of `HttpMethod`
     * @param {string} props.url - absolute `http://` or `https://` URL
     * @param {?Uint8Array} [props.body]
     * @param {?string} [props.contentType]
     * @param {Record<string, string>} [props.headers]
     * @param {?number} [props.deadline] - milliseconds, `>= 0`
     */
    constructor(props) {
        if (props == null || typeof props !== "object") {
            throw new TypeError("HttpRequest requires a props object");
        }

        if (!METHODS.has(props.method)) {
            throw new TypeError(
                `HttpRequest.method must be one of ${[...METHODS].join(
                    ", ",
                )}, got ${String(props.method)}`,
            );
        }

        if (typeof props.url !== "string" || !URL_PATTERN.test(props.url)) {
            throw new TypeError(
                `HttpRequest.url must be an absolute http(s) URL, got ${String(
                    props.url,
                )}`,
            );
        }

        const body = props.body ?? null;
        if (body != null && !(body instanceof Uint8Array)) {
            throw new TypeError("HttpRequest.body must be a Uint8Array");
        }

        const contentType = props.contentType ?? null;
        if (contentType != null && typeof contentType !== "string") {
            throw new TypeError("HttpRequest.contentType must be a string");
        }

        const deadline = props.deadline ?? null;
        if (
            deadline != null &&
            (typeof deadline !== "number" ||
                !Number.isFinite(deadline) ||
                deadline < 0)
        ) {
            throw new TypeError(
                "HttpRequest.deadline must be a non-negative number of milliseconds",
            );
        }

        /**
         * @readonly
         * @type {string}
         */
        this.method = props.method;

        /**
         * @readonly
         * @type {string}
         */
        this.url = props.url;

        /**
         * @readonly
         * @type {?Uint8Array}
         */
        this.body = body;

        /**
         * @readonly
         * @type {?string}
         */
        this.contentType = contentType;

        /**
         * Lowercased, single-valued request headers.
         *
         * @readonly
         * @type {Readonly<Record<string, string>>}
         */
        this.headers = freezeHeaders(normalizeRequestHeaders(props.headers));

        /**
         * Bound for the whole exchange in milliseconds, or `null`.
         *
         * @readonly
         * @type {?number}
         */
        this.deadline = deadline;

        Object.freeze(this);
    }

    /**
     * @param {HttpRequest | ConstructorParameters<typeof HttpRequest>[0]} value
     * @returns {HttpRequest}
     */
    static from(value) {
        return value instanceof HttpRequest ? value : new HttpRequest(value);
    }
}
