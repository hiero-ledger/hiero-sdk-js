// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import Node from "../Node.js";
import {
    PREVIEWNET_ADDRESS_BOOK,
    TESTNET_ADDRESS_BOOK,
    MAINNET_ADDRESS_BOOK,
} from "../address_book/AddressBooks.js";
import ManagedNetwork from "./ManagedNetwork.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../address_book/NodeAddressBook.js").default} NodeAddressBook
 */

/**
 * @augments {ManagedNetwork<Channel, Node, AccountId>}
 */
export default class Network extends ManagedNetwork {
    /**
     * @param {(address: string) => Channel} createNetworkChannel
     */
    constructor(createNetworkChannel) {
        super(createNetworkChannel);

        this._maxNodesPerTransaction = -1;

        /** @type {NodeAddressBook | null} */
        this._addressBook = null;

        /** @type {boolean} */
        this._transportSecurity = false;
    }

    /**
     * @param {{[key: string]: (string | AccountId)}} network
     */
    setNetwork(network) {
        this._setNetwork(
            // eslint-disable-next-line ie11/no-collection-args
            new Map(
                // eslint-disable-next-line ie11/no-collection-args
                Object.entries(network).map(([key, value]) => {
                    return [
                        key,
                        typeof value === "string"
                            ? AccountId.fromString(value)
                            : value,
                    ];
                }),
            ),
        );
    }

    /**
     * @param {NodeAddressBook} addressBook
     * @returns {this}
     */
    setNetworkFromAddressBook(addressBook) {
        /** @type {Record<string, AccountId>} */
        const network = {};
        const port = this.isTransportSecurity() ? 50212 : 50211;

        for (const nodeAddress of addressBook.nodeAddresses) {
            for (const endpoint of nodeAddress.addresses) {
                // TODO: We hard code ports too much, should fix
                if (endpoint.port === port && nodeAddress.accountId != null) {
                    network[endpoint.toString()] = nodeAddress.accountId;
                }
            }
        }

        this.setNetwork(network);
        return this;
    }

    /**
     * @returns {{[key: string]: (string | AccountId)}}
     */
    get network() {
        /**
         * @type {{[key: string]: (string | AccountId)}}
         */
        var n = {};

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const node of this._nodes) {
            n[node.address.toString()] = node.accountId;
        }

        return n;
    }

    /**
     * @param {string} networkName
     * @returns {this}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNetworkName(networkName) {
        super.setLedgerId(networkName);

        switch (networkName) {
            case "mainnet":
                this._addressBook = MAINNET_ADDRESS_BOOK;
                break;
            case "testnet":
                this._addressBook = TESTNET_ADDRESS_BOOK;
                break;
            case "previewnet":
                this._addressBook = PREVIEWNET_ADDRESS_BOOK;
                break;
        }

        if (this._addressBook != null) {
            for (const node of this._nodes) {
                for (const address of this._addressBook.nodeAddresses) {
                    if (
                        address.accountId != null &&
                        address.accountId.toString() ===
                            node.accountId.toString()
                    ) {
                        node.setNodeAddress(address);
                    }
                }
            }
        }

        return this;
    }

    /**
     * @returns {string | null}
     */
    get networkName() {
        return this._ledgerId != null ? this._ledgerId.toString() : null;
    }

    /**
     * @abstract
     * @param {[string, (string | AccountId)]} entry
     * @returns {Node}
     */
    _createNodeFromNetworkEntry(entry) {
        const accountId =
            typeof entry[1] === "string"
                ? AccountId.fromString(entry[1])
                : entry[1];

        return new Node({
            newNode: {
                address: entry[0],
                accountId,
                channelInitFunction: this._createNetworkChannel,
            },
        }).setMinBackoff(this._minBackoff);
    }

    /**
     * @abstract
     * @param {Map<string, AccountId>} network
     * @returns {number[]}
     */
    _getNodesToRemove(network) {
        const indexes = [];

        for (let i = this._nodes.length - 1; i >= 0; i--) {
            const node = this._nodes[i];
            const accountId = network.get(node.address.toString());

            if (
                accountId == null ||
                accountId.toString() !== node.accountId.toString()
            ) {
                indexes.push(i);
            }
        }

        return indexes;
    }

    /**
     * @abstract
     * @param {[string, (string | AccountId)]} entry
     * @returns {boolean}
     */
    _checkNetworkContainsEntry(entry) {
        for (const node of this._nodes) {
            if (node.address.toString() === entry[0]) {
                return true;
            }
        }

        return false;
    }

    /**
     * @returns {number}
     */
    get maxNodesPerTransaction() {
        return this._maxNodesPerTransaction;
    }

    /**
     * @param {number} maxNodesPerTransaction
     * @returns {this}
     */
    setMaxNodesPerTransaction(maxNodesPerTransaction) {
        this._maxNodesPerTransaction = maxNodesPerTransaction;
        return this;
    }

    /**
     * @returns {number}
     */
    get maxNodeAttempts() {
        return this._maxNodeAttempts;
    }

    /**
     * @param {number} maxNodeAttempts
     * @returns {this}
     */
    setMaxNodeAttempts(maxNodeAttempts) {
        this._maxNodeAttempts = maxNodeAttempts;
        return this;
    }

    /**
     * @returns {boolean}
     */
    isTransportSecurity() {
        return this._transportSecurity;
    }

    /**
     * @param {boolean} transportSecurity
     * @returns {this}
     */
    setTransportSecurity(transportSecurity) {
        if (this._transportSecurity == transportSecurity) {
            return this;
        }

        this._network.clear();

        for (let i = 0; i < this._nodes.length; i++) {
            let node = this._nodes[i];
            node.close();

            node = /** @type {Node} */ (
                transportSecurity
                    ? node
                          .toSecure()
                          .setCert(
                              this._ledgerId != null
                                  ? this._ledgerId.toString()
                                  : "",
                          )
                    : node.toInsecure()
            );
            this._nodes[i] = node;

            const nodes =
                this._network.get(node.getKey()) != null
                    ? /** @type {Node[]} */ (this._network.get(node.getKey()))
                    : [];
            nodes.push(node);
            this._network.set(node.getKey(), nodes);
        }

        // Overwrite healthy node list since new ports might make the node work again
        this._healthyNodes = [...this._nodes];

        this._transportSecurity = transportSecurity;
        return this;
    }

    /**
     * @internal
     * @returns {number}
     */
    getNumberOfNodesForTransaction() {
        if (this._maxNodesPerTransaction > 0) {
            return this._maxNodesPerTransaction;
        }
        // ultimately it does not matter if we round up or down
        // if we round up, we will eventually take one more healthy node for execution
        // and we would hit the 'nodes.length == count' check in _getNumberOfMostHealthyNodes() less often
        return this._nodes.length <= 9
            ? this._nodes.length
            : Math.floor((this._nodes.length + 3 - 1) / 3);
    }

    /**
     * @internal
     * @returns {AccountId[]}
     */
    getNodeAccountIdsForExecute() {
        return this._getNumberOfMostHealthyNodes(
            this.getNumberOfNodesForTransaction(),
        ).map((node) => node.accountId);
    }
}
