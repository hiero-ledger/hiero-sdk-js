import { HashAlgorithm } from "./hmac.js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2";
import { sha256, sha384, sha512 } from "@noble/hashes/sha2";
import * as utf8 from "../encoding/utf8.js";

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
 * @param {Uint8Array | string} password
 * @param {Uint8Array | string} salt
 * @param {number} iterations
 * @param {number} length
 * @returns {Promise<Uint8Array>}
 */
export function deriveKey(algorithm, password, salt, iterations, length) {
    const pass =
        typeof password === "string"
            ? // Valid ASCII is also valid UTF-8 so encoding the password as UTF-8
              // should be fine if only valid ASCII characters are used in the password
              utf8.encode(password)
            : password;

    const saltBytes = typeof salt === "string" ? utf8.encode(salt) : salt;

    return pbkdf2Async(hasher(algorithm), pass, saltBytes, {
        c: iterations,
        dkLen: length,
    });
}
