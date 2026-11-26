// SPDX-License-Identifier: Apache-2.0

import PublicKey from "../PublicKey.js";
import { requireUint8Array, requireUint8ArrayLength } from "../util.js";
import { keccak256 } from "../cryptography/keccak.js";
import * as hex from "../encoding/hex.js";
import * as utf8 from "../encoding/utf8.js";

/**
 * @param {Uint8Array} bytes
 * @returns {Uint8Array}
 */
function keccak(bytes) {
    return hex.decode(keccak256(`0x${hex.encode(bytes)}`));
}

/**
 * Canonical bytes of a single key accepted as an RC3 Connector identity.
 * @param {PublicKey} identityKey
 * @returns {Uint8Array}
 */
export function encodePublicKey(identityKey) {
    if (!(identityKey instanceof PublicKey)) {
        throw new Error("identityKey must be an Ed25519 or ECDSA public key");
    }
    switch (identityKey.type) {
        case "secp256k1":
            return identityKey.toBytesRawUncompressed();
        case "ED25519":
            return identityKey.toBytesRaw();
        default:
            throw new Error(
                `Unsupported identity key type: ${identityKey.type}`,
            );
    }
}

/**
 * Derives the reusable Connector ID from the identity bytes and salt.
 * @param {PublicKey} identityKey
 * @param {Uint8Array} salt
 * @returns {Uint8Array}
 */
export function computeReusableConnectorId(identityKey, salt) {
    requireUint8ArrayLength(salt, 32, "salt");
    return keccak(new Uint8Array([...encodePublicKey(identityKey), ...salt]));
}

/**
 * keccak(chainId) || keccak(service) || keccak(verifier) for one ledger.
 * @param {string} chainId
 * @param {Uint8Array} service
 * @param {Uint8Array} verifier
 * @returns {Uint8Array}
 */
function endpointHashFields(chainId, service, verifier) {
    if (typeof chainId !== "string" || chainId.length === 0) {
        throw new Error("chain IDs must be non-empty strings");
    }
    return new Uint8Array([
        ...keccak(utf8.encode(chainId)),
        ...keccak(requireUint8Array(service)),
        ...keccak(requireUint8Array(verifier)),
    ]);
}

/**
 * Derives the Channel ID that RC3 checks on creation: keccak256 of both ledgers'
 * hashed (chain ID, service, verifier) fields in unsigned byte order, then the
 * salt. Either ledger derives the same ID.
 * @param {object} params
 * @param {string} params.localChainId
 * @param {Uint8Array} params.localService
 * @param {Uint8Array} params.localVerifier
 * @param {string} params.peerChainId
 * @param {Uint8Array} params.peerService
 * @param {Uint8Array} params.peerVerifier
 * @param {Uint8Array} params.salt
 * @returns {Uint8Array}
 */
export function computeChannelId(params) {
    requireUint8ArrayLength(params.salt, 32, "salt");
    const local = endpointHashFields(
        params.localChainId,
        params.localService,
        params.localVerifier,
    );
    const peer = endpointHashFields(
        params.peerChainId,
        params.peerService,
        params.peerVerifier,
    );
    const index = local.findIndex((byte, i) => byte !== peer[i]);
    const localFirst = index === -1 || local[index] < peer[index];
    const [first, second] = localFirst ? [local, peer] : [peer, local];
    return keccak(new Uint8Array([...first, ...second, ...params.salt]));
}
