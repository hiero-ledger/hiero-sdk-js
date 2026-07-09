import * as hmac from "./hmac.js";
import * as pbkdf2 from "./pbkdf2.js";

/**
 * Derive a BIP-39 seed from a mnemonic phrase and optional passphrase.
 *
 * Intentionally not `@scure/bip39`'s `mnemonicToSeed`: that normalizes the
 * phrase through a validator which rejects any word count outside
 * {12, 15, 18, 21, 24}. Hedera also supports 22-word legacy mnemonics, which
 * reach here via `Mnemonic.toSeed()` and `toStandardEd25519PrivateKey()`.
 * The PBKDF2 below is the BIP-39 KDF itself, and `pbkdf2.js` is already
 * backed by @noble/hashes.
 * @param {string[]} words
 * @param {string} passphrase
 * @returns {Promise<Uint8Array>}
 */
export function toSeed(words, passphrase) {
    const input = words.join(" ");
    const salt = `mnemonic${passphrase}`.normalize("NFKD");

    return pbkdf2.deriveKey(hmac.HashAlgorithm.Sha512, input, salt, 2048, 64);
}
