// SPDX-License-Identifier: Apache-2.0

import { Mnemonic as MnemonicCryptography } from "@hashgraph/cryptography";
import CACHE from "./Cache.js";

/**
 * @typedef {import("./PrivateKey.js").default} PrivateKey
 */

const HARDENED_BIT = 0x80000000;

/**
 * Multi-word mnemonic phrase (BIP-39).
 *
 * Compatible with the official Hiero mobile
 * wallets (24-words or 22-words) and BRD (12-words).
 */
export default class Mnemonic {
    /**
     * @param {MnemonicCryptography} mnemonic
     * @hideconstructor
     * @private
     */
    constructor(mnemonic) {
        this._mnemonic = mnemonic;
    }

    /**
     * Returns a new random 24-word mnemonic from the BIP-39
     * standard English word list.
     *
     * @returns {Promise<Mnemonic>}
     */
    static async generate() {
        return new Mnemonic(await MnemonicCryptography._generate(24));
    }

    /**
     * Returns a new random 12-word mnemonic from the BIP-39
     * standard English word list.
     *
     * @returns {Promise<Mnemonic>}
     */
    static async generate12() {
        return new Mnemonic(await MnemonicCryptography._generate(12));
    }

    /**
     * Construct a mnemonic from a list of words. Handles 12, 22 (legacy), and 24 words.
     *
     * An exception of BadMnemonicError will be thrown if the mnemonic
     * contains unknown words or fails the checksum. An invalid mnemonic
     * can still be used to create private keys, the exception will
     * contain the failing mnemonic in case you wish to ignore the
     * validation error and continue.
     *
     * @param {string[]} words
     * @throws {cryptography.BadMnemonicError}
     * @returns {Promise<Mnemonic>}
     */
    static async fromWords(words) {
        return new Mnemonic(await MnemonicCryptography.fromWords(words));
    }

    /**
     * @deprecated - Use `toStandardEd25519PrivateKey()` or `toStandardECDSAsecp256k1PrivateKey()` instead
     * Recover a private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    async toPrivateKey(passphrase = "") {
        return CACHE.privateKeyConstructor(
            // eslint-disable-next-line deprecation/deprecation
            await this._mnemonic.toPrivateKey(passphrase),
        );
    }

    /**
     * @deprecated - Use `toStandardEd25519PrivateKey()` or `toStandardECDSAsecp256k1PrivateKey()` instead
     * Recover an Ed25519 private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @param {number[]} [path]
     * @returns {Promise<PrivateKey>}
     */
    async toEd25519PrivateKey(passphrase = "", path) {
        return CACHE.privateKeyConstructor(
            // eslint-disable-next-line deprecation/deprecation
            await this._mnemonic.toEd25519PrivateKey(passphrase, path),
        );
    }

    /**
     * Recover an Ed25519 private key from this mnemonic phrase, with an
     * optional passphrase.
     *
     * @param {string} [passphrase]
     * @param {number} [index]
     * @returns {Promise<PrivateKey>}
     */
    async toStandardEd25519PrivateKey(passphrase = "", index) {
        return CACHE.privateKeyConstructor(
            await this._mnemonic.toStandardEd25519PrivateKey(passphrase, index),
        );
    }

    /**
     * @deprecated - Use `toStandardEd25519PrivateKey()` or `toStandardECDSAsecp256k1PrivateKey()` instead
     * Recover an ECDSA private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @param {number[]} [path]
     * @returns {Promise<PrivateKey>}
     */
    async toEcdsaPrivateKey(passphrase = "", path) {
        return CACHE.privateKeyConstructor(
            // eslint-disable-next-line deprecation/deprecation
            await this._mnemonic.toEcdsaPrivateKey(passphrase, path),
        );
    }

    /**
     * Converts a derivation path from string to an array of integers.
     * Note that this expects precisely 5 components in the derivation path,
     * as per BIP-44:
     * `m / purpose' / coin_type' / account' / change / address_index`
     * Takes into account `'` for hardening as per BIP-32,
     * and does not prescribe which components should be hardened.
     *
     * @param {string} derivationPath    the derivation path in BIP-44 format,
     *                                   e.g. "m/44'/60'/0'/0/0"
     * @returns {Array<number>} to be used with PrivateKey#derive
     */
    calculateDerivationPathValues(derivationPath) {
        // Parse the derivation path from string into values
        const pattern = /m\/(\d+'?)\/(\d+'?)\/(\d+'?)\/(\d+'?)\/(\d+'?)/;
        const matches = pattern.exec(derivationPath);
        const values = new Array(5); // as Array<Number>;
        if (matches) {
            // Extract numbers and use apostrophe to select if is hardened
            for (let i = 1; i <= 5; i++) {
                let value = matches[i];
                if (value.endsWith("'")) {
                    value = value.substring(0, value.length - 1);
                    values[i - 1] = parseInt(value, 10) | HARDENED_BIT;
                } else {
                    values[i - 1] = parseInt(value, 10);
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return values;
    }

    /**
     * Common implementation for both `toStandardECDSAsecp256k1PrivateKey`
     * functions.
     *
     * @param {string} passphrase  the passphrase used to protect the
     *                             mnemonic, use "" for none
     * @param {Array<number>} derivationPathValues derivation path as an
     *                             integer array,
     *                             see: `calculateDerivationPathValues`
     * @returns {Promise<PrivateKey>}  a private key
     */
    async toStandardECDSAsecp256k1PrivateKeyImpl(
        passphrase,
        derivationPathValues,
    ) {
        // eslint-disable-next-line deprecation/deprecation
        return await this.toEcdsaPrivateKey(passphrase, derivationPathValues);
    }

    /**
     * Recover an ECDSA private key from this mnemonic phrase, with an
     * optional passphrase.
     *
     * @param {string} [passphrase]
     * @param {number} [index]
     * @returns {Promise<PrivateKey>}
     */
    async toStandardECDSAsecp256k1PrivateKey(passphrase = "", index) {
        return CACHE.privateKeyConstructor(
            await this._mnemonic.toStandardECDSAsecp256k1PrivateKey(
                passphrase,
                index,
            ),
        );
    }

    /**
     * Recover an ECDSAsecp256k1 private key from this mnemonic phrase and
     * derivation path, with an optional passphrase
     *
     * @param {string} passphrase      the passphrase used to protect the mnemonic,
     *                                 use "" for none
     * @param {string} derivationPath  the derivation path in BIP-44 format,
     *                                 e.g. "m/44'/60'/0'/0/0"
     * @returns {Promise<PrivateKey>}  the private key
     */
    async toStandardECDSAsecp256k1PrivateKeyCustomDerivationPath(
        passphrase = "",
        derivationPath,
    ) {
        const derivationPathValues =
            this.calculateDerivationPathValues(derivationPath);
        return await this.toStandardECDSAsecp256k1PrivateKeyImpl(
            passphrase,
            derivationPathValues,
        );
    }

    /**
     * Recover a mnemonic phrase from a string, splitting on spaces. Handles 12, 22 (legacy), and 24 words.
     *
     * @param {string} mnemonic
     * @returns {Promise<Mnemonic>}
     */
    static async fromString(mnemonic) {
        return new Mnemonic(await MnemonicCryptography.fromString(mnemonic));
    }

    /**
     * @returns {Promise<PrivateKey>}
     */
    async toLegacyPrivateKey() {
        return CACHE.privateKeyConstructor(
            await this._mnemonic.toLegacyPrivateKey(),
        );
    }

    /**
     * @param {string} passphrase
     * @returns {Promise<Uint8Array>}
     */
    async toSeed(passphrase) {
        return await MnemonicCryptography.toSeed(
            this._mnemonic.words,
            passphrase,
        );
    }

    /**
     * @returns {string}
     */
    toString() {
        return this._mnemonic.toString();
    }
}
