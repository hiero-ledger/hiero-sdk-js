// SPDX-License-Identifier: Apache-2.0

import { PrivateKey as PrivateKeyCrypto } from "@hashgraph/cryptography";
import Mnemonic from "./Mnemonic.js";
import PublicKey from "./PublicKey.js";
import Key from "./Key.js";
import CACHE from "./Cache.js";
import SignatureMap from "./transaction/SignatureMap.js";

import AccountId from "./account/AccountId.js";
import TransactionId from "./transaction/TransactionId.js";
import { proto } from "@hashgraph/proto";

/**
 * @typedef {import("./transaction/Transaction.js").default} Transaction
 */

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IKey} HieroProto.proto.IKey
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignaturePair} HieroProto.proto.ISignaturePair
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 */

export default class PrivateKey extends Key {
    /**
     * @internal
     * @hideconstructor
     * @param {PrivateKeyCrypto} key
     */
    constructor(key) {
        super();

        this._key = key;
    }

    /**
     * Generate a random Ed25519 private key.
     *
     * @returns {PrivateKey}
     */
    static generateED25519() {
        return new PrivateKey(PrivateKeyCrypto.generateED25519());
    }

    /**
     * Generate a random EDSA private key.
     *
     * @returns {PrivateKey}
     */
    static generateECDSA() {
        return new PrivateKey(PrivateKeyCrypto.generateECDSA());
    }

    /**
     * Depredated - Use `generateED25519()` instead
     * Generate a random Ed25519 private key.
     *
     * @returns {PrivateKey}
     */
    static generate() {
        return PrivateKey.generateED25519();
    }

    /**
     * Depredated - Use `generateED25519Async()` instead
     * Generate a random Ed25519 private key.
     *
     * @returns {Promise<PrivateKey>}
     */
    static async generateAsync() {
        return new PrivateKey(await PrivateKeyCrypto.generateAsync());
    }

    /**
     * Generate a random Ed25519 private key.
     *
     * @returns {Promise<PrivateKey>}
     */
    static async generateED25519Async() {
        return new PrivateKey(await PrivateKeyCrypto.generateED25519Async());
    }

    /**
     * Generate a random ECDSA private key.
     *
     * @returns {Promise<PrivateKey>}
     */
    static async generateECDSAAsync() {
        return new PrivateKey(await PrivateKeyCrypto.generateECDSAAsync());
    }

    /**
     * Construct a private key from bytes. Requires DER header.
     *
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytes(data) {
        return new PrivateKey(PrivateKeyCrypto.fromBytes(data));
    }

    /**
     * Construct a ECDSA private key from bytes.
     *
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytesECDSA(data) {
        return new PrivateKey(PrivateKeyCrypto.fromBytesECDSA(data));
    }

    /**
     * Construct a ED25519 private key from bytes.
     *
     * @param {Uint8Array} data
     * @returns {PrivateKey}
     */
    static fromBytesED25519(data) {
        return new PrivateKey(PrivateKeyCrypto.fromBytesED25519(data));
    }

    /**
     * @deprecated - Use fromStringECDSA() or fromStringED2551() on a HEX-encoded string
     * and fromStringDer() on a HEX-encoded string with DER prefix instead.
     * Construct a private key from a hex-encoded string. Requires DER header.
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromString(text) {
        return new PrivateKey(PrivateKeyCrypto.fromString(text));
    }

    /**
     * Construct a private key from a HEX-encoded string with a der prefix
     *
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromStringDer(text) {
        return new PrivateKey(PrivateKeyCrypto.fromString(text));
    }

    /**
     * Construct a ECDSA private key from a hex-encoded string.
     *
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromStringECDSA(text) {
        return new PrivateKey(PrivateKeyCrypto.fromStringECDSA(text));
    }

    /**
     * Construct a Ed25519 private key from a hex-encoded string.
     *
     * @param {string} text
     * @returns {PrivateKey}
     */
    static fromStringED25519(text) {
        return new PrivateKey(PrivateKeyCrypto.fromStringED25519(text));
    }

    /**
     * Construct a Ed25519 private key from a Uint8Array seed.
     *
     * @param {Uint8Array} seed
     * @returns {Promise<PrivateKey>}
     */
    static async fromSeedED25519(seed) {
        return new PrivateKey(await PrivateKeyCrypto.fromSeedED25519(seed));
    }

    /**
     * Construct a Ed25519 private key from a Uint8Array seed.
     *
     * @param {Uint8Array} seed
     * @returns {Promise<PrivateKey>}
     */
    static async fromSeedECDSAsecp256k1(seed) {
        return new PrivateKey(
            await PrivateKeyCrypto.fromSeedECDSAsecp256k1(seed),
        );
    }

    /**
     * @deprecated - Use `Mnemonic.from[Words|String]().to[Ed25519|Ecdsa]PrivateKey()` instead
     *
     * Recover a private key from a mnemonic phrase (and optionally a password).
     * @param {Mnemonic  | string} mnemonic
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    static async fromMnemonic(mnemonic, passphrase = "") {
        if (mnemonic instanceof Mnemonic) {
            return new PrivateKey(
                // eslint-disable-next-line deprecation/deprecation
                await PrivateKeyCrypto.fromMnemonic(
                    mnemonic._mnemonic,
                    passphrase,
                ),
            );
        }

        return new PrivateKey(
            // eslint-disable-next-line deprecation/deprecation
            await PrivateKeyCrypto.fromMnemonic(mnemonic, passphrase),
        );
    }

    /**
     * Recover a private key from a keystore, previously created by `.toKeystore()`.
     *
     * This key will _not_ support child key derivation.
     *
     * @param {Uint8Array} data
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     * @throws {cryptography.BadKeyError} If the passphrase is incorrect or the hash fails to validate.
     */
    static async fromKeystore(data, passphrase = "") {
        return new PrivateKey(
            await PrivateKeyCrypto.fromKeystore(data, passphrase),
        );
    }

    /**
     * Recover a private key from a pem string; the private key may be encrypted.
     *
     * This method assumes the .pem file has been converted to a string already.
     *
     * If `passphrase` is not null or empty, this looks for the first `ENCRYPTED PRIVATE KEY`
     * section and uses `passphrase` to decrypt it; otherwise, it looks for the first `PRIVATE KEY`
     * section and decodes that as a DER-encoded  private key.
     *
     * @param {string} data
     * @param {string} [passphrase]
     * @returns {Promise<PrivateKey>}
     */
    static async fromPem(data, passphrase = "") {
        return new PrivateKey(await PrivateKeyCrypto.fromPem(data, passphrase));
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
        return new PrivateKey(await this._key.derive(index));
    }

    /**
     * @param {number} index
     * @returns {Promise<PrivateKey>}
     * @throws If this key does not support derivation.
     */
    async legacyDerive(index) {
        return new PrivateKey(await this._key.legacyDerive(index));
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
        return new PublicKey(this._key.publicKey);
    }

    /**
     * Get the public key associated with this private key.
     *
     * The public key can be freely given and used by other parties to verify
     * the signatures generated by this private key.
     *
     * @returns {?Uint8Array}
     */
    get chainCode() {
        return this._key._chainCode;
    }

    /**
     * Sign a message with this private key.
     *
     * @param {Uint8Array} bytes
     * @returns {Uint8Array} - The signature bytes without the message
     */
    sign(bytes) {
        return this._key.sign(bytes);
    }

    /**
     * @param {Transaction} transaction
     * @returns {SignatureMap}
     */
    signTransaction(transaction) {
        const sigMap = new SignatureMap();

        for (const signedTx of transaction._signedTransactions.list) {
            const bodyBytes = signedTx.bodyBytes;
            if (!bodyBytes) throw new Error("Body bytes are missing");

            const body = proto.TransactionBody.decode(bodyBytes);
            if (!body.transactionID || !body.nodeAccountID) {
                throw new Error(
                    "Transaction ID or Node Account ID not found in the signed transaction",
                );
            }

            const nodeId = AccountId._fromProtobuf(body.nodeAccountID);
            const transactionId = TransactionId._fromProtobuf(
                body.transactionID,
            );
            const sig = this._key.sign(bodyBytes);
            sigMap.addSignature(nodeId, transactionId, this.publicKey, sig);
        }

        transaction.addSignature(this.publicKey, sigMap);
        return sigMap;
    }
    /**
     * Check if `derive` can be called on this private key.
     *
     * This is only the case if the key was created from a mnemonic.
     *
     * @returns {boolean}
     */
    isDerivable() {
        return this._key.isDerivable();
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return this._key.toBytes();
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
        return this._key.toStringDer();
    }

    /**
     * @returns {string}
     */
    toStringDer() {
        return this._key.toStringDer();
    }

    /**
     * @returns {string}
     */
    toStringRaw() {
        return this._key.toStringRaw();
    }

    /**
     * Create a keystore with a given passphrase.
     *
     * The key can be recovered later with `fromKeystore()`.
     *
     * Note that this will not retain the ancillary data used for
     * deriving child keys, thus `.derive()` on the restored key will
     * throw even if this instance supports derivation.
     *
     * @param {string} [passphrase]
     * @returns {Promise<Uint8Array>}
     */
    toKeystore(passphrase = "") {
        return this._key.toKeystore(passphrase);
    }

    /**
     * @returns {HieroProto.proto.IKey}
     */
    _toProtobufKey() {
        return this.publicKey._toProtobufKey();
    }

    /**
     * @param {Long | number} shard
     * @param {Long | number} realm
     * @returns {AccountId}
     */
    toAccountId(shard, realm) {
        return this.publicKey.toAccountId(shard, realm);
    }

    /**
     * @returns {string}
     */
    get type() {
        return this._key._type;
    }
}

CACHE.setPrivateKeyConstructor((key) => new PrivateKey(key));
