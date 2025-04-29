// SPDX-License-Identifier: Apache-2.0

import { PublicKey as PublicKeyCrypto } from "@hashgraph/cryptography";
import { arrayEqual } from "./array.js";
import Key from "./Key.js";
import CACHE from "./Cache.js";

/**
 * @typedef {import("./transaction/Transaction.js").default} Transaction
 * @typedef {import("./account/AccountId.js").default} AccountId
 */

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IKey} HieroProto.proto.IKey
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignaturePair} HieroProto.proto.ISignaturePair
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 */

export default class PublicKey extends Key {
    /**
     * @internal
     * @hideconstructor
     * @param {PublicKeyCrypto} key
     */
    constructor(key) {
        super();

        this._key = key;
    }

    /**
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytes(data) {
        return new PublicKey(PublicKeyCrypto.fromBytes(data));
    }

    /**
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytesED25519(data) {
        return new PublicKey(PublicKeyCrypto.fromBytesED25519(data));
    }

    /**
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytesECDSA(data) {
        return new PublicKey(PublicKeyCrypto.fromBytesECDSA(data));
    }

    /**
     * Parse a public key from a string of hexadecimal digits.
     *
     * The public key may optionally be prefixed with
     * the DER header.
     *
     * @param {string} text
     * @returns {PublicKey}
     */
    static fromString(text) {
        return new PublicKey(PublicKeyCrypto.fromString(text));
    }

    /**
     * Parse an ECDSA public key from a string of hexadecimal digits.
     *
     * @param {string} text
     * @returns {PublicKey}
     */
    static fromStringECDSA(text) {
        return new PublicKey(PublicKeyCrypto.fromStringECDSA(text));
    }

    /**
     * Parse an ED25519 public key from a string of hexadecimal digits.
     *
     * @param {string} text
     * @returns {PublicKey}
     */
    static fromStringED25519(text) {
        return new PublicKey(PublicKeyCrypto.fromStringED25519(text));
    }

    /**
     * Verify a signature on a message with this public key.
     *
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        return this._key.verify(message, signature);
    }

    /**
     * Reports whether this key signed the given transaction.
     * @param {Transaction} transaction
     * @returns {boolean}
     */
    verifyTransaction(transaction) {
        transaction._requireFrozen();

        if (!transaction.isFrozen()) {
            transaction.freeze();
        }

        // Note: in other SDKs, we need to check the transaction's `_signerPublicKeys` since we don't build the `_signedTransactions` list
        // before we execute the transaction (execute -> makeRequest -> buildTransaction -> signTransaction).
        // However, in JavaScript, we build the `_signedTransactions` list while signing the transaction.
        for (const signedTransaction of transaction._signedTransactions.list) {
            if (
                signedTransaction.sigMap != null &&
                signedTransaction.sigMap.sigPair != null
            ) {
                let found = false;
                for (const sigPair of signedTransaction.sigMap.sigPair) {
                    const pubKeyPrefix = /** @type {Uint8Array} */ (
                        sigPair.pubKeyPrefix
                    );
                    if (arrayEqual(pubKeyPrefix, this.toBytesRaw())) {
                        found = true;

                        const bodyBytes = /** @type {Uint8Array} */ (
                            signedTransaction.bodyBytes
                        );

                        let signature = null;
                        if (sigPair.ed25519 != null) {
                            signature = sigPair.ed25519;
                        } else if (sigPair.ECDSASecp256k1 != null) {
                            signature = sigPair.ECDSASecp256k1;
                        }

                        if (signature == null) {
                            continue;
                        }

                        if (!this.verify(bodyBytes, signature)) {
                            return false;
                        }
                    }
                }

                if (!found) {
                    return false;
                }
            }
        }

        return true;
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
     * @deprecated Use `toEvmAddress()` instead.
     * @returns {string}
     */
    toEthereumAddress() {
        return this._key.toEthereumAddress();
    }

    /**
     * @returns {string}
     */
    toEvmAddress() {
        return this._key.toEthereumAddress();
    }

    /**
     * @returns {string}
     */
    toString() {
        return this._key.toString();
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
     * @param {PublicKey} other
     * @returns {boolean}
     */
    equals(other) {
        return this._key.equals(other._key);
    }

    /**
     * @returns {HieroProto.proto.IKey}
     */
    _toProtobufKey() {
        switch (this._key._type) {
            case "ED25519":
                return {
                    ed25519: this._key.toBytesRaw(),
                };
            case "secp256k1":
                return {
                    ECDSASecp256k1: this._key.toBytesRaw(),
                };
            default:
                throw new Error(`unrecognized key type ${this._key._type}`);
        }
    }

    /**
     * @param {Uint8Array} signature
     * @returns {HieroProto.proto.ISignaturePair}
     */
    _toProtobufSignature(signature) {
        switch (this._key._type) {
            case "ED25519":
                return {
                    pubKeyPrefix: this._key.toBytesRaw(),
                    ed25519: signature,
                };
            case "secp256k1":
                return {
                    pubKeyPrefix: this._key.toBytesRaw(),
                    ECDSASecp256k1: signature,
                };
            default:
                throw new Error(`unrecognized key type ${this._key._type}`);
        }
    }

    /**
     * @returns {string}
     */
    get type() {
        return this._key._type;
    }

    /**
     * @param {Long | number} shard
     * @param {Long | number} realm
     * @returns {AccountId}
     */
    toAccountId(shard, realm) {
        return CACHE.accountIdConstructor(shard, realm, this);
    }

    /**
     * Returns an "unusable" public key.
     * “Unusable” refers to a key such as an Ed25519 0x00000... public key,
     * since it is (presumably) impossible to find the 32-byte string whose SHA-512 hash begins with 32 bytes of zeros.
     *
     * @returns {PublicKey}
     */
    static unusableKey() {
        return PublicKey.fromStringED25519(
            "0000000000000000000000000000000000000000000000000000000000000000",
        );
    }
}

CACHE.setPublicKeyED25519((key) => PublicKey.fromBytesED25519(key));
CACHE.setPublicKeyECDSA((key) => PublicKey.fromBytesECDSA(key));
