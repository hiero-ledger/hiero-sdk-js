// SPDX-License-Identifier: Apache-2.0

import LedgerId from "../LedgerId.js";
import * as util from "../util.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../Node.js").default} Node
 * @typedef {import("../MirrorNode.js").default} MirrorNode
 * @typedef {import("../address_book/NodeAddressBook.js").default} NodeAddressBook
 */

/**
 * @template {Channel | MirrorChannel} ChannelT
 * @typedef {import("../ManagedNode.js").default<ChannelT>} ManagedNode
 */

/**
 * @template {Channel | MirrorChannel} ChannelT
 * @template {ManagedNode<ChannelT>} NetworkNodeT
 * @template {{ toString: () => string }} KeyT
 */
export default class ManagedNetwork {
    /**
     * @param {(address: string) => ChannelT} createNetworkChannel
     */
    constructor(createNetworkChannel) {
        /**
         * Map of node account ID (as a string)
         * to the node URL.
         *
         * @internal
         * @type {Map<string, NetworkNodeT[]>}
         */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this._network = new Map();

        /**
         * List of node account IDs.
         *
         * @protected
         * @type {NetworkNodeT[]}
         */
        this._nodes = [];

        /**
         * List of node account IDs.
         *
         * @protected
         * @type {NetworkNodeT[]}
         */
        this._healthyNodes = [];

        /** @type {(address: string, cert?: string) => ChannelT} */
        this._createNetworkChannel = createNetworkChannel;

        /** @type {LedgerId | null} */
        this._ledgerId = null;

        this._minBackoff = 8000;
        this._maxBackoff = 1000 * 60 * 60;

        /** @type {number} */
        this._maxNodeAttempts = -1;

        this._nodeMinReadmitPeriod = this._minBackoff;
        this._nodeMaxReadmitPeriod = this._maxBackoff;

        this._earliestReadmitTime = Date.now() + this._nodeMinReadmitPeriod;
    }

    /**
     * @deprecated
     * @param {string} networkName
     * @returns {this}
     */
    setNetworkName(networkName) {
        console.warn("Deprecated: Use `setLedgerId` instead");
        return this.setLedgerId(networkName);
    }

    /**
     * @deprecated
     * @returns {string | null}
     */
    get networkName() {
        console.warn("Deprecated: Use `ledgerId` instead");
        return this.ledgerId != null ? this.ledgerId.toString() : null;
    }

    /**
     * @param {string|LedgerId} ledgerId
     * @returns {this}
     */
    setLedgerId(ledgerId) {
        this._ledgerId =
            typeof ledgerId === "string"
                ? LedgerId.fromString(ledgerId)
                : ledgerId;
        return this;
    }

    /**
     * @returns {LedgerId | null}
     */
    get ledgerId() {
        return this._ledgerId != null ? this._ledgerId : null;
    }

    /**
     * @abstract
     * @param {[string, KeyT]} entry
     * @returns {NetworkNodeT}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _createNodeFromNetworkEntry(entry) {
        throw new Error("not implemented");
    }

    /**
     * @abstract
     * @param {Map<string, KeyT>} network
     * @returns {number[]}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getNodesToRemove(network) {
        throw new Error("not implemented");
    }

    _removeDeadNodes() {
        if (this._maxNodeAttempts > 0) {
            for (let i = this._nodes.length - 1; i >= 0; i--) {
                const node = this._nodes[i];

                if (node._badGrpcStatusCount < this._maxNodeAttempts) {
                    continue;
                }

                this._closeNode(i);
            }
        }
    }

    _readmitNodes() {
        const now = Date.now();

        if (this._earliestReadmitTime <= now) {
            let nextEarliestReadmitTime = Number.MAX_SAFE_INTEGER;
            let searchForNextEarliestReadmitTime = true;

            outer: for (let i = 0; i < this._nodes.length; i++) {
                for (let j = 0; j < this._healthyNodes.length; j++) {
                    if (
                        searchForNextEarliestReadmitTime &&
                        this._nodes[i]._readmitTime > now
                    ) {
                        nextEarliestReadmitTime = Math.min(
                            this._nodes[i]._readmitTime,
                            nextEarliestReadmitTime,
                        );
                    }

                    if (this._nodes[i] == this._healthyNodes[j]) {
                        continue outer;
                    }
                }

                searchForNextEarliestReadmitTime = false;

                if (this._nodes[i]._readmitTime <= now) {
                    this._healthyNodes.push(this._nodes[i]);
                }
            }

            this._earliestReadmitTime = Math.min(
                Math.max(nextEarliestReadmitTime, this._nodeMinReadmitPeriod),
                this._nodeMaxReadmitPeriod,
            );
        }
    }

    /**
     * @param {number} count
     * @returns {NetworkNodeT[]}
     */
    _getNumberOfMostHealthyNodes(count) {
        this._removeDeadNodes();
        this._readmitNodes();

        const nodes = [];
        // Create a shallow for safe iteration
        let healthyNodes = this._healthyNodes.slice();
        count = Math.min(count, healthyNodes.length);

        for (let i = 0; i < count; i++) {
            // Select a random index
            const nodeIndex = Math.floor(Math.random() * healthyNodes.length);
            const selectedNode = healthyNodes[nodeIndex];

            // Check if the node exists
            if (!selectedNode) {
                break; // Break out of the loop if undefined node is selected
            }

            // Add the selected node in array for execution
            nodes.push(selectedNode);
            // Remove all nodes with the same account id as
            // the selected node account id from the array
            healthyNodes = healthyNodes.filter(
                // eslint-disable-next-line ie11/no-loop-func
                (node) => node.getKey() !== selectedNode.getKey(),
            );
        }

        return nodes;
    }

    /**
     * @param {number} i
     */
    _closeNode(i) {
        const node = this._nodes[i];

        node.close();
        this._removeNodeFromNetwork(node);
        this._nodes.splice(i, 1);
    }

    /**
     * @param {NetworkNodeT} node
     */
    _removeNodeFromNetwork(node) {
        const network = /** @type {NetworkNodeT[]} */ (
            this._network.get(node.getKey())
        );

        for (let j = 0; j < network.length; j++) {
            if (network[j] === node) {
                network.splice(j, 1);
                break;
            }
        }

        if (network.length === 0) {
            this._network.delete(node.getKey());
        }
    }

    /**
     * @param {Map<string, KeyT>} network
     * @returns {this}
     */
    _setNetwork(network) {
        /** @type {NetworkNodeT[]} */
        const newNodes = [];
        const newNodeKeys = new Set();
        const newNodeAddresses = new Set();

        /** @type {NetworkNodeT[]} */
        const newHealthyNodes = [];

        /** @type {Map<string, NetworkNodeT[]>} */
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const newNetwork = new Map();

        // Remove nodes that are not in the new network
        for (const i of this._getNodesToRemove(network)) {
            this._closeNode(i);
        }

        // Copy all the unclosed nodes
        for (const node of this._nodes) {
            newNodes.push(node);
            newNodeKeys.add(node.getKey());
            newNodeAddresses.add(node.address.toString());
        }

        // Add new nodes
        for (const [key, value] of network) {
            if (
                newNodeKeys.has(value.toString()) &&
                newNodeAddresses.has(key)
            ) {
                continue;
            }
            newNodes.push(this._createNodeFromNetworkEntry([key, value]));
        }

        // Shuffle the nodes so we don't immediately pick the first nodes
        util.shuffle(newNodes);

        // Copy all the nodes into the healhty nodes list initially
        // and push the nodes into the network; this maintains the
        // shuffled state from `newNodes`
        for (const node of newNodes) {
            if (!node.isHealthy()) {
                continue;
            }

            newHealthyNodes.push(node);

            const newNetworkNodes = newNetwork.has(node.getKey())
                ? /** @type {NetworkNodeT[]} */ (newNetwork.get(node.getKey()))
                : [];
            newNetworkNodes.push(node);
            newNetwork.set(node.getKey(), newNetworkNodes);
        }

        this._nodes = newNodes;
        this._healthyNodes = newHealthyNodes;
        this._network = newNetwork;

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
     * @returns {number}
     */
    get minBackoff() {
        return this._minBackoff;
    }

    /**
     * @param {number} minBackoff
     * @returns {this}
     */
    setMinBackoff(minBackoff) {
        this._minBackoff = minBackoff;
        for (const node of this._nodes) {
            node.setMinBackoff(minBackoff);
        }
        return this;
    }

    /**
     * @returns {number}
     */
    get maxBackoff() {
        return this._maxBackoff;
    }

    /**
     * @param {number} maxBackoff
     * @returns {this}
     */
    setMaxBackoff(maxBackoff) {
        this._maxBackoff = maxBackoff;
        for (const node of this._nodes) {
            node.setMaxBackoff(maxBackoff);
        }
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeMinReadmitPeriod() {
        return this._nodeMinReadmitPeriod;
    }

    /**
     * @param {number} nodeMinReadmitPeriod
     * @returns {this}
     */
    setNodeMinReadmitPeriod(nodeMinReadmitPeriod) {
        this._nodeMinReadmitPeriod = nodeMinReadmitPeriod;
        this._earliestReadmitTime = Date.now() + this._nodeMinReadmitPeriod;
        return this;
    }

    /**
     * @returns {number}
     */
    get nodeMaxReadmitPeriod() {
        return this._nodeMaxReadmitPeriod;
    }

    /**
     * @param {number} nodeMaxReadmitPeriod
     * @returns {this}
     */
    setNodeMaxReadmitPeriod(nodeMaxReadmitPeriod) {
        this._nodeMaxReadmitPeriod = nodeMaxReadmitPeriod;
        return this;
    }

    /**
     * @param {KeyT=} key
     * @returns {NetworkNodeT}
     */
    getNode(key) {
        this._readmitNodes();
        if (key != null && key != undefined) {
            const lockedNodes = this._network.get(key.toString());
            if (lockedNodes) {
                const randomNodeAddress = Math.floor(
                    Math.random() * lockedNodes.length,
                );
                return /** @type {NetworkNodeT[]} */ (lockedNodes)[
                    randomNodeAddress
                ];
            } else {
                const nodes = Array.from(this._network.keys());
                const randomNodeAccountId =
                    nodes[Math.floor(Math.random() * nodes.length)];

                const randomNode = this._network.get(randomNodeAccountId);
                // We get the `randomNodeAccountId` from the network mapping,
                // so it cannot be `undefined`
                const randomNodeAddress = Math.floor(
                    // @ts-ignore
                    Math.random() * randomNode.length,
                );
                // @ts-ignore
                return randomNode[randomNodeAddress];
            }
        } else {
            if (this._healthyNodes.length == 0) {
                throw new Error("failed to find a healthy working node");
            }

            return this._healthyNodes[
                Math.floor(Math.random() * this._healthyNodes.length)
            ];
        }
    }

    /**
     * @param {NetworkNodeT} node
     */
    increaseBackoff(node) {
        node.increaseBackoff();

        for (let i = 0; i < this._healthyNodes.length; i++) {
            if (this._healthyNodes[i] == node) {
                this._healthyNodes.splice(i, 1);
            }
        }
    }

    /**
     * @param {NetworkNodeT} node
     */
    decreaseBackoff(node) {
        node.decreaseBackoff();
    }

    close() {
        for (const node of this._nodes) {
            node.close();
        }

        this._network.clear();
        this._nodes = [];
    }
}
