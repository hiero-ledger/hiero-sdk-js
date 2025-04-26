import Key from "./Key.js";
import { arrayEqual, arrayStartsWith } from "./util/array.js";
import BadKeyError from "./BadKeyError.js";
import * as hex from "./encoding/hex.js";
import * as naclSign from './util/nacl-sign.js'


/**
 * @typedef {import("./PrivateKey.js").Transaction} Transaction
 */

const derPrefix = "302a300506032b6570032100";
const derPrefixBytes = hex.decode(derPrefix);

/**
 * An public key on the Hedera™ network.
 */
export default class PublicKey extends Key {
    /**
     * @internal
     * @hideconstructor
     * @param {Uint8Array} keyData
     */
    constructor(keyData) {
        super();

        /**
         * @type {Uint8Array}
         * @private
         * @readonly
         */
        this._keyData = keyData;
    }

    /**
     * @param {Uint8Array} data
     * @returns {PublicKey}
     */
    static fromBytes(data) {
        switch (data.length) {
            case 32:
                return new PublicKey(data);

            case 44:
                if (arrayStartsWith(data, derPrefixBytes)) {
                    return new PublicKey(data.subarray(12));
                }

                break;

            default:
        }

        throw new BadKeyError(
            `invalid public key length: ${data.length} bytes`
        );
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
        return PublicKey.fromBytes(hex.decode(text));
    }

    /**
     * Verify a signature on a message with this public key.
     *
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        return naclSign.detachedVerify(message, signature, this._keyData);
    }

    /**
     * @param {Transaction} transaction
     * @returns {boolean}
     */
    verifyTransaction(transaction) {
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
                    if (arrayEqual(pubKeyPrefix, this._keyData)) {
                        found = true;
                        const bodyBytes = /** @type {Uint8Array} */ (
                            signedTransaction.bodyBytes
                        );
                        const signature = /** @type {Uint8Array} */ (
                            sigPair.ed25519
                        );
                        if (
                            !naclSign.detachedVerify(
                                bodyBytes,
                                signature,
                                this._keyData
                            )
                        ) {
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
        return this._keyData.slice();
    }

    /**
     * @returns {string}
     */
    toString() {
        return derPrefix + hex.encode(this._keyData);
    }

    /**
     * @param {PublicKey} other
     * @returns {boolean}
     */
    equals(other) {
        return arrayEqual(this._keyData, other._keyData);
    }
}
