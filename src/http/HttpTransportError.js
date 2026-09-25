// SPDX-License-Identifier: Apache-2.0

/**
 * The seven ways a `roundTrip` can fail to obtain a response. The values
 * are stable across every Hiero SDK and are what a retry policy classifies
 * on. Only `connection-error` and `timeout-error` describe a condition that
 * repeating the exchange can fix.
 *
 * @readonly
 * @enum {string}
 */
export const HttpTransportErrorCode = Object.freeze({
    /** Connection refused, reset, or unreachable. Retryable. */
    CONNECTION_ERROR: "connection-error",
    /** The per-attempt deadline elapsed. Retryable. */
    TIMEOUT_ERROR: "timeout-error",
    /** The host name does not resolve. Not retryable. */
    UNKNOWN_HOST_ERROR: "unknown-host-error",
    /** Certificate verification or handshake failure. Not retryable. */
    TLS_ERROR: "tls-error",
    /** The transport was closed. Not retryable. */
    CLIENT_CLOSED_ERROR: "client-closed-error",
    /** The caller cancelled the call. Not retryable. */
    CANCELLED_ERROR: "cancelled-error",
    /** The body exceeded `maxResponseBytes`. Not retryable. */
    RESPONSE_TOO_LARGE_ERROR: "response-too-large-error",
});

/** @type {Set<string>} */
const RETRYABLE_CODES = new Set([
    HttpTransportErrorCode.CONNECTION_ERROR,
    HttpTransportErrorCode.TIMEOUT_ERROR,
]);

/** @type {Set<string>} */
const ALL_CODES = new Set(Object.values(HttpTransportErrorCode));

/**
 * A failure to obtain a response from an `HttpTransport`.
 *
 * A non-2xx status is not one of these: it is a successful exchange whose
 * `HttpResponse` carries the status. The SDK's own transports always
 * classify a failure into one of the `HttpTransportErrorCode` values. A
 * third-party transport should too, and may otherwise throw anything: a
 * failure the mirror node adapter does not recognise is treated as
 * non-retryable, so a badly wrapped proxy surfaces after one attempt
 * instead of burning the whole budget.
 */
export default class HttpTransportError extends Error {
    /**
     * @param {string} code - one of `HttpTransportErrorCode`
     * @param {string} message
     * @param {object} [options]
     * @param {unknown} [options.cause] - the native failure this classifies
     */
    constructor(code, message, options = {}) {
        if (!ALL_CODES.has(code)) {
            throw new TypeError(`unknown HttpTransportErrorCode: ${code}`);
        }

        super(`${code}: ${message}`, options);

        this.name = "HttpTransportError";

        /**
         * @readonly
         * @type {string}
         */
        this.code = code;
    }

    /**
     * Whether repeating the exchange can help.
     *
     * @returns {boolean}
     */
    get retryable() {
        return RETRYABLE_CODES.has(this.code);
    }

    /**
     * Whether `value` is an `HttpTransportError`, by shape rather than by
     * `instanceof`: a third-party transport may hold a second copy of this
     * class (the CommonJS build next to the ESM one), and its errors must
     * still be classified.
     *
     * @param {unknown} value
     * @returns {value is HttpTransportError}
     */
    static isHttpTransportError(value) {
        if (value instanceof HttpTransportError) {
            return true;
        }
        if (value == null || typeof value !== "object") {
            return false;
        }
        const candidate = /** @type {{name?: unknown, code?: unknown}} */ (
            value
        );
        return (
            candidate.name === "HttpTransportError" &&
            typeof candidate.code === "string" &&
            ALL_CODES.has(candidate.code)
        );
    }

    /**
     * `true` only for an `HttpTransportError` whose code is retryable. Any
     * other value, including an unrecognised failure from a third-party
     * transport, is not retried.
     *
     * @param {unknown} error
     * @returns {boolean}
     */
    static isRetryable(error) {
        return (
            HttpTransportError.isHttpTransportError(error) &&
            RETRYABLE_CODES.has(error.code)
        );
    }

    /**
     * @param {unknown} error
     * @param {string} code
     * @returns {boolean}
     */
    static hasCode(error, code) {
        return (
            HttpTransportError.isHttpTransportError(error) &&
            error.code === code
        );
    }
}
