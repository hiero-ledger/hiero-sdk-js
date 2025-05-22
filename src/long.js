// SPDX-License-Identifier: Apache-2.0

import { BigNumber } from "bignumber.js";

/**
 * @typedef {import("long").default} Long
 */

/**
 * @param {Long | number | string | BigNumber} value
 * @returns {BigNumber}
 */
export function valueToLong(value) {
    if (BigNumber.isBigNumber(value)) {
        return value;
    } else {
        return new BigNumber(value.toString());
    }
}
