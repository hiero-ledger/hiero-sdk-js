import { keccak256 } from "./keccak.js";
import * as hex from "../encoding/hex.js";
import elliptic from "elliptic";

const secp256k1 = new elliptic.ec("secp256k1");

/**
 * @typedef {import("../EcdsaPrivateKey.js").KeyPair} KeyPair
 */

/**
 * @returns {KeyPair}
 */
export function generate() {
    const keypair = secp256k1.genKeyPair();

    return {
        privateKey: hex.decode(keypair.getPrivate("hex")),
        publicKey: hex.decode(keypair.getPublic(true, "hex")),
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
    const keypair = secp256k1.keyFromPrivate(data);

    return {
        privateKey: hex.decode(keypair.getPrivate("hex")),
        publicKey: hex.decode(keypair.getPublic(true, "hex")),
    };
}

/**
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getFullPublicKey(data) {
    const keypair = secp256k1.keyFromPublic(data);

    return hex.decode(keypair.getPublic(false, "hex"));
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
    const keypair = secp256k1.keyFromPrivate(keydata);
    const signature = keypair.sign(data, {
        // the elliptic library generates a non-normalized s value by-default
        // this seems to be legacy behavior that they are loathe to change 
        // as its pretty silent if someone was depending on it
        // most every other client I can normalizes the s value, passing `true`
        // here will return a normalized s value
        canonical: true,
    });

    const r = signature.r.toArray("be", 32);
    const s = signature.s.toArray("be", 32);

    const result = new Uint8Array(64);
    result.set(r, 0);
    result.set(s, 32);
    return result;
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
    const keypair = secp256k1.keyFromPublic(keydata);

    return keypair.verify(data, {
        r: signature.subarray(0, 32),
        s: signature.subarray(32, 64),
    });
}
