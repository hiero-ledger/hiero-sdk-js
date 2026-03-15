// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {{low: number, high: number, unsigned: boolean}} LongObject
 * @typedef {import("long")} Long
 */

/**
 * Convert a numeric value to bigint. Accepts Long, number, string, LongObject,
 * or BigNumber-like objects (duck-typed by presence of a `toFixed` method).
 *
 * @param {Long | number | string | LongObject | bigint | object} value
 * @returns {bigint}
 */
export function valueToLong(value) {
    if (typeof value === "bigint") {
        return value;
    }
    // Duck-type BigNumber-like objects (bignumber.js, etc.)
    if (
        typeof value === "object" &&
        value !== null &&
        typeof /** @type {any} */ (value).toFixed === "function"
    ) {
        return BigInt(/** @type {any} */ (value).toFixed());
    }
    return BigInt(value.toString());
}
