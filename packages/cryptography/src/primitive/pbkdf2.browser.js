import * as utf8 from "../encoding/utf8.js";

// this will be executed in browser environment so we can use window.crypto
/* eslint-disable n/no-unsupported-features/node-builtins */

/**
 * @typedef {import("./hmac.js").HashAlgorithm} HashAlgorithm
 */

/**
 * @param {HashAlgorithm} algorithm
 * @param {Uint8Array | string} password
 * @param {Uint8Array | string} salt
 * @param {number} iterations
 * @param {number} length
 * @returns {Promise<Uint8Array>}
 */
export async function deriveKey(algorithm, password, salt, iterations, length) {
    const pass =
        typeof password === "string"
            ? // Valid ASCII is also valid UTF-8 so encoding the password as UTF-8
              // should be fine if only valid ASCII characters are used in the password
              utf8.encode(password)
            : password;

    const nacl = typeof salt === "string" ? utf8.encode(salt) : salt;

    try {
        const key = await window.crypto.subtle.importKey(
            "raw",
            pass,
            {
                name: "PBKDF2",
                hash: algorithm,
            },
            false,
            ["deriveBits"],
        );

        return new Uint8Array(
            await window.crypto.subtle.deriveBits(
                {
                    name: "PBKDF2",
                    hash: algorithm,
                    salt: nacl,
                    iterations,
                },
                key,
                length << 3,
            ),
        );
    } catch {
        throw new Error("(BUG) Non-Exhaustive switch statement for algorithms");
    }
}
