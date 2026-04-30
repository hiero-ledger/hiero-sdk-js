// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import * as hex from "../encoding/hex.js";
import Key from "../Key.js";
import PublicKey from "../PublicKey.js";
import RegisteredServiceEndpoint from "./RegisteredServiceEndpoint.js";

/**
 * Mirror-node REST shape for an admin key. The mirror node returns one of:
 * - `{ _type: "ED25519", key: "<hex>" }`
 * - `{ _type: "ECDSA_SECP256K1", key: "<hex>" }`
 * - `{ _type: "ProtobufEncoded", key: "<hex of encoded proto Key>" }`
 *
 * @typedef {object} MirrorNodeKeyJson
 * @property {string} key
 * @property {string} _type
 */

/**
 * Mirror-node REST shape for a single registered node returned from the
 * `/api/v1/network/registered-nodes` endpoint.
 *
 * @typedef {object} RegisteredNodeJson
 * @property {MirrorNodeKeyJson} admin_key
 * @property {?string} [created_timestamp]
 * @property {?string} [description]
 * @property {number | string | Long} registered_node_id
 * @property {import("./RegisteredServiceEndpoint.js").RegisteredServiceEndpointJson[]} service_endpoints
 * @property {{from: string, to: ?string}} timestamp
 */

/**
 * An immutable representation of a registered node, as returned by
 * `RegisteredNodeAddressBookQuery`. Constructed from mirror-node JSON via
 * `RegisteredNode._fromJson`.
 */
export default class RegisteredNode {
    /**
     * @param {object} props
     * @param {Long | number} props.registeredNodeId
     * @param {Key} props.adminKey
     * @param {?string} [props.description]
     * @param {RegisteredServiceEndpoint[]} props.serviceEndpoints
     */
    constructor(props) {
        if (props == null) {
            throw new TypeError("RegisteredNode props are required.");
        }

        if (props.registeredNodeId == null) {
            throw new TypeError("RegisteredNode requires a registeredNodeId.");
        }

        if (props.adminKey == null) {
            throw new TypeError("RegisteredNode requires an adminKey.");
        }

        if (props.serviceEndpoints == null) {
            throw new TypeError(
                "RegisteredNode requires a serviceEndpoints array.",
            );
        }

        /**
         * @readonly
         * @type {Long}
         */
        this.registeredNodeId = Long.fromValue(props.registeredNodeId);

        /**
         * @readonly
         * @type {Key}
         */
        this.adminKey = props.adminKey;

        /**
         * @readonly
         * @type {?string}
         */
        this.description = props.description != null ? props.description : null;

        /**
         * @readonly
         * @type {RegisteredServiceEndpoint[]}
         */
        this.serviceEndpoints = [...props.serviceEndpoints];

        Object.freeze(this.serviceEndpoints);
        Object.freeze(this);
    }

    /**
     * Construct a `RegisteredNode` from a mirror-node REST JSON object.
     *
     * @internal
     * @param {RegisteredNodeJson} json
     * @returns {RegisteredNode}
     */
    static _fromJson(json) {
        return new RegisteredNode({
            registeredNodeId: Long.fromString(
                json.registered_node_id.toString(),
            ),
            adminKey: keyFromJson(json.admin_key),
            description: json.description != null ? json.description : null,
            serviceEndpoints: json.service_endpoints.map((endpoint) =>
                RegisteredServiceEndpoint._fromJson(endpoint),
            ),
        });
    }
}

/**
 * Decode a mirror-node JSON admin key into a `Key`. Handles the three
 * documented shapes (`ED25519`, `ECDSA_SECP256K1`, and a generic
 * `ProtobufEncoded` envelope used for complex keys like `KeyList` and
 * `ThresholdKey`).
 *
 * @param {MirrorNodeKeyJson} key
 * @returns {Key}
 */
function keyFromJson(key) {
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
