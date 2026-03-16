import { secp256k1 } from "@noble/curves/secp256k1.js";
import { equalBytes } from "./utils.js";

/**
 * @typedef {import("../EcdsaPrivateKey.js").KeyPair} KeyPair
 */

/**
 * @returns {KeyPair}
 */
export function generate() {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    return {
        privateKey,
        publicKey,
    };
}

/**
 * @returns {Promise<KeyPair>}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateAsync() {
    return Promise.resolve(generate());
}

/**
 * @param {Uint8Array} data
 * @returns {KeyPair}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fromBytes(data) {
    const privateKey = new Uint8Array(data);
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    return {
        privateKey: privateKey,
        publicKey: publicKey,
    };
}

/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getFullPublicKey(data) {
    return secp256k1.getPublicKey(data, false);
}

/**
 * @param {Uint8Array} keydata
 * @param {Uint8Array} message
 * @returns {Uint8Array}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sign(keydata, message) {
    return secp256k1.sign(message, keydata);
}

/**
 * @param {Uint8Array} keydata
 * @param {Uint8Array} message
 * @param {Uint8Array} signature
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function verify(keydata, message, signature) {
    return secp256k1.verify(signature, message, keydata);
}

/**
 * @param {Uint8Array} privateKey
 * @param {Uint8Array} signature - 64-byte compact signature (r || s)
 * @param {Uint8Array} message - Original message (not hashed)
 * @returns {number} Recovery ID (0–3), or -1
 */
export function getRecoveryId(privateKey, signature, message) {
    const expectedPubKey = secp256k1.getPublicKey(privateKey, true);

    for (let recovery = 0; recovery < 4; recovery++) {
        try {
            // Construct 65-byte recovered signature: [recovery_bit, ...r_32, ...s_32]
            const recoveredSig = new Uint8Array(65);
            recoveredSig[0] = recovery;
            recoveredSig.set(signature, 1);

            // secp256k1.recoverPublicKey handles SHA-256 hashing internally
            const recoveredPubKey = secp256k1.recoverPublicKey(
                recoveredSig,
                message,
            );

            if (equalBytes(recoveredPubKey, expectedPubKey)) {
                return recovery;
            }
        } catch {
            // Ignore invalid recoveries
        }
    }

    throw new Error("Unexpected error: could not construct a recoverable key.");
}
