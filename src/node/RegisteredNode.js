// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import Key from "../Key.js";
import RegisteredServiceEndpoint from "./RegisteredServiceEndpoint.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.state.addressbook.IRegisteredNode} IStateRegisteredNode
 */

/**
 * An immutable representation of a registered node.
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
     * @internal
     * @param {IStateRegisteredNode} registeredNode
     * @returns {RegisteredNode}
     */
    static _fromProtobuf(registeredNode) {
        return new RegisteredNode({
            registeredNodeId:
                registeredNode.registeredNodeId != null
                    ? registeredNode.registeredNodeId
                    : Long.ZERO,
            adminKey:
                registeredNode.adminKey != null
                    ? Key._fromProtobufKey(registeredNode.adminKey)
                    : (() => {
                          throw new Error(
                              "RegisteredNode protobuf did not include an adminKey.",
                          );
                      })(),
            description:
                registeredNode.description != null
                    ? registeredNode.description
                    : null,
            serviceEndpoints:
                registeredNode.serviceEndpoint != null
                    ? registeredNode.serviceEndpoint.map((endpoint) =>
                          RegisteredServiceEndpoint._fromProtobuf(endpoint),
                      )
                    : [],
        });
    }

    /**
     * @internal
     * @returns {IStateRegisteredNode}
     */
    _toProtobuf() {
        return {
            registeredNodeId: this.registeredNodeId,
            adminKey: this.adminKey._toProtobufKey(),
            description: this.description != null ? this.description : null,
            serviceEndpoint: this.serviceEndpoints.map((endpoint) =>
                endpoint._toProtobuf(),
            ),
        };
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {RegisteredNode}
     */
    static fromBytes(bytes) {
        return RegisteredNode._fromProtobuf(
            HieroProto.com.hedera.hapi.node.state.addressbook.RegisteredNode.decode(
                bytes,
            ),
        );
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.com.hedera.hapi.node.state.addressbook.RegisteredNode.encode(
            this._toProtobuf(),
        ).finish();
    }
}
