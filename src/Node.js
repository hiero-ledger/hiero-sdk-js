import ManagedNode from "./ManagedNode.js";
import { _ledgerIdToNetworkName } from "./NetworkName.js";

/**
 * @typedef {import("./account/AccountId.js").default} AccountId
 * @typedef {import("./channel/Channel.js").default} Channel
 * @typedef {import("./ManagedNodeAddress.js").default} ManagedNodeAddress
 */

/**
 * @typedef {object} NewNode
 * @property {AccountId} accountId
 * @property {string} address
 * @property {(address: string) => Channel} channelInitFunction
 */

/**
 * @typedef {object} CloneNode
 * @property {Node} node
 * @property {ManagedNodeAddress} address
 */

/**
 * @augments {ManagedNode<Channel>}
 */
export default class Node extends ManagedNode {
    /**
     * @param {object} props
     * @param {NewNode=} [props.newNode]
     * @param {CloneNode=} [props.cloneNode]
     */
    constructor(props = {}) {
        super(props);

        if (props.newNode != null) {
            /** @type {AccountId} */
            this._accountId = props.newNode.accountId;
        } else if (props.cloneNode != null) {
            /** @type {AccountId} */
            this._accountId = props.cloneNode.node._accountId;
        } else {
            throw new Error(`failed to create node: ${JSON.stringify(props)}`);
        }
    }

    /**
     * @returns {string}
     */
    getKey() {
        return this._accountId.toString();
    }

    /**
     * @returns {ManagedNode<Channel>}
     */
    toInsecure() {
        return /** @type {this} */ (
            new Node({
                cloneNode: { node: this, address: this._address.toInsecure() },
            })
        );
    }

    /**
     * @returns {ManagedNode<Channel>}
     */
    toSecure() {
        return /** @type {this} */ (
            new Node({
                cloneNode: { node: this, address: this._address.toSecure() },
            })
        );
    }

    /**
     * @returns {AccountId}
     */
    get accountId() {
        return this._accountId;
    }
}
