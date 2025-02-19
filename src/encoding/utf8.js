// SPDX-License-Identifier: Apache-2.0

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export function decode(data) {
    return Buffer.from(data).toString("utf8");
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function encode(text) {
    return Buffer.from(text, "utf8");
}
