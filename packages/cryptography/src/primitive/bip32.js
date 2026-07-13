import { HDKey } from "@scure/bip32";

const HARDENED_BIT = 0x80000000;

/**
 * Derive a child secp256k1 key from a parent key + chain code (BIP-32 CKD).
 * @param {Uint8Array} parentKey
 * @param {Uint8Array} chainCode
 * @param {number} index
 * @returns {Promise<{ keyData: Uint8Array; chainCode: Uint8Array }>}
 */
export function derive(parentKey, chainCode, index) {
    const hdkey = new HDKey({ privateKey: parentKey, chainCode });

    // `index` may carry the hardened bit as a signed 32-bit value (e.g. from
    // `index | 0x80000000`); coerce to unsigned so @scure detects hardened
    // derivation the same way the previous implementation did via
    // `index & 0x80000000`.
    const child = hdkey.deriveChild(index >>> 0);

    return Promise.resolve({
        keyData: /** @type {Uint8Array} */ (child.privateKey),
        chainCode: /** @type {Uint8Array} */ (child.chainCode),
    });
}

/**
 * @param {Uint8Array} seed
 * @returns {Promise<{ keyData: Uint8Array; chainCode: Uint8Array }>}
 */
export function fromSeed(seed) {
    if (seed.length < 16)
        throw new TypeError("Seed should be at least 128 bits");
    if (seed.length > 64)
        throw new TypeError("Seed should be at most 512 bits");

    const hdkey = HDKey.fromMasterSeed(seed);

    return Promise.resolve({
        keyData: /** @type {Uint8Array} */ (hdkey.privateKey),
        chainCode: /** @type {Uint8Array} */ (hdkey.chainCode),
    });
}

/**
 * Harden the index
 * @param {number} index         the derivation index
 * @returns {number}              the hardened index
 */
export function toHardenedIndex(index) {
    return index | HARDENED_BIT;
}

/**
 * Check if the index is hardened
 * @param {number} index         the derivation index
 * @returns {boolean}            true if the index is hardened
 */
export function isHardenedIndex(index) {
    return (index & HARDENED_BIT) !== 0;
}
