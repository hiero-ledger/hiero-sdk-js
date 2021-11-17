import NodeAddress from "./NodeAddress.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").INodeAddressBook} proto.INodeAddressBook
 */

/**
 * @typedef {import("./NodeAddress.js").NodeAddressJson} NodeAddressJson
 */

/**
 * @typedef {object} NodeAddressBookJson
 * @property {NodeAddressJson[]} nodeAddresses
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
     * @internal
     * @param {proto.INodeAddressBook} nodeAddressBook
     * @returns {NodeAddressBook}
     */
    static _fromProtobuf(nodeAddressBook) {
        return new NodeAddressBook({
            nodeAddresses:
                nodeAddressBook.nodeAddress != null
                    ? nodeAddressBook.nodeAddress.map((nodeAddress) =>
                          NodeAddress._fromProtobuf(nodeAddress)
                      )
                    : undefined,
        });
    }

    /**
     * @returns {proto.INodeAddressBook}
     */
    _toProtobuf() {
        return {
            nodeAddress: this._nodeAddresses.map((nodeAddress) =>
                nodeAddress._toProtobuf()
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
                nodeAddress.toJSON()
            ),
        };
    }
}
