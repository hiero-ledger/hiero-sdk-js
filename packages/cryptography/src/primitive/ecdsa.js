import { keccak256 } from "./keccak.js";
import * as hex from "../encoding/hex.js";
import { secp256k1 } from "@noble/curves/secp256k1";
import { equalBytes } from "./utils.js";

/**
 * @typedef {import("../EcdsaPrivateKey.js").KeyPair} KeyPair
 */

/**
 * @returns {KeyPair}
 */
export function generate() {
    const privateKey = secp256k1.utils.randomPrivateKey();
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
    const msg = hex.encode(message);
    const data = hex.decode(keccak256(`0x${msg}`));
    const signature = secp256k1.sign(data, keydata);

    return signature.toCompactRawBytes();
}

/**
 * @param {Uint8Array} keydata
 * @param {Uint8Array} message
 * @param {Uint8Array} signature
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function verify(keydata, message, signature) {
    const msg = hex.encode(message);
    const data = hex.decode(keccak256(`0x${msg}`));

    const r = BigInt("0x" + hex.encode(signature.subarray(0, 32)));
    const s = BigInt("0x" + hex.encode(signature.subarray(32, 64)));

    return secp256k1.verify({ r, s }, data, keydata);
}

/**
 * @param {Uint8Array} privateKey
 * @param {Uint8Array} signature - 64-byte compact signature (r || s)
 * @param {Uint8Array} message - Original message (not hashed)
 * @returns {number} Recovery ID (0–3), or -1
 */
export function getRecoveryId(privateKey, signature, message) {
    const expectedPubKey = secp256k1.getPublicKey(privateKey, false);
    const hash = hex.decode(keccak256(`0x${hex.encode(message)}`));

    for (let recovery = 0; recovery < 4; recovery++) {
        try {
            const sig =
                secp256k1.Signature.fromCompact(signature).addRecoveryBit(
                    recovery,
                );

            const recovered = sig.recoverPublicKey(hash).toRawBytes(false);

            if (equalBytes(recovered, expectedPubKey)) {
                return recovery;
            }
        } catch {
            // Ignore invalid recoveries
        }
    }

    throw new Error("Unexpected error: could not construct a recoverable key.");
}
