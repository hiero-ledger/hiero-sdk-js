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
 * @param {string} pem
 * @param {string} [passphrase]
 * @returns {Promise<Ed25519PrivateKey | EcdsaPrivateKey | Uint8Array>}
 */
export async function readPemED25519(pem, passphrase) {
    const key = base64.decode(pemBody(pem));
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

        let privateKey = null;

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

    return key.subarray(16);
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
        const dataToDecrypt = base64.decode(pemBody(pem));
        const keyDerBytes = await aes.createDecipheriv(
            aes.CipherAlgorithm.Aes128Cbc,
            key,
            iv,
            dataToDecrypt,
        );

        return EcdsaPrivateKey.fromBytesDer(keyDerBytes);
    } else {
        const key = base64.decode(pemBody(pem));
        const asnData = asn1.fromBER(key);
        const parsedKey = asnData.result;

        // @ts-ignore

        return parsedKey.valueBlock.value[1].valueBlock.valueHexView;
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
