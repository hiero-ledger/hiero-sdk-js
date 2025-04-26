import { HashAlgorithm } from "./hmac.js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2";
import { sha256, sha384, sha512 } from "@noble/hashes/sha2";

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
            return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: length });
        case HashAlgorithm.Sha384:
            return pbkdf2Async(sha384, password, salt, { c: iterations, dkLen: length });
        case HashAlgorithm.Sha512:
            return pbkdf2Async(sha512, password, salt, { c: iterations, dkLen: length });
        default:
            throw new Error(
                "(BUG) Non-Exhaustive switch statement for algorithms"
            );
    }
}
