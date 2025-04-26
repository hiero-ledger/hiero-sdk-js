import { randomBytes } from "@exodus/crypto/randomBytes";

/**
 * @param {number} count
 * @returns {Uint8Array}
 */
export function bytes(count) {
    const buf = randomBytes(count)
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length)
}

/**
 * @param {number} count
 * @returns {Promise<Uint8Array>}
 */
export function bytesAsync(count) {
    return Promise.resolve(bytes(count));
}
