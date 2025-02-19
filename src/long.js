// SPDX-License-Identifier: Apache-2.0

import BigNumber from "bignumber.js";

/**
 * @typedef {{low: number, high: number, unsigned: boolean}} LongObject
 * @typedef {import("long")} Long
 */

/**
 * @param {Long | number | string | LongObject | BigNumber} value
 * @returns {BigNumber}
 */
export function valueToLong(value) {
    if (BigNumber.isBigNumber(value)) {
        return value;
    } else {
        return new BigNumber(value.toString());
    }
}
