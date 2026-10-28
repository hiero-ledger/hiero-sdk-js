// SPDX-License-Identifier: Apache-2.0

import PublicKey from "../PublicKey.js";
import PrivateKey from "../PrivateKey.js";
import { requireUint8ArrayLength } from "../util.js";
import { keccak256 } from "../cryptography/keccak.js";
import * as hex from "../encoding/hex.js";
import ClprSignatureScheme from "./ClprSignatureScheme.js";
import OwnershipProof from "./OwnershipProof.js";

/** The CLPR system contract address used in Connector proof preimages. */
export const CLPR_SERVICE_ADDRESS = hex.decode(
    "000000000000000000000000000000000000016e",
);

/**
 * Encodes a key for CLPR ownership and derives the signature scheme.
 * @param {PublicKey} publicKey
 * @returns {{ scheme: ClprSignatureScheme, publicKey: Uint8Array }}
 */
export function encodePublicKey(publicKey) {
    if (!(publicKey instanceof PublicKey)) {
        throw new Error("ownership key must be a PublicKey");
    }

    switch (publicKey.type) {
        case "secp256k1": {
            // Keep access to the cryptography wrapper's internal public key here.
            const key =
                /** @type {{ _key: { toBytesRawUncompressed(): Uint8Array } }} */ (
                    /** @type {unknown} */ (publicKey._key)
                );
            return {
                scheme: ClprSignatureScheme.ECDSA_SECP256K1,
                publicKey: key._key.toBytesRawUncompressed(),
            };
        }
        case "ED25519":
            return {
                scheme: ClprSignatureScheme.ED25519,
                publicKey: publicKey.toBytesRaw(),
            };
        default:
            throw new Error(
                `unsupported ownership key type: ${publicKey.type}`,
            );
    }
}

/**
 * Hashes concatenated bytes using the SDK's keccak256 encoding.
 * @param {...Uint8Array} parts
 * @returns {Uint8Array}
 */
function hash(...parts) {
    return hex.decode(keccak256(`0x${parts.map(hex.encode).join("")}`));
}

/**
 * Computes keccak256(channelId || key).
 * @param {Uint8Array} channelId
 * @param {PublicKey} publicKey
 * @returns {Uint8Array}
 */
export function computeChannelCommitment(channelId, publicKey) {
    requireUint8ArrayLength(channelId, 32, "channelId");
    return hash(channelId, encodePublicKey(publicKey).publicKey);
}

/**
 * Computes keccak256(channelId || key || salt).
 * @param {Uint8Array} channelId
 * @param {PublicKey} publicKey
 * @param {Uint8Array} salt
 * @returns {Uint8Array}
 */
export function computeConnectorId(channelId, publicKey, salt) {
    requireUint8ArrayLength(channelId, 32, "channelId");
    requireUint8ArrayLength(salt, 32, "salt");
    return hash(channelId, encodePublicKey(publicKey).publicKey, salt);
}

/**
 * Computes keccak256(connectorId || key).
 * @param {Uint8Array} connectorId
 * @param {PublicKey} publicKey
 * @returns {Uint8Array}
 */
export function computeConnectorCommitment(connectorId, publicKey) {
    requireUint8ArrayLength(connectorId, 32, "connectorId");
    return hash(connectorId, encodePublicKey(publicKey).publicKey);
}

/**
 * Signs a CLPR ownership preimage without retaining the private key.
 * @param {PrivateKey} privateKey
 * @param {Uint8Array} preimage
 * @returns {OwnershipProof}
 */
export function sign(privateKey, preimage) {
    if (!(privateKey instanceof PrivateKey)) {
        throw new Error("privateKey must be a PrivateKey");
    }

    const { scheme, publicKey } = encodePublicKey(privateKey.publicKey);
    // ECDSA signing hashes internally. Ed25519 signing takes the digest directly.
    const message =
        scheme === ClprSignatureScheme.ED25519 ? hash(preimage) : preimage;
    return new OwnershipProof({
        scheme,
        publicKey,
        signature: privateKey.sign(message),
    });
}
