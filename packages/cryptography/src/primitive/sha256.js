import { sha256 } from "@noble/hashes/sha2";

/**
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function digest(data) {
    return sha256(data);
}
