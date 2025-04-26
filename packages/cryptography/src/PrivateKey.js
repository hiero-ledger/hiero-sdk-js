import PublicKey from "./PublicKey.js";
import Mnemonic from "./Mnemonic.js";
import { arrayStartsWith } from "./util/array.js";
import BadKeyError from "./BadKeyError.js";
import * as hex from "./encoding/hex.js";
import * as slip10 from "./primitive/slip10.js";
import Key from "./Key.js";
import * as random from "./primitive/random.js";
import * as derive from "./util/derive.js";
import * as naclSign from './util/nacl-sign.js'

const derPrefix = "302e020100300506032b657004220420";
const derPrefixBytes = hex.decode(derPrefix);

/**
 * @typedef {object} ProtoSignaturePair
 * @property {(Uint8Array | null)=} pubKeyPrefix
 * @property {(Uint8Array | null)=} ed25519
 */

/**
 * @typedef {object} ProtoSigMap
 * @property {(ProtoSignaturePair[] | null)=} sigPair
 */

/**
 * @typedef {object} ProtoSignedTransaction
 * @property {(Uint8Array | null)=} bodyBytes
 * @property {(ProtoSigMap | null)=} sigMap
 */

/**
 * @typedef {object} Transaction
 * @property {() => boolean} isFrozen
 * @property {ProtoSignedTransaction[]} _signedTransactions
 * @property {Set<string>} _signerPublicKeys
 * @property {(publicKey: PublicKey, signature: Uint8Array) => Transaction} addSignature
 * @property {() => void} _requireFrozen
 * @property {() => Transaction} freeze
 */

/**
 * A private key on the Hedera™ network.
 */
export default class PrivateKey extends Key {
    /**
     * @hideconstructor
     * @internal
     * @param {nacl.SignKeyPair} keyPair
     * @param {?Uint8Array} chainCode
     */
    constructor(keyPair, chainCode) {
        super();

        /**
         * @type {nacl.SignKeyPair}
         * @readonly
         * @private
         */
        this._keyPair = keyPair;

        /**
         * @type {?Uint8Array}
         * @readonly
         * @private
         */
        this._chainCode = chainCode;
    }

    /**
     * Generate a random Ed25519 private key.
     *
     * @returns {PrivateKey}
     */
    static generate() {
        // 32 bytes for the secret key
        // 32 bytes for the chain code (to support derivation)
        const entropy = random.bytes(64);

        return new PrivateKey(
            naclSign.keyPairFromSeed(entropy.subarray(0, 32)),
            entropy.subarray(32)
        );
    }

    /**
     * Generate a random Ed25519 private key.
     *
     * @returns {Promise<PrivateKey>}
     */
    static async generateAsync() {
        // 32 bytes for the secret key
        // 32 bytes for the chain code (to support derivation)
        const entropy = await random.bytesAsync(64);

        return new PrivateKey(
            naclSign.keyPairFromSeed(entropy.subarray(0, 32)),
            entropy.subarray(32)
        );
    }

    /**
     * Construct a private key from bytes.
     *
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytes(data) {
        switch (data.length) {
            case 48:
                if (arrayStartsWith(data, derPrefixBytes)) {
                    const keyPair = naclSign.keyPairFromSeed(
                        data.subarray(16)
                    );

                    return new PrivateKey(keyPair, null);
                }

                break;

            case 32:
                return new PrivateKey(naclSign.keyPairFromSeed(data), null);

            case 64:
                // priv + pub key
                return new PrivateKey(
                    naclSign.keyPairFromSecretKey(data),
                    null
                );

            default:
        }

        throw new BadKeyError(
            `invalid private key length: ${data.length} bytes`
        );
    }

    /**
     * Construct a private key from a hex-encoded string.
     *
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromString(text) {
        return PrivateKey.fromBytes(hex.decode(text));
    }

    /**
     * Recover a private key from a mnemonic phrase (and optionally a password).
     *
     * @param {Mnemonic | string} mnemonic
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    static async fromMnemonic(mnemonic, passphrase = "") {
        return (
            typeof mnemonic === "string"
                ? await Mnemonic.fromString(mnemonic)
                : mnemonic
        ).toPrivateKey(passphrase);
    }

    /**
     * Derive a new private key at the given wallet index.
     *
     * Only currently supported for keys created with `fromMnemonic()`; other keys will throw
     * an error.
     *
     * You can check if a key supports derivation with `.supportsDerivation()`
     *
     * @param {number} index
     * @returns {Promise<PrivateKey>}
     * @throws If this key does not support derivation.
     */
    async derive(index) {
        if (this._chainCode == null) {
            throw new Error("this private key does not support key derivation");
        }

        const { keyData, chainCode } = await slip10.derive(
            this.toBytes(),
            this._chainCode,
            index
        );

        const keyPair = naclSign.keyPairFromSeed(keyData);

        return new PrivateKey(keyPair, chainCode);
    }

    /**
     * @param {number} index
     * @returns {Promise<PrivateKey>}
     * @throws If this key does not support derivation.
     */
    async legacyDerive(index) {
        const keyBytes = await derive.legacy(
            this.toBytes().subarray(0, 32),
            index
        );

        return PrivateKey.fromBytes(keyBytes);
    }

    /**
     * Get the public key associated with this private key.
     *
     * The public key can be freely given and used by other parties to verify
     * the signatures generated by this private key.
     *
     * @returns {PublicKey}
     */
    get publicKey() {
        return new PublicKey(this._keyPair.publicKey);
    }

    /**
     * Sign a message with this private key.
     *
     * @param {Uint8Array} bytes
     * @returns {Uint8Array} - The signature bytes without the message
     */
    sign(bytes) {
        return naclSign.detached(bytes, this._keyPair.secretKey);
    }

    /**
     * @param {Transaction} transaction
     * @returns {Uint8Array}
     */
    signTransaction(transaction) {
        transaction._requireFrozen();

        if (!transaction.isFrozen()) {
            transaction.freeze();
        }

        if (transaction._signedTransactions.length != 1) {
            throw new Error(
                "`PrivateKey.signTransaction()` requires `Transaction` to have a single node `AccountId` set"
            );
        }

        const tx = /** @type {ProtoSignedTransaction} */ (
            transaction._signedTransactions[0]
        );

        const publicKeyHex = hex.encode(this.publicKey.toBytes());

        if (tx.sigMap == null) {
            tx.sigMap = {};
        }

        if (tx.sigMap.sigPair == null) {
            tx.sigMap.sigPair = [];
        }

        for (const sigPair of tx.sigMap.sigPair) {
            if (
                sigPair.pubKeyPrefix != null &&
                hex.encode(sigPair.pubKeyPrefix) === publicKeyHex
            ) {
                return /** @type {Uint8Array} */ (sigPair.ed25519);
            }
        }

        const siganture = this.sign(
            tx.bodyBytes != null ? tx.bodyBytes : new Uint8Array()
        );

        tx.sigMap.sigPair.push({
            pubKeyPrefix: this.publicKey.toBytes(),
            ed25519: siganture,
        });

        transaction._signerPublicKeys.add(publicKeyHex);

        return siganture;
    }

    /**
     * Check if `derive` can be called on this private key.
     *
     * This is only the case if the key was created from a mnemonic.
     *
     * @returns {boolean}
     */
    isDerivable() {
        return this._chainCode != null;
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        // copy the bytes so they can't be modified accidentally
        return this._keyPair.secretKey.slice(0, 32);
    }

    /**
     * @returns {string}
     */
    toString() {
        return derPrefix + hex.encode(this.toBytes());
    }
}
