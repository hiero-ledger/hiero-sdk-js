import Key from "./Key.js";
import BadKeyError from "./BadKeyError.js";
import nacl from "tweetnacl";
import { arrayEqual } from "./util/array.js";
import * as hex from "./encoding/hex.js";

const derPrefix = "302a300506032b6570032100";
const derPrefixBytes = hex.decode(derPrefix);

/**
 * An public key on the Hedera™ network.
 */
export default class Ed25519PublicKey extends Key {
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
     * @returns {string}
     */
    get _type() {
        return "ED25519";
    }

    /**
     * @param {Uint8Array} data
     * @returns {Ed25519PublicKey}
     */
    static fromBytes(data) {
        switch (data.length) {
            case 32:
                return Ed25519PublicKey.fromBytesRaw(data);
            case 44:
                return Ed25519PublicKey.fromBytesDer(data);
            default:
                throw new BadKeyError(
                    `invalid public key length: ${data.length} bytes`,
                );
        }
    }

    /**
     * @param {Uint8Array} data
     * @returns {Ed25519PublicKey}
     */
    static fromBytesDer(data) {
        try {
            // Verify minimum length (44 bytes is standard for Ed25519 public key in DER)
            if (data.length !== 44) {
                throw new Error(`invalid length: ${data.length} bytes`);
            }

            const actualPrefix = data.subarray(0, 12);

            if (!actualPrefix.every((byte, i) => byte === derPrefixBytes[i])) {
                throw new Error("invalid DER prefix");
            }
            // Extract the public key (last 32 bytes)
            const publicKey = data.subarray(12);
            return new Ed25519PublicKey(publicKey);
        } catch (error) {
            throw new BadKeyError(
                `cannot decode ED25519 public key data from DER format: ${
                    error instanceof Error ? error.message : "unknown error"
                }`,
            );
        }
    }

    /**
     * @param {Uint8Array} data
     * @returns {Ed25519PublicKey}
     */
    static fromBytesRaw(data) {
        if (data.length != 32) {
            throw new BadKeyError(
                `invalid public key length: ${data.length} bytes`,
            );
        }

        return new Ed25519PublicKey(data);
    }

    /**
     * Parse a public key from a string of hexadecimal digits.
     *
     * The public key may optionally be prefixed with
     * the DER header.
     * @param {string} text
     * @returns {Ed25519PublicKey}
     */
    static fromString(text) {
        return Ed25519PublicKey.fromBytes(hex.decode(text));
    }

    /**
     * Verify a signature on a message with this public key.
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        return nacl.sign.detached.verify(message, signature, this._keyData);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesDer() {
        const bytes = new Uint8Array(derPrefixBytes.length + 32);

        bytes.set(derPrefixBytes, 0);
        bytes.set(this._keyData.subarray(0, 32), derPrefixBytes.length);

        return bytes;
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesRaw() {
        return this._keyData.slice();
    }

    /**
     * @param {Ed25519PublicKey} other
     * @returns {boolean}
     */
    equals(other) {
        return arrayEqual(this._keyData, other._keyData);
    }
}
