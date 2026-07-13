import CACHE from "./Cache.js";
import Ed25519PrivateKey from "./Ed25519PrivateKey.js";
import BadMnemonicError from "./BadMnemonicError.js";
import BadMnemonicReason from "./BadMnemonicReason.js";
import legacyWords from "./words/legacy.js";
import bip39Words from "./words/bip39.js";
import * as sha256 from "./primitive/sha256.js";
import * as hmac from "./primitive/hmac.js";
import * as slip10 from "./primitive/slip10.js";
import * as bip32 from "./primitive/bip32.js";
import * as bip39 from "./primitive/bip39.js";
import * as entropy from "./util/entropy.js";
import * as random from "./primitive/random.js";
import EcdsaPrivateKey from "./EcdsaPrivateKey.js";
import PrivateKey from "./PrivateKey.js";
import * as ecdsa from "./primitive/ecdsa.js";

const ED25519_SEED_TEXT = "ed25519 seed";
const ECDSA_SEED_TEXT = "Bitcoin seed";

export const HARDENED = 0x80000000;

/// m/44'/3030'/0'/0' - All paths in EdDSA derivation are implicitly hardened.
export const HEDERA_PATH = [44, 3030, 0, 0];

/// m/44'/3030'/0'/0
export const SLIP44_ECDSA_HEDERA_PATH = [
    44 | HARDENED,
    3030 | HARDENED,
    0 | HARDENED,
    0,
];

/// m/44'/60'/0'/0
export const SLIP44_ECDSA_ETH_PATH = [
    44 | HARDENED,
    60 | HARDENED,
    0 | HARDENED,
    0,
    0,
];

/**
 * Multi-word mnemonic phrase (BIP-39).
 *
 * Compatible with the official Hedera mobile
 * wallets (24-words or 22-words) and BRD (12-words).
 */
export default class Mnemonic {
    /**
     * @param {object} props
     * @param {string[]} props.words
     * @throws {BadMnemonicError}
     * @hideconstructor
     * @private
     */
    constructor({ words }) {
        this.words = words;
    }

    /**
     * Returns a new random 24-word mnemonic from the BIP-39
     * standard English word list.
     * @returns {Promise<Mnemonic>}
     */
    static generate() {
        return Mnemonic._generate(24);
    }

    /**
     * Returns a new random 12-word mnemonic from the BIP-39
     * standard English word list.
     * @returns {Promise<Mnemonic>}
     */
    static generate12() {
        return Mnemonic._generate(12);
    }

    /**
     * @param {number} length
     * @returns {Promise<Mnemonic>}
     */
    static async _generate(length) {
        // only 12-word or 24-word lengths are supported
        let neededEntropy;

        if (length === 12) neededEntropy = 16;
        else if (length === 24) neededEntropy = 32;
        else {
            throw new Error(
                `unsupported phrase length ${length}, only 12 or 24 are supported`,
            );
        }

        // inlined from (ISC) with heavy alternations for modern crypto
        // https://github.com/bitcoinjs/bip39/blob/8461e83677a1d2c685d0d5a9ba2a76bd228f74c6/ts_src/index.ts#L125
        const seed = await random.bytesAsync(neededEntropy);
        const entropyBits = bytesToBinary(Array.from(seed));
        const checksumBits = await deriveChecksumBits(seed);
        const bits = entropyBits + checksumBits;
        const chunks = bits.match(/(.{1,11})/g);

        const words = (chunks != null ? chunks : []).map(
            (binary) => bip39Words[binaryToByte(binary)],
        );

        return new Mnemonic({ words });
    }

    /**
     * Construct a mnemonic from a list of words. Handles 12, 22 (legacy), and 24 words.
     *
     * An exception of BadMnemonicError will be thrown if the mnemonic
     * contains unknown words or fails the checksum. An invalid mnemonic
     * can still be used to create private keys, the exception will
     * contain the failing mnemonic in case you wish to ignore the
     * validation error and continue.
     * @param {string[]} words
     * @throws {BadMnemonicError}
     * @returns {Promise<Mnemonic>}
     */
    static fromWords(words) {
        return new Mnemonic({
            words,
        })._validate();
    }

    /**
     * @deprecated - Use `toStandardEd25519PrivateKey()` or `toStandardECDSAsecp256k1PrivateKey()` instead
     * Recover a private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    toPrivateKey(passphrase = "") {
        // eslint-disable-next-line deprecation/deprecation
        return this.toEd25519PrivateKey(passphrase);
    }

    /**
     * @deprecated - Use `toStandardEd25519PrivateKey()` or `toStandardECDSAsecp256k1PrivateKey()` instead
     * Recover an Ed25519 private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @param {number[]} [path]
     * @returns {Promise<PrivateKey>}
     */
    async toEd25519PrivateKey(passphrase = "", path = HEDERA_PATH) {
        let { keyData, chainCode } = await this._toKeyData(
            passphrase,
            ED25519_SEED_TEXT,
        );

        for (const index of path) {
            ({ keyData, chainCode } = await slip10.derive(
                keyData,
                chainCode,
                index,
            ));
        }

        if (CACHE.privateKeyConstructor == null) {
            throw new Error("PrivateKey not found in cache");
        }

        return CACHE.privateKeyConstructor(
            new Ed25519PrivateKey(keyData, chainCode),
        );
    }

    /**
     * Recover an Ed25519 private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @param {number} [index]
     * @returns {Promise<PrivateKey>}
     */
    async toStandardEd25519PrivateKey(passphrase = "", index) {
        const seed = await Mnemonic.toSeed(this.words, passphrase);
        let derivedKey = await PrivateKey.fromSeedED25519(seed);
        index = index == null ? 0 : index;

        for (const currentIndex of [44, 3030, 0, 0, index]) {
            derivedKey = await derivedKey.derive(currentIndex);
        }

        return derivedKey;
    }

    /**
     * @deprecated - Use `toStandardEd25519PrivateKey()` or `toStandardECDSAsecp256k1PrivateKey()` instead
     * Recover an ECDSA private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @param {number[]} [path]
     * @returns {Promise<PrivateKey>}
     */
    async toEcdsaPrivateKey(passphrase = "", path = HEDERA_PATH) {
        let { keyData, chainCode } = await this._toKeyData(
            passphrase,
            ECDSA_SEED_TEXT,
        );

        for (const index of path) {
            ({ keyData, chainCode } = await bip32.derive(
                keyData,
                chainCode,
                index,
            ));
        }

        if (CACHE.privateKeyConstructor == null) {
            throw new Error("PrivateKey not found in cache");
        }

        return CACHE.privateKeyConstructor(
            new EcdsaPrivateKey(ecdsa.fromBytes(keyData), chainCode),
        );
    }

    /**
     * Recover an ECDSA private key from this mnemonic phrase, with an
     * optional passphrase.
     * @param {string} [passphrase]
     * @param {number} [index]
     * @returns {Promise<PrivateKey>}
     */
    async toStandardECDSAsecp256k1PrivateKey(passphrase = "", index) {
        const seed = await Mnemonic.toSeed(this.words, passphrase);
        let derivedKey = await PrivateKey.fromSeedECDSAsecp256k1(seed);
        index = index == null ? 0 : index;

        for (const currentIndex of [
            bip32.toHardenedIndex(44),
            bip32.toHardenedIndex(3030),
            bip32.toHardenedIndex(0),
            0,
            index,
        ]) {
            derivedKey = await derivedKey.derive(currentIndex);
        }

        return derivedKey;
    }

    /**
     * @param {string[]} words
     * @param {string} passphrase
     * @returns {Promise<Uint8Array>}
     */
    static async toSeed(words, passphrase) {
        return await bip39.toSeed(words, passphrase);
    }

    /**
     * @param {string} passphrase
     * @param {string} seedText
     * @returns {Promise<{ keyData: Uint8Array; chainCode: Uint8Array }>} seedText
     */
    async _toKeyData(passphrase, seedText) {
        const seed = await bip39.toSeed(this.words, passphrase);
        const digest = await hmac.hash(
            hmac.HashAlgorithm.Sha512,
            seedText,
            seed,
        );

        return {
            keyData: digest.subarray(0, 32),
            chainCode: digest.subarray(32),
        };
    }

    /**
     * Recover a mnemonic phrase from a string, splitting on spaces. Handles 12, 22 (legacy), and 24 words.
     * @param {string} mnemonic
     * @returns {Promise<Mnemonic>}
     */
    static async fromString(mnemonic) {
        return Mnemonic.fromWords(mnemonic.split(/\s|,/));
    }

    /**
     * @returns {Promise<Mnemonic>}
     * @private
     */
    async _validate() {
        //NOSONAR
        // Validate that this is a valid BIP-39 mnemonic
        // as generated by BIP-39's rules.

        // Technically, invalid mnemonics can still be used to generate valid private keys,
        // but if they became invalid due to user error then it will be difficult for the user
        // to tell the difference unless they compare the generated keys.

        // During validation, the following conditions are checked in order

        //  1)) 24 or 12 words

        //  2) All strings in {@link this.words} exist in the BIP-39
        //     standard English word list (no normalization is done)

        //  3) The calculated checksum for the mnemonic equals the
        //     checksum encoded in the mnemonic

        // If words count is 22, it means that this is a legacy private key
        if (this.words.length === 22) {
            const unknownWordIndices = this.words.reduce(
                (/** @type {number[]} */ unknowns, word, index) =>
                    legacyWords.includes(word.toLowerCase())
                        ? unknowns
                        : [...unknowns, index],
                [],
            );

            if (unknownWordIndices.length > 0) {
                throw new BadMnemonicError(
                    this,
                    BadMnemonicReason.UnknownWords,
                    unknownWordIndices,
                );
            }

            const [seed, checksum] = entropy.legacy1(this.words, legacyWords);
            const newChecksum = entropy.crc8(seed);

            if (checksum !== newChecksum) {
                throw new BadMnemonicError(
                    this,
                    BadMnemonicReason.ChecksumMismatch,
                    [],
                );
            }
        } else {
            if (!(this.words.length === 12 || this.words.length === 24)) {
                throw new BadMnemonicError(
                    this,
                    BadMnemonicReason.BadLength,
                    [],
                );
            }

            const unknownWordIndices = this.words.reduce(
                (/** @type {number[]} */ unknowns, word, index) =>
                    bip39Words.includes(word) ? unknowns : [...unknowns, index],
                [],
            );

            if (unknownWordIndices.length > 0) {
                throw new BadMnemonicError(
                    this,
                    BadMnemonicReason.UnknownWords,
                    unknownWordIndices,
                );
            }

            // FIXME: calculate checksum and compare
            // https://github.com/bitcoinjs/bip39/blob/master/ts_src/index.ts#L112

            const bits = this.words
                .map((word) => {
                    return bip39Words
                        .indexOf(word)
                        .toString(2)
                        .padStart(11, "0");
                })
                .join("");

            const dividerIndex = Math.floor(bits.length / 33) * 32;
            const entropyBits = bits.slice(0, dividerIndex);
            const checksumBits = bits.slice(dividerIndex);
            const entropyBitsRegex = entropyBits.match(/(.{1,8})/g);
            const entropyBytes = /** @type {RegExpMatchArray} */ (
                entropyBitsRegex
            ).map(binaryToByte);

            const newChecksum = await deriveChecksumBits(
                Uint8Array.from(entropyBytes),
            );

            if (newChecksum !== checksumBits) {
                throw new BadMnemonicError(
                    this,
                    BadMnemonicReason.ChecksumMismatch,
                    [],
                );
            }
        }

        return this;
    }

    /**
     * @returns {Promise<PrivateKey>}
     */
    async toLegacyPrivateKey() {
        let seed;
        if (this.words.length === 22) {
            [seed] = entropy.legacy1(this.words, legacyWords);
        } else {
            seed = await entropy.legacy2(this.words, bip39Words);
        }

        if (CACHE.privateKeyFromBytes == null) {
            throw new Error("PrivateKey not found in cache");
        }

        return CACHE.privateKeyFromBytes(seed);
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.words.join(" ");
    }
}

/**
 * @param {string} bin
 * @returns {number}
 */
function binaryToByte(bin) {
    return parseInt(bin, 2);
}

/**
 * @param {number[]} bytes
 * @returns {string}
 */
function bytesToBinary(bytes) {
    return bytes.map((x) => x.toString(2).padStart(8, "0")).join("");
}

/**
 * @param {Uint8Array} entropyBuffer
 * @returns {Promise<string>}
 */
async function deriveChecksumBits(entropyBuffer) {
    const ENT = entropyBuffer.length * 8;
    const CS = ENT / 32;
    const hash = await sha256.digest(entropyBuffer);

    return bytesToBinary(Array.from(hash)).slice(0, CS);
}
