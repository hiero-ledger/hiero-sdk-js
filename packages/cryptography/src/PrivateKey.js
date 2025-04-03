import BadKeyError from "./BadKeyError.js";
import Key from "./Key.js";
import Ed25519PrivateKey from "./Ed25519PrivateKey.js";
import EcdsaPrivateKey from "./EcdsaPrivateKey.js";
import PublicKey from "./PublicKey.js";
import { createKeystore, loadKeystore } from "./primitive/keystore.js";
import { read } from "./encoding/pem.js";
import * as hex from "./encoding/hex.js";
import * as slip10 from "./primitive/slip10.js";
import * as bip32 from "./primitive/bip32.js";
import * as derive from "./util/derive.js";
import * as ecdsa from "./primitive/ecdsa.js";
import CACHE from "./Cache.js";

/**
 * @typedef {object} ProtoSignaturePair
 * @property {(Uint8Array | null)=} pubKeyPrefix
 * @property {(Uint8Array | null)=} ed25519
 * @property {(Uint8Array | null)=} ECDSASecp256k1
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
 * @typedef {import("./Mnemonic.js").default} Mnemonic
 */

/**
 * A private key on the Hedera™ network.
 */
export default class PrivateKey extends Key {
    /**
     * @hideconstructor
     * @internal
     * @param {Ed25519PrivateKey | EcdsaPrivateKey} key
     */
    constructor(key) {
        super();

        /**
         * @type {Ed25519PrivateKey | EcdsaPrivateKey}
         * @readonly
         * @private
         */
        this._key = key;
    }

    /**
     * @returns {string}
     */
    get _type() {
        return this._key._type;
    }

    /**
     * @returns {Uint8Array | null}
     */
    get _chainCode() {
        return this._key._chainCode;
    }

    /**
     * Generate a random Ed25519 private key.
     * @returns {PrivateKey}
     */
    static generateED25519() {
        return new PrivateKey(Ed25519PrivateKey.generate());
    }

    /**
     * Generate a random EDSA private key.
     * @returns {PrivateKey}
     */
    static generateECDSA() {
        return new PrivateKey(EcdsaPrivateKey.generate());
    }

    /**
     * Depredated - Use `generateED25519()` instead
     * Generate a random Ed25519 private key.
     * @returns {PrivateKey}
     */
    static generate() {
        return PrivateKey.generateED25519();
    }

    /**
     * Depredated - Use `generateED25519Async()` instead
     * Generate a random Ed25519 private key.
     * @returns {Promise<PrivateKey>}
     */
    static async generateAsync() {
        return PrivateKey.generateED25519Async();
    }

    /**
     * Generate a random Ed25519 private key.
     * @returns {Promise<PrivateKey>}
     */
    static async generateED25519Async() {
        return new PrivateKey(await Ed25519PrivateKey.generateAsync());
    }

    /**
     * Generate a random ECDSA private key.
     * @returns {Promise<PrivateKey>}
     */
    static async generateECDSAAsync() {
        return new PrivateKey(await EcdsaPrivateKey.generateAsync());
    }

    /**
     * Construct a private key from bytes. Requires DER header.
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytes(data) {
        let message;

        if (data.length == 32) {
            console.warn(
                "WARNING: Consider using fromStringECDSA() or fromStringED25519() on a HEX-encoded string and fromStringDer() on a HEX-encoded string with DER prefix instead.",
            );
        }

        try {
            return new PrivateKey(Ed25519PrivateKey.fromBytes(data));
        } catch (error) {
            message =
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                error != null && /** @type {Error} */ (error).message != null
                    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      /** @type {Error} */ (error).message
                    : "";
        }

        try {
            return new PrivateKey(EcdsaPrivateKey.fromBytes(data));
        } catch (error) {
            message =
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                error != null && /** @type {Error} */ (error).message != null
                    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      /** @type {Error} */ (error).message
                    : "";
        }

        throw new BadKeyError(
            `private key cannot be decoded from bytes: ${message}`,
        );
    }

    /**
     * Construct a ECDSA private key from bytes.
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytesECDSA(data) {
        return new PrivateKey(EcdsaPrivateKey.fromBytes(data));
    }

    /**
     * Construct a ED25519 private key from bytes.
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytesED25519(data) {
        return new PrivateKey(Ed25519PrivateKey.fromBytes(data));
    }

    /**
     * Construct a private key from a hex-encoded string. Requires DER header.
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromString(text) {
        return PrivateKey.fromBytes(hex.decode(text));
    }

    /**
     * Construct a ECDSA private key from a hex-encoded string.
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromStringECDSA(text) {
        return PrivateKey.fromBytesECDSA(hex.decode(text));
    }

    /**
     * Construct a Ed25519 private key from a hex-encoded string.
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromStringED25519(text) {
        return PrivateKey.fromBytesED25519(hex.decode(text));
    }

    /**
     * Construct a Ed25519 private key from a Uint8Array seed.
     * @param {Uint8Array} seed
     * @returns {Promise<PrivateKey>}
     */
    static async fromSeedED25519(seed) {
        const ed25519Key = await Ed25519PrivateKey.fromSeed(seed);
        return new PrivateKey(ed25519Key);
    }

    /**
     * Construct a ECDSA private key from a Uint8Array seed.
     * @param {Uint8Array} seed
     * @returns {Promise<PrivateKey>}
     */
    static async fromSeedECDSAsecp256k1(seed) {
        const ecdsaKey = await EcdsaPrivateKey.fromSeed(seed);
        return new PrivateKey(ecdsaKey);
    }

    /**
     * @deprecated - Use `Mnemonic.from[Words|String]().toStandard[Ed25519|ECDSAsecp256k1]PrivateKey()` instead
     *
     * Recover a private key from a mnemonic phrase (and optionally a password).
     * @param {Mnemonic | string} mnemonic
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    static async fromMnemonic(mnemonic, passphrase = "") {
        if (CACHE.mnemonicFromString == null) {
            throw new Error("Mnemonic not found in cache");
        }

        return (
            (
                typeof mnemonic === "string"
                    ? CACHE.mnemonicFromString(mnemonic)
                    : mnemonic
            )
                // eslint-disable-next-line deprecation/deprecation
                .toEd25519PrivateKey(passphrase)
        );
    }

    /**
     * Recover a private key from a keystore, previously created by `.toKeystore()`.
     *
     * This key will _not_ support child key derivation.
     * @param {Uint8Array} data
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     * @throws {BadKeyError} If the passphrase is incorrect or the hash fails to validate.
     */
    static async fromKeystore(data, passphrase = "") {
        return PrivateKey.fromBytes(await loadKeystore(data, passphrase));
    }

    /**
     * Recover a private key from a pem string; the private key may be encrypted.
     *
     * This method assumes the .pem file has been converted to a string already.
     *
     * If `passphrase` is not null or empty, this looks for the first `ENCRYPTED PRIVATE KEY`
     * section and uses `passphrase` to decrypt it; otherwise, it looks for the first `PRIVATE KEY`
     * section and decodes that as a DER-encoded  private key.
     * @param {string} data
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    static async fromPem(data, passphrase = "") {
        const pem = await read(data, passphrase);

        if (
            pem instanceof Ed25519PrivateKey ||
            pem instanceof EcdsaPrivateKey
        ) {
            return new PrivateKey(pem);
        }

        const isEcdsa = data.includes("BEGIN EC PRIVATE KEY") ? true : false;
        if (isEcdsa) {
            return new PrivateKey(EcdsaPrivateKey.fromBytes(pem));
        } else {
            return new PrivateKey(Ed25519PrivateKey.fromBytes(pem));
        }
    }

    /**
     * Derive a new private key at the given wallet index.
     *
     * Only currently supported for keys created with from mnemonics; other keys will throw
     * an error.
     *
     * You can check if a key supports derivation with `.supportsDerivation()`
     * @param {number} index
     * @returns {Promise<PrivateKey>}
     * @throws If this key does not support derivation.
     */
    async derive(index) {
        if (this._key._chainCode == null) {
            throw new Error("this private key does not support key derivation");
        }

        if (this._key instanceof Ed25519PrivateKey) {
            const { keyData, chainCode } = await slip10.derive(
                this.toBytesRaw(),
                this._key._chainCode,
                index,
            );

            return new PrivateKey(new Ed25519PrivateKey(keyData, chainCode));
        } else {
            const { keyData, chainCode } = await bip32.derive(
                this.toBytesRaw(),
                this._key._chainCode,
                index,
            );

            return new PrivateKey(
                new EcdsaPrivateKey(ecdsa.fromBytes(keyData), chainCode),
            );
        }
    }

    /**
     * @param {number} index
     * @returns {Promise<PrivateKey>}
     * @throws If this key does not support derivation.
     */
    async legacyDerive(index) {
        const keyBytes = await derive.legacy(
            this.toBytesRaw().subarray(0, 32),
            index,
        );

        /** @type {new (bytes: Uint8Array) => Ed25519PrivateKey | EcdsaPrivateKey} */
        const constructor = /** @type {any} */ (this._key.constructor);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return new PrivateKey(new constructor(keyBytes));
    }

    /**
     * Get the public key associated with this private key.
     *
     * The public key can be freely given and used by other parties to verify
     * the signatures generated by this private key.
     * @returns {PublicKey}
     */
    get publicKey() {
        return new PublicKey(this._key.publicKey);
    }

    /**
     * Sign a message with this private key.
     * @param {Uint8Array} bytes
     * @returns {Uint8Array} - The signature bytes without the message
     */
    sign(bytes) {
        return this._key.sign(bytes);
    }

    /**
     * @param {Transaction} transaction
     * @returns {Uint8Array}
     */
    signTransaction(transaction) {
        if (!transaction.isFrozen()) {
            transaction.freeze();
        }

        if (transaction._signedTransactions.length != 1) {
            throw new Error(
                "`PrivateKey.signTransaction()` requires `Transaction` to have a single node `AccountId` set",
            );
        }

        const tx = /** @type {ProtoSignedTransaction} */ (
            transaction._signedTransactions[0]
        );

        const publicKeyHex = hex.encode(this.publicKey.toBytesRaw());

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
                switch (this._type) {
                    case "ED25519":
                        return /** @type {Uint8Array} */ (sigPair.ed25519);
                    case "secp256k1":
                        return /** @type {Uint8Array} */ (
                            sigPair.ECDSASecp256k1
                        );
                }
            }
        }

        const siganture = this.sign(
            tx.bodyBytes != null ? tx.bodyBytes : new Uint8Array(),
        );

        /** @type {ProtoSignaturePair} */
        const protoSignature = {
            pubKeyPrefix: this.publicKey.toBytesRaw(),
        };

        switch (this._type) {
            case "ED25519":
                protoSignature.ed25519 = siganture;
                break;
            case "secp256k1":
                protoSignature.ECDSASecp256k1 = siganture;
                break;
        }

        tx.sigMap.sigPair.push(protoSignature);
        transaction._signerPublicKeys.add(publicKeyHex);

        return siganture;
    }

    /**
     * Check if `derive` can be called on this private key.
     *
     * This is only the case if the key was created from a mnemonic.
     * @returns {boolean}
     */
    isDerivable() {
        return this._key._chainCode != null;
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        if (this._key instanceof Ed25519PrivateKey) {
            return this.toBytesRaw();
        } else {
            return this.toBytesDer();
        }
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesDer() {
        return this._key.toBytesDer();
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesRaw() {
        return this._key.toBytesRaw();
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.toStringDer();
    }

    /**
     * @returns {string}
     */
    toStringDer() {
        return hex.encode(this.toBytesDer());
    }

    /**
     * @returns {string}
     */
    toStringRaw() {
        return hex.encode(this.toBytesRaw());
    }

    /**
     * Create a keystore with a given passphrase.
     *
     * The key can be recovered later with `fromKeystore()`.
     *
     * Note that this will not retain the ancillary data used for
     * deriving child keys, thus `.derive()` on the restored key will
     * throw even if this instance supports derivation.
     * @param {string} [passphrase]
     * @returns {Promise<Uint8Array>}
     */
    toKeystore(passphrase = "") {
        return createKeystore(this.toBytesRaw(), passphrase);
    }

    /**
     * Recover the recovery ID used in the signature for the given message.
     *
     * **Note:** This method only works for ECDSA secp256k1 keys.
     * @param {Uint8Array} r - 32-byte `r` component of the signature
     * @param {Uint8Array} s - 32-byte `s` component of the signature
     * @param {Uint8Array} message - The original (unhashed) message
     * @returns {number} Recovery ID (0–3), or -1 if not found or not applicable
     */
    getRecoveryId(r, s, message) {
        if (!(this._key instanceof EcdsaPrivateKey)) {
            throw new Error("Invalid key type, must be ECDSA secp256k1.");
        }

        if (r.length !== 32 || s.length !== 32) {
            throw new Error("Invalid signature components.");
        }

        const signature = new Uint8Array(64);

        signature.set(r, 0);
        signature.set(s, 32);

        return this._key.getRecoveryId(signature, message);
    }
}

CACHE.privateKeyConstructor = (key) => new PrivateKey(key);
CACHE.privateKeyFromBytes = (bytes) => PrivateKey.fromBytes(bytes);
