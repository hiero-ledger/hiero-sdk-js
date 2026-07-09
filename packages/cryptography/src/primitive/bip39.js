import { mnemonicToSeed } from "@scure/bip39";

/**
 * Derive a BIP-39 seed from a mnemonic phrase and optional passphrase.
 * @param {string[]} words
 * @param {string} passphrase
 * @returns {Promise<Uint8Array>}
 */
export function toSeed(words, passphrase) {
    return mnemonicToSeed(words.join(" "), passphrase);
}
