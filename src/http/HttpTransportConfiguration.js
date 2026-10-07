// SPDX-License-Identifier: Apache-2.0

import { freezeHeaders, normalizeRequestHeaders } from "./headers.js";

/**
 * Default cap on a buffered response body: 32 MiB.
 */
export const DEFAULT_MAX_RESPONSE_BYTES = 32 * 1024 * 1024;

/**
 * Default bound on followed redirects.
 */
export const DEFAULT_MAX_REDIRECTS = 5;

/**
 * How the SDK builds its own `HttpTransport`. It is ignored when an
 * application injects a transport, since an injected one brings its own
 * connect timeout, redirect bound and body cap.
 *
 * Every field has a default, and no construction path yields a partially
 * defaulted instance: `new HttpTransportConfiguration({ connectTimeout: 2000 })`
 * keeps every other field at its default. Derive a changed copy from an
 * existing value with `new HttpTransportConfiguration({ ...configuration, maxRedirects: 0 })`.
 */
export default class HttpTransportConfiguration {
    /**
     * @param {object} [props]
     * @param {number} [props.connectTimeout] - TCP connect plus TLS handshake
     * bound in milliseconds. `0` (the default) keeps the platform stack's own
     * bound, not "no bound". Browsers and React Native cannot express a
     * connect bound and ignore it.
     * @param {number} [props.maxRedirects] - redirects followed by the Node
     * transport, default 5. Browsers apply their own fixed bound.
     * @param {number} [props.maxResponseBytes] - cap on a response body,
     * default 32 MiB. A larger body fails with `response-too-large-error`
     * rather than being truncated.
     * @param {Record<string, string>} [props.defaultHeaders] - headers the
     * SDK-built transport adds to every request, below every other source.
     */
    constructor(props = {}) {
        const connectTimeout = props.connectTimeout ?? 0;
        if (
            typeof connectTimeout !== "number" ||
            !Number.isFinite(connectTimeout) ||
            connectTimeout < 0
        ) {
            throw new RangeError(
                "HttpTransportConfiguration.connectTimeout must be a non-negative number of milliseconds",
            );
        }

        const maxRedirects = props.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
        if (
            typeof maxRedirects !== "number" ||
            !Number.isInteger(maxRedirects) ||
            maxRedirects < 0
        ) {
            throw new RangeError(
                "HttpTransportConfiguration.maxRedirects must be a non-negative integer",
            );
        }

        const maxResponseBytes =
            props.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
        if (
            typeof maxResponseBytes !== "number" ||
            !Number.isInteger(maxResponseBytes) ||
            maxResponseBytes < 1
        ) {
            throw new RangeError(
                "HttpTransportConfiguration.maxResponseBytes must be a positive integer",
            );
        }

        /**
         * @readonly
         * @type {number}
         */
        this.connectTimeout = connectTimeout;

        /**
         * @readonly
         * @type {number}
         */
        this.maxRedirects = maxRedirects;

        /**
         * @readonly
         * @type {number}
         */
        this.maxResponseBytes = maxResponseBytes;

        /**
         * @readonly
         * @type {Readonly<Record<string, string>>}
         */
        this.defaultHeaders = freezeHeaders(
            normalizeRequestHeaders(props.defaultHeaders),
        );

        Object.freeze(this);
    }

    /**
     * @param {HttpTransportConfiguration | ConstructorParameters<typeof HttpTransportConfiguration>[0] | null | undefined} value
     * @returns {HttpTransportConfiguration}
     */
    static from(value) {
        return value instanceof HttpTransportConfiguration
            ? value
            : new HttpTransportConfiguration(value ?? {});
    }
}
