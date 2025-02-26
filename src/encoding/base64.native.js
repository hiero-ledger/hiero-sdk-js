// SPDX-License-Identifier: Apache-2.0

import { atob, btoa } from "js-base64";

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function decode(text) {
    return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}

/**
 * @param {Uint8Array} data
 * @returns {string};
 */
export function encode(data) {
    return btoa(String.fromCharCode.apply(null, Array.from(data)));
}
