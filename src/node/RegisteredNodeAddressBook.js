// SPDX-License-Identifier: Apache-2.0

import RegisteredNode from "./RegisteredNode.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.state.addressbook.IRegisteredNode} IStateRegisteredNode
 */

/**
 * A collection of registered nodes.
 */
export default class RegisteredNodeAddressBook {
    /**
     * @param {object} [props]
     * @param {RegisteredNode[]} [props.registeredNodes]
     */
    constructor(props = {}) {
        /**
         * @readonly
         * @type {RegisteredNode[]}
         */
        this.registeredNodes =
            props.registeredNodes != null ? [...props.registeredNodes] : [];

        Object.freeze(this.registeredNodes);
        Object.freeze(this);
    }

    /**
     * @internal
     * @param {IStateRegisteredNode[]} registeredNodes
     * @returns {RegisteredNodeAddressBook}
     */
    static _fromProtobuf(registeredNodes) {
        return new RegisteredNodeAddressBook({
            registeredNodes: registeredNodes.map((registeredNode) =>
                RegisteredNode._fromProtobuf(registeredNode),
            ),
        });
    }
}
