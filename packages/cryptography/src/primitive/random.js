import { randomBytes } from "@noble/hashes/utils";

/**
 * @param {number} count
 * @returns {Uint8Array}
 */
export function bytes(count) {
    return randomBytes(count);
}

/**
 * @param {number} count
 * @returns {Promise<Uint8Array>}
 */
export function bytesAsync(count) {
    return Promise.resolve(randomBytes(count));
}
