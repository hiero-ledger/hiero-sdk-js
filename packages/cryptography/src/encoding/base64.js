import { base64 } from "@scure/base";

/**
 * @param {string} text
 * @returns {Uint8Array}
 */
export function decode(text) {
    return base64.decode(text);
}

/**
 * @param {Uint8Array} data
 * @returns {string};
 */
export function encode(data) {
    return base64.encode(data);
}
