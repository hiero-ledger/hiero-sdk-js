// SPDX-License-Identifier: Apache-2.0

import BigNumber from "bignumber.js";

/** @typedef {{low: number, high: number, unsigned: boolean}} LongObject */
// @ts-ignore -- `long` v5 uses `export =`; keep `.default` so declaration
// emission produces the Long value type. Tracked in #4373.
/** @typedef {import("long").default} Long */

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
