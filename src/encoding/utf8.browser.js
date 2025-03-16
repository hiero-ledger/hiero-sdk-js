// SPDX-License-Identifier: Apache-2.0

/**
 * @param {Uint8Array} data
 * @returns {string}
 */
export function decode(data) {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    return new TextDecoder().decode(data);
}

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function encode(text) {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    return new TextEncoder().encode(text);
}
