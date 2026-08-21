// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./Status.js").default} Status
 * @typedef {import("./transaction/TransactionId.js").default} TransactionId
 */

/**
 * @typedef {object} StatusErrorJSON
 * @property {string} name
 * @property {string} status
 * @property {string} transactionId
 * @property {string} message
 */

export default class StatusError extends Error {
    /**
     * @param {object} props
     * @param {Status} props.status
     * @param {TransactionId} props.transactionId
     * @param {string} message
     */
    constructor(props, message) {
        super(message);

        this.name = "StatusError";

        this.status = props.status;

        this.transactionId = props.transactionId;

        this.message = message;

        if (typeof Error.captureStackTrace !== "undefined") {
            Error.captureStackTrace(this, StatusError);
        }
    }

    /**
     * @returns {StatusErrorJSON}
     */
    toJSON() {
        return {
            name: this.name,
            status: this.status.toString(),
            transactionId: this.transactionId.toString(),
            message: this.message,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @returns {StatusErrorJSON}
     */
    valueOf() {
        return this.toJSON();
    }
}
