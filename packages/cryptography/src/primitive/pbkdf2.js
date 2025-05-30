import { HashAlgorithm } from "./hmac.js";
import { pbkdf2 } from "@exodus/crypto/pbkdf2";

/**
 * @param {HashAlgorithm} algorithm
 * @param {Uint8Array | string} password
 * @param {Uint8Array | string} salt
 * @param {number} iterations
 * @param {number} length
 * @returns {Promise<Uint8Array>}
 */
export async function deriveKey(algorithm, password, salt, iterations, length) {
    switch (algorithm) {
        case HashAlgorithm.Sha256:
            return pbkdf2('sha256', password, salt, { iterations, dkLen: length }, 'uint8')
        case HashAlgorithm.Sha384:
            return pbkdf2('sha384', password, salt, { iterations, dkLen: length }, 'uint8')
        case HashAlgorithm.Sha512:
            return pbkdf2('sha512', password, salt, { iterations, dkLen: length }, 'uint8')
        default:
            throw new Error(
                "(BUG) Non-Exhaustive switch statement for algorithms"
            );
    }
}
