// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("./RegisteredNode.js").default} RegisteredNode
 */

/**
 * A collection of registered nodes returned by
 * `RegisteredNodeAddressBookQuery`.
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
}
