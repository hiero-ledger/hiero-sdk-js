// SPDX-License-Identifier: Apache-2.0
/**
 * @typedef {object} MaxAttemptsOrTimeoutErrorJSON
 * @property {string} message
 * @property {string} nodeAccountId
 *
 */

export default class MaxAttemptsOrTimeoutError extends Error {
    /**
     * @param {string} message
     * @param {string} nodeAccountId
     */
    constructor(message, nodeAccountId) {
        // Call the Error constructor with the message
        super(message);

        // Assign the nodeAccountId as a custom property
        this.nodeAccountId = nodeAccountId;
    }

    toJSON() {
        return {
            message: this.message,
            nodeAccountId: this.nodeAccountId,
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @returns {MaxAttemptsOrTimeoutErrorJSON}
     */
    valueOf() {
        return this.toJSON();
    }
}
