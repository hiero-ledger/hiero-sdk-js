import BadKeyError from "../BadKeyError.js";
import * as crypto from "./aes.js";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";
import * as hmac from "./hmac.js";
import * as pbkdf2 from "./pbkdf2.js";
import * as random from "./random.js";

const HMAC_SHA256 = "hmac-sha256";

/**
 * @typedef {object} KeystoreKdfParams
 * @property {number} dkLen
 * @property {string} salt
 * @property {number} c
 * @property {string} prf
 */

/**
 * @typedef {object} KeystoreCipherParams
 * @property {string} iv
 */

/**
 * @typedef {object} KeystoreCrypto
 * @property {string} ciphertext
 * @property {KeystoreCipherParams} cipherparams
 * @property {string} cipher
 * @property {string} kdf
 * @property {KeystoreKdfParams} kdfparams
 * @property {string} mac
 */

/**
 * @typedef {object} Keystore
 * @property {number} version
 * @property {KeystoreCrypto} crypto
 */

/**
 * @param {Uint8Array} privateKey
 * @param {string} passphrase
 * @returns {Promise<Uint8Array>}
 */
export async function createKeystore(privateKey, passphrase) {
    // all values taken from https://github.com/ethereumjs/ethereumjs-wallet/blob/de3a92e752673ada1d78f95cf80bc56ae1f59775/src/index.ts#L25
    const dkLen = 32;
    const c = 262144;
    const saltLen = 32;
    const salt = await random.bytesAsync(saltLen);

    const key = await pbkdf2.deriveKey(
        hmac.HashAlgorithm.Sha256,
        passphrase,
        salt,
        c,
        dkLen,
    );

    const iv = await random.bytesAsync(16);

    // AES-128-CTR with the first half of the derived key and a random IV
    const cipherText = await crypto.createCipheriv(
        crypto.CipherAlgorithm.Aes128Ctr,
        key.slice(0, 16),
        iv,
        privateKey,
    );

    const mac = await hmac.hash(
        hmac.HashAlgorithm.Sha384,
        key.slice(16),
        cipherText,
    );

    /**
     * @type {Keystore}
     */
    const keystore = {
        version: 1,
        crypto: {
            ciphertext: hex.encode(cipherText),
            cipherparams: { iv: hex.encode(iv) },
            cipher: crypto.CipherAlgorithm.Aes128Ctr,
            kdf: "pbkdf2",
            kdfparams: {
                dkLen,
                salt: hex.encode(salt),
                c,
                prf: HMAC_SHA256,
            },
            mac: hex.encode(mac),
        },
    };

    return utf8.encode(JSON.stringify(keystore));
}

/**
 * @param {Uint8Array} keystoreBytes
 * @param {string} passphrase
 * @returns {Promise<Uint8Array>}
 */
export async function loadKeystore(keystoreBytes, passphrase) {
    /**
     * @type {Keystore}
     */

    const keystore = JSON.parse(utf8.decode(keystoreBytes));

    if (keystore.version !== 1) {
        throw new BadKeyError(
            `unsupported keystore version: ${keystore.version}`,
        );
    }

    const {
        ciphertext,
        cipherparams: { iv },
        cipher,
        kdf,
        kdfparams: { dkLen, salt, c, prf },
        mac,
    } = keystore.crypto;

    if (kdf !== "pbkdf2") {
        throw new BadKeyError(`unsupported key derivation function:" + ${kdf}`);
    }

    if (prf !== HMAC_SHA256) {
        throw new BadKeyError(
            `unsupported key derivation hash function: ${prf}`,
        );
    }

    const saltBytes = hex.decode(salt);
    const ivBytes = hex.decode(iv);
    const cipherBytes = hex.decode(ciphertext);

    const key = await pbkdf2.deriveKey(
        hmac.HashAlgorithm.Sha256,
        passphrase,
        saltBytes,
        c,
        dkLen,
    );

    const macHex = hex.decode(mac);
    const verifyHmac = await hmac.hash(
        hmac.HashAlgorithm.Sha384,
        key.slice(16),
        cipherBytes,
    );

    // compare that these two Uint8Arrays are equivalent
    if (!macHex.every((b, i) => b === verifyHmac[i])) {
        throw new BadKeyError("HMAC mismatch; passphrase is incorrect");
    }

    return crypto.createDecipheriv(
        cipher,
        key.slice(0, 16),
        ivBytes,
        cipherBytes,
    );
}
