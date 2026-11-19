// SPDX-License-Identifier: Apache-2.0

import { proto } from "@hiero-ledger/proto";
import * as utf8 from "../encoding/utf8.js";
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
            return {
                scheme: ClprSignatureScheme.ECDSA_SECP256K1,
                publicKey: publicKey.toBytesRawUncompressed(),
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
 * Matches the parsed ContractID oneof that CN reserializes for signing.
 * @param {import("@hiero-ledger/proto").proto.IContractID} contract
 * @returns {import("@hiero-ledger/proto").proto.IContractID}
 */
function signingContract(contract) {
    return contract.evmAddress != null
        ? { ...contract, contractNum: undefined }
        : contract;
}

/**
 * @param {import("../contract/ContractId.js").default} contract
 * @returns {Uint8Array}
 */
export function contractBytes(contract) {
    return proto.ContractID.encode(
        signingContract(contract._toProtobuf()),
    ).finish();
}

/**
 * Applies the same ContractID oneof rule inside compound administrative keys.
 * @param {import("@hiero-ledger/proto").proto.IKey} key
 * @returns {import("@hiero-ledger/proto").proto.IKey}
 */
function signingKey(key) {
    if (key.contractID != null) {
        return { contractID: signingContract(key.contractID) };
    }
    if (key.delegatableContractId != null) {
        return {
            delegatableContractId: signingContract(key.delegatableContractId),
        };
    }
    if (key.thresholdKey != null) {
        return {
            thresholdKey: {
                ...key.thresholdKey,
                keys: {
                    keys: key.thresholdKey.keys?.keys?.map(signingKey) ?? [],
                },
            },
        };
    }
    if (key.keyList != null) {
        return { keyList: { keys: key.keyList.keys?.map(signingKey) ?? [] } };
    }
    return key;
}

/**
 * @param {import("../Key.js").default} key
 * @returns {Uint8Array}
 */
export function keyBytes(key) {
    return proto.Key.encode(signingKey(key._toProtobufKey())).finish();
}

// shortcut: signing follows open CN fixes, repin after final EAP-0.2 vectors.
/**
 * Provisional CN #28017 (807100e2) preimage; final EAP vectors remain required.
 * @param {Uint8Array} channelId
 * @param {import("../contract/ContractId.js").default} verifierContract
 * @param {Uint8Array} configProof
 * @param {Uint8Array} manifestProof
 * @returns {Uint8Array}
 */
export function channelSigningPreimage(
    channelId,
    verifierContract,
    configProof,
    manifestProof,
) {
    return new Uint8Array([
        ...utf8.encode("hiero.clpr.complete-channel.v1"),
        ...channelId,
        ...hash(contractBytes(verifierContract)),
        ...hash(configProof),
        ...hash(manifestProof),
    ]);
}

/**
 * Provisional CN #28019 (453306c6) preimage; final EAP vectors remain required.
 * @param {Uint8Array} channelId
 * @param {Uint8Array} connectorId
 * @param {import("../contract/ContractId.js").default} connectorContract
 * @param {import("../Key.js").default} adminKey
 * @returns {Uint8Array}
 */
export function connectorSigningPreimage(
    channelId,
    connectorId,
    connectorContract,
    adminKey,
) {
    return new Uint8Array([
        ...utf8.encode("hiero.clpr.complete-connector.v1"),
        ...channelId,
        ...connectorId,
        ...CLPR_SERVICE_ADDRESS,
        ...hash(contractBytes(connectorContract)),
        ...hash(keyBytes(adminKey)),
    ]);
}

/**
 * @param {unknown} privateKey
 * @returns {asserts privateKey is PrivateKey}
 */
export function requirePrivateKey(privateKey) {
    if (!(privateKey instanceof PrivateKey)) {
        throw new Error("privateKey must be a PrivateKey");
    }
}

/**
 * Signs a CLPR ownership preimage without retaining the private key.
 * @param {PrivateKey} privateKey
 * @param {Uint8Array} preimage
 * @returns {OwnershipProof}
 */
export function sign(privateKey, preimage) {
    requirePrivateKey(privateKey);

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
