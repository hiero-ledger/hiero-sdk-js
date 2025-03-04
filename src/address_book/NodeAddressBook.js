// SPDX-License-Identifier: Apache-2.0

import NodeAddress from "./NodeAddress.js";
import * as HieroProto from "@hashgraph/proto";

/**
 * @typedef {import("./NodeAddress.js").NodeAddressJson} NodeAddressJson
 */

/**
 * @typedef {object} NodeAddressBookJson
 * @property {NodeAddressJson[]} nodeAddresses
 */

/**
 * Represents a collection of node addresses in the Hedera network.
 *
 * The NodeAddressBook contains information about the nodes in the Hedera network,
 * including their network addresses, account IDs, and node IDs. This class is used
 * to manage and access the network's node information.
 */
export default class NodeAddressBook {
    /**
     * @param {object} props
     * @param {NodeAddress[]} [props.nodeAddresses]
     */
    constructor(props = {}) {
        /**
         * @type {NodeAddress[]}
         */
        this._nodeAddresses = [];

        if (props.nodeAddresses != null) {
            this.setNodeAddresses(props.nodeAddresses);
        }
    }

    /**
     * @returns {NodeAddress[]}
     */
    get nodeAddresses() {
        return this._nodeAddresses;
    }

    /**
     * @param {NodeAddress[]} nodeAddresses
     * @returns {this}
     */
    setNodeAddresses(nodeAddresses) {
        this._nodeAddresses = nodeAddresses;
        return this;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {NodeAddressBook}
     */
    static fromBytes(bytes) {
        return NodeAddressBook._fromProtobuf(
            HieroProto.proto.NodeAddressBook.decode(bytes),
        );
    }

    /**
     * @internal
     * @param {HieroProto.proto.INodeAddressBook} nodeAddressBook
     * @returns {NodeAddressBook}
     */
    static _fromProtobuf(nodeAddressBook) {
        return new NodeAddressBook({
            nodeAddresses:
                nodeAddressBook.nodeAddress != null
                    ? nodeAddressBook.nodeAddress.map((nodeAddress) =>
                          NodeAddress._fromProtobuf(nodeAddress),
                      )
                    : undefined,
        });
    }

    /**
     * @returns {HieroProto.proto.INodeAddressBook}
     */
    _toProtobuf() {
        return {
            nodeAddress: this._nodeAddresses.map((nodeAddress) =>
                nodeAddress._toProtobuf(),
            ),
        };
    }

    /**
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this.toJSON());
    }

    /**
     * @returns {NodeAddressBookJson}
     */
    toJSON() {
        return {
            nodeAddresses: this._nodeAddresses.map((nodeAddress) =>
                nodeAddress.toJSON(),
            ),
        };
    }

    toBytes() {
        return HieroProto.proto.NodeAddressBook.encode(
            this._toProtobuf(),
        ).finish();
    }
}
