import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";
import SparkMD5 from "spark-md5";
import { Buffer } from "buffer";

// this will be executed in browser environment so we can use window.crypto
/* eslint-disable n/no-unsupported-features/node-builtins */

export const CipherAlgorithm = {
    Aes128Ctr: "AES-128-CTR",
    Aes128Cbc: "AES-128-CBC",
};

/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export async function createCipheriv(algorithm, key, iv, data) {
    let algorithm_;

    switch (algorithm.toUpperCase()) {
        case CipherAlgorithm.Aes128Ctr:
            algorithm_ = {
                name: "AES-CTR",
                counter: iv,
                length: 128,
            };
            break;
        case CipherAlgorithm.Aes128Cbc:
            algorithm_ = {
                name: "AES-CBC",
                iv: iv,
            };
            break;
        default:
            throw new Error(
                "(BUG) non-exhaustive switch statement for CipherAlgorithm",
            );
    }

    const key_ = await window.crypto.subtle.importKey(
        "raw",
        key,
        algorithm_.name,
        false,
        ["encrypt"],
    );

    return new Uint8Array(
        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#return_value
        /** @type {ArrayBuffer} */ (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            await window.crypto.subtle.encrypt(algorithm_, key_, data)
        ),
    );
}

/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export async function createDecipheriv(algorithm, key, iv, data) {
    let algorithm_;

    switch (algorithm.toUpperCase()) {
        case CipherAlgorithm.Aes128Ctr:
            algorithm_ = {
                name: "AES-CTR",
                counter: iv,
                length: 128,
            };
            break;
        case CipherAlgorithm.Aes128Cbc:
            algorithm_ = {
                name: "AES-CBC",
                iv,
            };
            break;
        default:
            throw new Error(
                "(BUG) non-exhaustive switch statement for CipherAlgorithm",
            );
    }

    const key_ = await window.crypto.subtle.importKey(
        "raw",
        key,
        algorithm_.name,
        false,
        ["decrypt"],
    );
    let decrypted;
    try {
        decrypted = await window.crypto.subtle.decrypt(algorithm_, key_, data);
    } catch (error) {
        const message =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            error != null && /** @type {Error} */ (error).message != null
                ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  /** @type {Error} */ (error).message
                : "";

        throw new Error(`Unable to decrypt: ${message}`);
    }
    return new Uint8Array(
        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#return_value
        /** @type {ArrayBuffer} */ (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            decrypted
        ),
    );
}

/**
 * @param {string} passphrase
 * @param {string} iv
 * @returns {Promise<Uint8Array>}
 */
export async function messageDigest(passphrase, iv) {
    const pass = utf8.encode(passphrase);
    const sliced = hex.decode(iv).slice(0, 8);
    const result = SparkMD5.ArrayBuffer.hash(
        // @ts-ignore
        Buffer.concat([Buffer.from(pass), Buffer.from(sliced)]),
    );

    return Promise.resolve(hex.decode(result));
}
