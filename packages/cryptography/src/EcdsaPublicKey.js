import Key from "./Key.js";
import BadKeyError from "./BadKeyError.js";
import { arrayEqual } from "./util/array.js";
import * as hex from "./encoding/hex.js";
import * as ecdsa from "./primitive/ecdsa.js";
import { keccak256 } from "./primitive/keccak.js";
import elliptic from "elliptic";
const ec = new elliptic.ec("secp256k1");

const legacyDerPrefix = "302d300706052b8104000a032200";
const legacyDerPrefixBytes = hex.decode(legacyDerPrefix);

const derPrefix = "3036301006072a8648ce3d020106052b8104000a032200";
const derPrefixBytes = hex.decode(derPrefix);

/**
 * An public key on the Hedera™ network.
 */
export default class EcdsaPublicKey extends Key {
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
        return "secp256k1";
    }

    /**
     * @param {Uint8Array} data
     * @returns {EcdsaPublicKey}
     */
    static fromBytes(data) {
        switch (data.length) {
            case 33:
                return EcdsaPublicKey.fromBytesRaw(data);
            default:
                return EcdsaPublicKey.fromBytesDer(data);
        }
    }

    /**
     * @param {Uint8Array} data
     * @returns {EcdsaPublicKey}
     */
    static fromBytesDer(data) {
        /** @type {Uint8Array} */
        let ecdsaPublicKeyBytes = new Uint8Array();

        switch (data.length) {
            case 47: // In the case of legace DER prefix
                ecdsaPublicKeyBytes = data.subarray(
                    legacyDerPrefixBytes.length,
                );
                break;
            case 56: // The lengths of all other bytePrefixes is equal, so we treat them equally
                ecdsaPublicKeyBytes = data.subarray(
                    derPrefixBytes.length,
                    derPrefixBytes.length + 33,
                );
                break;
            default: // In the case of uncompressed DER prefix public keys
                /* eslint-disable no-case-declarations */
                const keyPair = ec.keyFromPublic(
                    data.subarray(derPrefixBytes.length),
                    "der",
                );

                const pk = keyPair.getPublic();

                const compressedPublicKeyBytes = pk.encodeCompressed("hex");
                ecdsaPublicKeyBytes = hex.decode(compressedPublicKeyBytes);
                break;
            /* eslint-enable no-case-declarations */
        }
        if (ecdsaPublicKeyBytes.length == 0) {
            throw new BadKeyError(
                `cannot decode ECDSA private key data from DER format`,
            );
        }
        return new EcdsaPublicKey(ecdsaPublicKeyBytes);
    }

    /**
     * @param {Uint8Array} data
     * @returns {EcdsaPublicKey}
     */
    static fromBytesRaw(data) {
        if (data.length != 33) {
            throw new BadKeyError(
                `invalid public key length: ${data.length} bytes`,
            );
        }

        return new EcdsaPublicKey(data);
    }

    /**
     * Parse a public key from a string of hexadecimal digits.
     *
     * The public key may optionally be prefixed with
     * the DER header.
     * @param {string} text
     * @returns {EcdsaPublicKey}
     */
    static fromString(text) {
        return EcdsaPublicKey.fromBytes(hex.decode(text));
    }

    /**
     * Verify a signature on a message with this public key.
     * @param {Uint8Array} message
     * @param {Uint8Array} signature
     * @returns {boolean}
     */
    verify(message, signature) {
        return ecdsa.verify(this._keyData, message, signature);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesDer() {
        const bytes = new Uint8Array(
            legacyDerPrefixBytes.length + this._keyData.length,
        );

        bytes.set(legacyDerPrefixBytes, 0);
        bytes.set(this._keyData, legacyDerPrefixBytes.length);

        return bytes;
    }

    /**
     * @returns {Uint8Array}
     */
    toBytesRaw() {
        return new Uint8Array(this._keyData.subarray());
    }

    /**
     * @returns {string}
     */
    toEthereumAddress() {
        const hash = hex.decode(
            keccak256(
                `0x${hex.encode(
                    ecdsa.getFullPublicKey(this.toBytesRaw()).subarray(1),
                )}`,
            ),
        );
        return hex.encode(hash.subarray(12));
    }

    /**
     * @param {EcdsaPublicKey} other
     * @returns {boolean}
     */
    equals(other) {
        return arrayEqual(this._keyData, other._keyData);
    }
}
