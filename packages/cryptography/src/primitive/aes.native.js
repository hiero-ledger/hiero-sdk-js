import crypto from "browserify-aes";
import "./crypto-types.d.ts";

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
export function createCipheriv(algorithm, key, iv, data) {
    const cipher = crypto.createCipheriv(algorithm, key.slice(0, 16), iv);

    return Promise.resolve(
        Buffer.concat([cipher.update(data), cipher["final"]()])
    );
}

/**
 * @param {string} algorithm
 * @param {Uint8Array} key
 * @param {Uint8Array} iv
 * @param {Uint8Array} data
 * @returns {Promise<Uint8Array>}
 */
export function createDecipheriv(algorithm, key, iv, data) {
    const decipher = crypto.createDecipheriv(algorithm, key.slice(0, 16), iv);

    return Promise.resolve(
        Buffer.concat([decipher.update(data), decipher["final"]()])
    );
}
