import * as utf8 from "../encoding/utf8.js";

// this will be executed in browser environment so we can use window.crypto
/* eslint-disable n/no-unsupported-features/node-builtins */

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
 * @param {Uint8Array | string} secretKey
 * @param {Uint8Array | string} data
 * @returns {Promise<Uint8Array>}
 */
export async function hash(algorithm, secretKey, data) {
    const key =
        typeof secretKey === "string" ? utf8.encode(secretKey) : secretKey;
    const value = typeof data === "string" ? utf8.encode(data) : data;

    try {
        const key_ = await window.crypto.subtle.importKey(
            "raw",
            key,
            {
                name: "HMAC",
                hash: algorithm,
            },
            false,
            ["sign"],
        );

        return new Uint8Array(
            await window.crypto.subtle.sign("HMAC", key_, value),
        );
    } catch {
        throw new Error("Fallback if SubtleCrypto fails is not implemented");
    }
}
