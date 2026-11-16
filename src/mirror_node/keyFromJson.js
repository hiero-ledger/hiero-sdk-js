// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import * as hex from "../encoding/hex.js";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";

/** @typedef {import("../node/RegisteredNode.js").MirrorNodeKeyJson} MirrorNodeKeyJson */

/**
 * Decode a mirror-node JSON admin key into a `Key`. Handles the three
 * documented shapes (`ED25519`, `ECDSA_SECP256K1`, and a generic
 * `ProtobufEncoded` envelope used for complex keys like `KeyList` and
 * `ThresholdKey`).
 *
 * @param {MirrorNodeKeyJson} key
 * @returns {Key}
 */
export default function keyFromJson(key) {
    if (
        typeof key?._type !== "string" ||
        typeof key.key !== "string" ||
        !hex.isHexString(key.key)
    ) {
        throw new Error("Mirror node returned a malformed admin key.");
    }
    const keyType = key._type.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    switch (keyType) {
        case "ED25519":
            return PublicKey.fromStringED25519(key.key);
        case "ECDSASECP256K1":
            return PublicKey.fromStringECDSA(key.key);
        case "PROTOBUFENCODED": {
            const protobufKey = HieroProto.proto.Key.decode(
                hex.decode(key.key),
            );
            const decodedKey = Key._fromProtobufKey(protobufKey);

            if (decodedKey == null) {
                throw new Error(
                    "Mirror node returned a protobuf-encoded admin key that could not be decoded.",
                );
            }

            return decodedKey;
        }
        default:
            throw new Error(
                `Unsupported registered node admin key type: ${key._type}`,
            );
    }
}
