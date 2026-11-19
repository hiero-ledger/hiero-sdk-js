// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import keyFromJson from "../mirror_node/keyFromJson.js";

import RegisteredServiceEndpoint from "./RegisteredServiceEndpoint.js";

/** @typedef {import("../Key.js").default} Key */

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
