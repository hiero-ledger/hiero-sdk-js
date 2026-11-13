import BadKeyError from "../BadKeyError.js";
import { EncryptedPrivateKeyInfo } from "../primitive/pkcs.js";
import * as der from "./der.js";
import * as base64 from "./base64.js";
import Ed25519PrivateKey from "../Ed25519PrivateKey.js";
import EcdsaPrivateKey from "../EcdsaPrivateKey.js";
import * as asn1 from "asn1js";
// @ts-ignore
import pemForge from "forge-light/lib/pem.js";
import * as hex from "./hex.js";
import * as aes from "../primitive/aes.js";

const ID_ED25519 = "1.3.101.112";

/**
 * Strip the PEM armor, any RFC 1421 headers and *all* whitespace, leaving only
 * the base64 body.
 *
 * `@scure/base` rejects whitespace and unpadded input, where the `Buffer`-based
 * decoder this replaced silently ignored both -- so every stray space or tab
 * has to go before decoding.
 * @param {string} pem
 * @returns {string}
 */
function pemBody(pem) {
    return pem
        .replace(/-----BEGIN (.*)-----|-----END (.*)-----/g, "")
        .replace(/Proc-Type:.*/g, "")
        .replace(/DEK-Info:.*/g, "")
        .replace(/\s/g, "");
}

/**
 * Base64-decode the body of a PEM string.
 * @param {string} pem
 * @returns {Uint8Array}
 */
function decodePemBody(pem) {
    try {
        return base64.decode(pemBody(pem));
    } catch (error) {
        const message =
            error != null && /** @type {Error} */ (error).message != null
                ? /** @type {Error} */ (error).message
                : "";

        throw new BadKeyError(
            `failed to decode PEM body as base64: ${message}`,
        );
    }
}

/**
 * @param {string} pem
 * @param {string} [passphrase]
 * @returns {Promise<Ed25519PrivateKey | EcdsaPrivateKey | Uint8Array>}
 */
export async function readPemED25519(pem, passphrase) {
    const key = decodePemBody(pem);
    if (passphrase) {
        let encrypted;

        try {
            encrypted = EncryptedPrivateKeyInfo.parse(key);
        } catch (error) {
            const message =
                error != null && /** @type {Error} */ (error).message != null
                    ? /** @type {Error} */ (error).message
                    : "";

            throw new BadKeyError(
                `failed to parse encrypted private key: ${message}`,
            );
        }

        const decrypted = await encrypted.decrypt(passphrase);

        let privateKey;

        if (decrypted.algId.algIdent === ID_ED25519) {
            privateKey = Ed25519PrivateKey;
        } else {
            throw new BadKeyError(
                `unknown private key algorithm ${decrypted.algId.toString()}`,
            );
        }

        const keyData = der.decode(decrypted.privateKey);

        if (!("bytes" in keyData)) {
            throw new BadKeyError(
                `expected ASN bytes, got ${JSON.stringify(keyData)}`,
            );
        }

        return privateKey.fromBytes(keyData.bytes);
    }

    // An unencrypted ED25519 key is a 48-byte PKCS#8 `PrivateKeyInfo`: the
    // 16-byte prefix `derPrefix` and the 32-byte key. `fromBytesDer()` checks
    // the prefix.
    if (key.length !== 48) {
        throw new BadKeyError(
            `invalid ED25519 private key length: ${key.length} bytes, expected 48`,
        );
    }

    return Ed25519PrivateKey.fromBytesDer(key);
}

/**
 * @param {string} pem
 * @param {string} [passphrase]
 * @returns {Promise<Ed25519PrivateKey | EcdsaPrivateKey | Uint8Array>}
 */
export async function readPemECDSA(pem, passphrase) {
    if (passphrase) {
        const decodedPem = pemForge.decode(pem)[0];
        /** @type {string} */

        const ivString = decodedPem.dekInfo.parameters;
        const iv = hex.decode(ivString);
        const key = await aes.messageDigest(passphrase, ivString);
        const dataToDecrypt = decodePemBody(pem);
        const keyDerBytes = await aes.createDecipheriv(
            aes.CipherAlgorithm.Aes128Cbc,
            key,
            iv,
            dataToDecrypt,
        );

        return EcdsaPrivateKey.fromBytesDer(keyDerBytes);
    } else {
        const key = decodePemBody(pem);
        const asnData = asn1.fromBER(key);
        const parsedKey = asnData.result;

        // A SEC1 `ECPrivateKey` is a SEQUENCE of the version (an INTEGER),
        // the 32-byte private key (an OCTET STRING) and optional fields.
        if (
            asnData.offset === -1 ||
            !(parsedKey instanceof asn1.Sequence) ||
            parsedKey.valueBlock.value.length < 2 ||
            !(parsedKey.valueBlock.value[0] instanceof asn1.Integer) ||
            !(parsedKey.valueBlock.value[1] instanceof asn1.OctetString) ||
            parsedKey.valueBlock.value[1].valueBlock.valueHexView.length !== 32
        ) {
            throw new BadKeyError(
                "invalid EC private key: expected a SEC1 ECPrivateKey",
            );
        }

        try {
            return EcdsaPrivateKey.fromBytesRaw(
                parsedKey.valueBlock.value[1].valueBlock.valueHexView,
            );
        } catch (error) {
            // the 32 bytes are not a secp256k1 private key, for example 0
            const message =
                error != null && /** @type {Error} */ (error).message != null
                    ? /** @type {Error} */ (error).message
                    : "";

            throw new BadKeyError(`invalid EC private key: ${message}`);
        }
    }
}

/**
 * @param {string} pem
 * @param {string} [passphrase]
 * @returns {Promise<Ed25519PrivateKey | EcdsaPrivateKey | Uint8Array>}
 */
export async function read(pem, passphrase) {
    // If not then it is ED25519 type
    const isEcdsa = pem.includes("BEGIN EC PRIVATE KEY") ? true : false;
    if (isEcdsa) {
        return readPemECDSA(pem, passphrase);
    } else {
        return readPemED25519(pem, passphrase);
    }
}
