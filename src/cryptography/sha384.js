import { hash } from "@exodus/crypto/hash";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function digest(data) {
    return hash('sha384', data, 'uint8')
}
