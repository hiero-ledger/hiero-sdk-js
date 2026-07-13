import { hmac } from "@noble/hashes/hmac";
import { sha256, sha384, sha512 } from "@noble/hashes/sha2";
import * as utf8 from "../encoding/utf8.js";

/**
 * @enum {string}
 */
export const HashAlgorithm = {
    Sha256: "SHA-256",
    Sha384: "SHA-384",
    Sha512: "SHA-512",
};

/**
 * @param {HashAlgorithm} algorithm
 * @returns {typeof sha256}
 */
function hasher(algorithm) {
    switch (algorithm) {
        case HashAlgorithm.Sha256:
            return sha256;
        case HashAlgorithm.Sha384:
            return sha384;
        case HashAlgorithm.Sha512:
            return sha512;
        default:
            throw new Error(
                "(BUG) Non-Exhaustive switch statement for algorithms",
            );
    }
}

/**
 * @param {HashAlgorithm} algorithm
 * @param {Uint8Array | string} secretKey
 * @param {Uint8Array | string} data
 * @returns {Promise<Uint8Array>}
 */
export function hash(algorithm, secretKey, data) {
    const key =
        typeof secretKey === "string" ? utf8.encode(secretKey) : secretKey;
    const value = typeof data === "string" ? utf8.encode(data) : data;

    return Promise.resolve(hmac(hasher(algorithm), key, value));
}
