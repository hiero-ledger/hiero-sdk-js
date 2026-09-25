// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("../http/HttpResponse.js").default} HttpResponse
 */

/**
 * Failures the mirror node REST adapter adds on top of the transport's
 * own. Internal: what reaches an application is each query's existing
 * error type carrying the message built here.
 *
 * @readonly
 * @enum {string}
 */
export const MirrorNodeHttpErrorCode = Object.freeze({
    /** A retryable status survived every attempt. */
    RETRIES_EXHAUSTED_ERROR: "retries-exhausted-error",
    /**
     * The call's total deadline elapsed, or a `Retry-After` exceeded the
     * time left in it. The clock running out is not a node failing
     * repeatedly, and a caller needs the difference to know whether to
     * raise `requestTimeout` or go and look at the node.
     */
    DEADLINE_EXCEEDED_ERROR: "deadline-exceeded-error",
    /** A path that could name a foreign host, or a malformed one. */
    INVALID_PATH_ERROR: "invalid-path-error",
});

/**
 * @internal
 */
export default class MirrorNodeHttpError extends Error {
    /**
     * @param {string} code - one of `MirrorNodeHttpErrorCode`
     * @param {string} message
     * @param {object} [options]
     * @param {?HttpResponse} [options.response] - the last response, when
     * the failure followed one
     * @param {unknown} [options.cause]
     */
    constructor(code, message, options = {}) {
        super(message, { cause: options.cause });

        this.name = "MirrorNodeHttpError";

        /**
         * @readonly
         * @type {string}
         */
        this.code = code;

        /**
         * @readonly
         * @type {?HttpResponse}
         */
        this.response = options.response ?? null;
    }

    /**
     * @param {unknown} error
     * @param {string} code
     * @returns {boolean}
     */
    static hasCode(error, code) {
        if (error instanceof MirrorNodeHttpError) {
            return error.code === code;
        }
        if (error == null || typeof error !== "object") {
            return false;
        }
        const candidate = /** @type {{name?: unknown, code?: unknown}} */ (
            error
        );
        return (
            candidate.name === "MirrorNodeHttpError" && candidate.code === code
        );
    }
}
