import { hmac } from "@exodus/crypto/hmac";

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
    switch (algorithm) {
        case HashAlgorithm.Sha256:
            return hmac('sha256', secretKey, data, 'uint8')
        case HashAlgorithm.Sha384:
            return hmac('sha384', secretKey, data, 'uint8')
        case HashAlgorithm.Sha512:
            return hmac('sha512', secretKey, data, 'uint8')
        default:
            throw new Error(
                "(BUG) Non-Exhaustive switch statement for algorithms"
            );
    }
}
