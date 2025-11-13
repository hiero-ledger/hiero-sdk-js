import Key from "./Key.js";
import BadKeyError from "./BadKeyError.js";
import Ed25519PublicKey from "./Ed25519PublicKey.js";
import EcdsaPublicKey from "./EcdsaPublicKey.js";
import { arrayEqual } from "./util/array.js";
import * as hex from "./encoding/hex.js";

/**
 * @typedef {import("./PrivateKey.js").Transaction} Transaction
 */

/**
 * An public key on the Hedera™ network.
 */
export default class PublicKey extends Key {
    /**
     * @internal
     * @hideconstructor
     * @param {Ed25519PublicKey | EcdsaPublicKey} key
     */
    constructor(key) {
        super();

        /**
         * @type {Ed25519PublicKey | EcdsaPublicKey}
         * @private
         * @readonly
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
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytes(data) {
        let message;
        try {
            return new PublicKey(Ed25519PublicKey.fromBytes(data));
        } catch (error) {
            message =
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                error != null && /** @type {Error} */ (error).message != null
                    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      /** @type {Error} */ (error).message
                    : "";
        }

        try {
            return new PublicKey(EcdsaPublicKey.fromBytes(data));
        } catch (error) {
            message =
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                error != null && /** @type {Error} */ (error).message != null
                    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                      /** @type {Error} */ (error).message
                    : "";
        }

        throw new BadKeyError(
            `public key cannot be decoded from bytes: ${message}`,
        );
    }

    /**
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytesED25519(data) {
        return new PublicKey(Ed25519PublicKey.fromBytes(data));
    }

    /**
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytesECDSA(data) {
        return new PublicKey(EcdsaPublicKey.fromBytes(data));
    }

    /**
     * Parse a public key from a string of hexadecimal digits.
     *
     * The public key may optionally be prefixed with
     * the DER header.
     * @param {string} text
     * @returns {PublicKey}
     */
    static fromString(text) {
        return PublicKey.fromBytes(hex.decode(text));
    }

    /**
     * @param {string} text
     * @returns {PublicKey}
     */
    static fromStringED25519(text) {
        return PublicKey.fromBytesED25519(hex.decode(text));
    }

    /**
     * @param {string} text
     * @returns {PublicKey}
     */
    static fromStringECDSA(text) {
        return PublicKey.fromBytesECDSA(hex.decode(text));
    }

    /**
     * Verify a signature on a message with this public key.
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        return this._key.verify(message, signature);
    }

    /**
     * @deprecated - use `@hiero-ledger/sdk`.PublicKey instead
     * @param {Transaction} transaction
     * @returns {boolean}
     */
    verifyTransaction(transaction) {
        //NOSONAR
        console.log("Deprecated: use `@hiero-ledger/sdk`.PublicKey instead");

        transaction._requireFrozen();

        if (!transaction.isFrozen()) {
            transaction.freeze();
        }

        for (const signedTransaction of transaction._signedTransactions) {
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
                        const signature =
                            sigPair.ed25519 != null
                                ? sigPair.ed25519
                                : /** @type {Uint8Array} */ (
                                      sigPair.ECDSASecp256k1
                                  );
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
        if (this._key instanceof Ed25519PublicKey) {
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
     * @returns {string}
     */
    toEthereumAddress() {
        if (this._key instanceof EcdsaPublicKey) {
            return this._key.toEthereumAddress();
        } else {
            throw new Error("unsupported operation on Ed25519PublicKey");
        }
    }

    /**
     * @param {PublicKey} other
     * @returns {boolean}
     */
    equals(other) {
        if (
            this._key instanceof Ed25519PublicKey &&
            other._key instanceof Ed25519PublicKey
        ) {
            return this._key.equals(other._key);
        } else if (
            this._key instanceof EcdsaPublicKey &&
            other._key instanceof EcdsaPublicKey
        ) {
            return this._key.equals(other._key);
        } else {
            return false;
        }
    }
}
