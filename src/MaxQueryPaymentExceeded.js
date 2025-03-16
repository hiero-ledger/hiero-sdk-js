// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./Hbar.js").default} Hbar
 */

/**
 * Error thrown when a query's cost exceeds the maximum payment amount set on the client.
 *
 * This error is used to prevent unexpectedly expensive queries from being automatically executed.
 * When this error occurs, the user can either:
 * 1. Increase the maximum query payment on the client
 * 2. Explicitly approve the higher cost for this specific query
 */
export default class MaxQueryPaymentExceeded extends Error {
    /**
     * @param {Hbar} queryCost
     * @param {Hbar} maxQueryPayment
     */
    constructor(queryCost, maxQueryPayment) {
        super();

        this.message = `query cost of ${queryCost.toString()} HBAR exceeds max set on client: ${maxQueryPayment.toString()} HBAR`;
        this.name = "MaxQueryPaymentExceededError";
        this.queryCost = queryCost;
        this.maxQueryPayment = maxQueryPayment;
    }
}
