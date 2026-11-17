import BadKeyError from "./BadKeyError.js";
import EcdsaPublicKey from "./EcdsaPublicKey.js";
import * as hex from "./encoding/hex.js";
import * as ecdsa from "./primitive/ecdsa.js";
import * as bip32 from "./primitive/bip32.js";
import { arrayStartsWith } from "./util/array.js";

const derPrefix = "3030020100300706052b8104000a04220420";
const derPrefixBytes = hex.decode(derPrefix);

const derPrefix2 = "30540201010420";
const derPrefixBytes2 = hex.decode(derPrefix2);

// SEC1 / PKCS#8 ECDSA private keys carry a 32-byte seed after a short ASN.1
// header. Anything shorter than header+32 cannot be a valid ECDSA DER key.
const minEcdsaDerLength = derPrefixBytes2.length + 32;

/**
 * @typedef {object} KeyPair
 * @property {Uint8Array} publicKey
 * @property {Uint8Array} privateKey
 */

export default class EcdsaPrivateKey {
    /**
     * @hideconstructor
     * @internal
     * @param {KeyPair} keyPair
     * @param {(Uint8Array)=} chainCode
     */
    constructor(keyPair, chainCode) {
        /**
         * @type {KeyPair}
         * @readonly
         * @private
         */
        this._keyPair = keyPair;

        /**
         * @type {?Uint8Array}
         * @readonly
         */
        this._chainCode = chainCode != null ? chainCode : null;
    }

    /**
     * @returns {string}
     */
    get _type() {
        return "secp256k1";
    }

    /**
     * Generate a random ECDSA private key.
     * @returns {EcdsaPrivateKey}
     */
    static generate() {
        return new EcdsaPrivateKey(ecdsa.generate());
    }

    /**
     * Generate a random Ed25519 private key.
     * @returns {Promise<EcdsaPrivateKey>}
     */
    static async generateAsync() {
        return new EcdsaPrivateKey(await ecdsa.generateAsync());
    }

    /**
     * Construct a private key from bytes.
     * @param {Uint8Array} data
     * @returns {EcdsaPrivateKey}
     */
    static fromBytes(data) {
        if (data.length === 32) {
            return EcdsaPrivateKey.fromBytesRaw(data);
        }

        // Common mix-up: EVM address (20 bytes) or other short hex. Reject
        // before the DER path so callers see expected vs actual length instead
        // of an opaque error from the cryptography primitive.
        if (data.length < minEcdsaDerLength) {
            throw new BadKeyError(
                `expected a 32-byte ECDSA private key (or ECDSA DER encoding), got ${data.length} bytes`,
            );
        }

        return EcdsaPrivateKey.fromBytesDer(data);
    }

    /**
     * Construct a private key from bytes.
     * @param {Uint8Array} data
     * @returns {EcdsaPrivateKey}
     */
    static fromBytesDer(data) {
        /** @type {Uint8Array} */
        let ecdsaPrivateKeyBytes;

        if (arrayStartsWith(data, derPrefixBytes)) {
            ecdsaPrivateKeyBytes = data.subarray(derPrefixBytes.length);
        } else {
            // SEC1 ECPrivateKey and similar forms share the same header size as
            // `derPrefix2` even when the SEQUENCE length byte differs, so the
            // 32-byte seed still starts at this offset (see encrypted PEM path).
            ecdsaPrivateKeyBytes = data.subarray(
                derPrefixBytes2.length,
                derPrefixBytes2.length + 32,
            );
        }

        if (ecdsaPrivateKeyBytes.length !== 32) {
            throw new BadKeyError(
                `expected a 32-byte ECDSA private key inside DER, got ${ecdsaPrivateKeyBytes.length} bytes`,
            );
        }

        try {
            return new EcdsaPrivateKey(ecdsa.fromBytes(ecdsaPrivateKeyBytes));
        } catch (error) {
            throw new BadKeyError(
                error instanceof Error
                    ? error
                    : `cannot decode ECDSA private key from DER: ${String(error)}`,
            );
        }
    }

    /**
     * Construct a private key from bytes.
     * @param {Uint8Array} data
     * @returns {EcdsaPrivateKey}
     */
    static fromBytesRaw(data) {
        if (data.length !== 32) {
            throw new BadKeyError(
                `expected a 32-byte ECDSA private key, got ${data.length} bytes`,
            );
        }

        try {
            return new EcdsaPrivateKey(ecdsa.fromBytes(data));
        } catch (error) {
            throw new BadKeyError(
                error instanceof Error
                    ? error
                    : `cannot decode ECDSA private key: ${String(error)}`,
            );
        }
    }

    /**
     * Construct a private key from a hex-encoded string.
     * @param {string} text
     * @returns {EcdsaPrivateKey}
     */
    static fromString(text) {
        return EcdsaPrivateKey.fromBytes(hex.decode(text));
    }

    /**
     * Construct a private key from a hex-encoded string.
     * @param {string} text
     * @returns {EcdsaPrivateKey}
     */
    static fromStringDer(text) {
        return EcdsaPrivateKey.fromBytesDer(hex.decode(text));
    }

    /**
     * Construct a private key from a hex-encoded string.
     * @param {string} text
     * @returns {EcdsaPrivateKey}
     */
    static fromStringRaw(text) {
        return EcdsaPrivateKey.fromBytesRaw(hex.decode(text));
    }

    /**
     * Construct a ECDSA private key from a Uint8Array seed.
     * @param {Uint8Array} seed
     * @returns {Promise<EcdsaPrivateKey>}
     */
    static async fromSeed(seed) {
        const { keyData, chainCode } = await bip32.fromSeed(seed);
        return new EcdsaPrivateKey(ecdsa.fromBytes(keyData), chainCode);
    }

    /**
     * Get the public key associated with this private key.
     *
     * The public key can be freely given and used by other parties to verify
     * the signatures generated by this private key.
     * @returns {EcdsaPublicKey}
     */
    get publicKey() {
        return new EcdsaPublicKey(this._keyPair.publicKey);
    }

    /**
     * Sign a message with this private key.
     * @param {Uint8Array} bytes
     * @returns {Uint8Array} - The signature bytes without the message
     */
    sign(bytes) {
        return ecdsa.sign(this._keyPair.privateKey, bytes);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesDer() {
        const bytes = new Uint8Array(derPrefixBytes.length + 32);
        const privateKey = this._keyPair.privateKey.subarray(0, 32);
        const leadingZeroes = 32 - privateKey.length;
        const privateKeyOffset = derPrefixBytes.length + leadingZeroes;
        bytes.set(derPrefixBytes, 0);
        bytes.set(privateKey, privateKeyOffset);
        return bytes;
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesRaw() {
        const privateKey = this._keyPair.privateKey.subarray(-32); // Takes the last 32 bytes (or fewer if shorter)
        const leadingZeroes = 32 - privateKey.length;
        const bytes = new Uint8Array(32);
        bytes.set(privateKey, leadingZeroes);
        return bytes;
    }

    /**
     * Recover the recovery ID used in the signature for the given message.
     * @param {Uint8Array} signature - 64-byte compact signature (r || s)
     * @param {Uint8Array} message - The original (unhashed) message
     * @returns {number} Recovery ID (0–3), or -1 if not found
     */
    getRecoveryId(signature, message) {
        return ecdsa.getRecoveryId(
            this._keyPair.privateKey,
            signature,
            message,
        );
    }
}
