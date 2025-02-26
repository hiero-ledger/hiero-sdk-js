import CryptoJS from "crypto-js";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";
import SparkMD5 from "spark-md5";
import { Buffer } from "buffer";

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
    let mode;

    switch (algorithm.toUpperCase()) {
        case CipherAlgorithm.Aes128Cbc:
            mode = CryptoJS.mode.CBC;
            break;

        case CipherAlgorithm.Aes128Ctr:
            mode = CryptoJS.mode.CTR;
            break;

        default:
            throw new Error("(BUG) non-exhaustive switch statement");
    }

    const data_ = CryptoJS.enc.Hex.parse(hex.encode(data));
    const key_ = CryptoJS.enc.Hex.parse(hex.encode(key.slice(0, 16)));
    const cfg_ = { iv: CryptoJS.enc.Hex.parse(hex.encode(iv)), mode };

    return Promise.resolve(
        hex.decode(
            CryptoJS.AES.encrypt(data_, key_, cfg_).toString(
                CryptoJS.format.Hex,
            ),
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
export function createDecipheriv(algorithm, key, iv, data) {
    let mode;
    switch (algorithm) {
        case CipherAlgorithm.Aes128Cbc:
            mode = CryptoJS.mode.CBC;
            break;

        case CipherAlgorithm.Aes128Ctr:
            mode = CryptoJS.mode.CTR;
            break;

        default:
            throw new Error("(BUG) non-exhaustive switch statement");
    }

    const key_ = CryptoJS.enc.Hex.parse(hex.encode(key.slice(0, 16)));
    const iv_ = CryptoJS.enc.Hex.parse(hex.encode(iv));

    const params = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(hex.encode(data)),
        iv: iv_,
        key: key_,
        algorithm: CryptoJS.algo.AES,
        blockSize: 4,
    });

    return Promise.resolve(
        hex.decode(
            CryptoJS.AES.decrypt(params, key_, { iv: iv_, mode }).toString(
                CryptoJS.enc.Hex,
            ),
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
