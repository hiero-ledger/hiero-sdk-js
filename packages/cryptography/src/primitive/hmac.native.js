import createHmac from "create-hmac";
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
 * @param {Uint8Array | string} secretKey
 * @param {Uint8Array | string} data
 * @returns {Promise<Uint8Array>}
 */
export function hash(algorithm, secretKey, data) {
    const key0 =
        typeof secretKey === "string" ? utf8.encode(secretKey) : secretKey;
    const value = typeof data === "string" ? utf8.encode(data) : data;
    const key = Buffer.from(key0);

    switch (algorithm) {
        case HashAlgorithm.Sha256:
            return Promise.resolve(
                createHmac("sha256", key).update(value).digest()
            );
        case HashAlgorithm.Sha384:
            return Promise.resolve(
                createHmac("sha384", key).update(value).digest()
            );
        case HashAlgorithm.Sha512:
            return Promise.resolve(
                createHmac("sha512", key).update(value).digest()
            );
        default:
            throw new Error(
                "(BUG) Non-Exhaustive switch statement for algorithms"
            );
    }
}
