// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HttpStatus from "./HttpStatus.js";

/**
 * Describes how the http request failed.
 */
export default class HttpError extends Error {
    /**
     * @param {HttpStatus} status
     */
    constructor(status) {
        super(`failed with error code: ${status.toString()}`);

        /**
         * @readonly
         */
        this.status = status;

        this.name = "HttpError";

        if (typeof Error.captureStackTrace !== "undefined") {
            Error.captureStackTrace(this, HttpError);
        }
    }
}
