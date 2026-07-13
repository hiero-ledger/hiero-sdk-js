import { cbc, ctr } from "@noble/ciphers/aes";
import { md5 } from "@noble/hashes/legacy";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";

export const CipherAlgorithm = {
    Aes128Ctr: "AES-128-CTR",
    Aes128Cbc: "AES-128-CBC",
};

/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @returns {import("@noble/ciphers/utils").Cipher}
 */
function cipher(algorithm, key, iv) {
    // AES-128: only the first 16 bytes of the key material are used
    const key_ = key.slice(0, 16);

    switch (algorithm.toUpperCase()) {
        case CipherAlgorithm.Aes128Ctr:
            return ctr(key_, iv);
        case CipherAlgorithm.Aes128Cbc:
            return cbc(key_, iv);
        default:
            throw new Error(
                "(BUG) non-exhaustive switch statement for CipherAlgorithm",
            );
    }
}

/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function createCipheriv(algorithm, key, iv, data) {
    return Promise.resolve(cipher(algorithm, key, iv).encrypt(data));
}

/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function createDecipheriv(algorithm, key, iv, data) {
    return Promise.resolve(cipher(algorithm, key, iv).decrypt(data));
}

/**
 * Derive an AES key from a passphrase and IV using the OpenSSL-style
 * `MD5(passphrase || iv[0:8])` construction (used by legacy encrypted PEM keys).
 * @param {string} passphrase
 * @param {string} iv
 * @returns {Promise<Uint8Array>}
 */
export function messageDigest(passphrase, iv) {
    const pass = utf8.encode(passphrase);
    const sliced = hex.decode(iv).slice(0, 8);

    const input = new Uint8Array(pass.length + sliced.length);
    input.set(pass, 0);
    input.set(sliced, pass.length);

    return Promise.resolve(md5(input));
}
