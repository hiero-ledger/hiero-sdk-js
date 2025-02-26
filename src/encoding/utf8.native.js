// SPDX-License-Identifier: Apache-2.0

import utf8 from "utf8";
import * as hex from "./hex.native.js";

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export function decode(data) {
    return utf8.decode(hex.encodeToByteString(data));
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function encode(text) {
    return hex.decodeFromByteString(utf8.encode(text));
}
