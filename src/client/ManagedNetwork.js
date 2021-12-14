import { _ledgerIdToNetworkName, _ledgerIdToLedgerId } from "../NetworkName.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../Node.js").default} Node
 */

/**
 * @typedef {import("./Client.js").NetworkName} NetworkName
 */

/**
 * @template {Channel} ChannelT
 * @typedef {import("../ManagedNode.js").default<ChannelT>} ManagedNode
 */

/**
 * @template {Channel} ChannelT
 * @template {ManagedNode<ChannelT>} NetworkNodeT
 * @template {{ toString: () => string }} KeyT
 */
export default class MangedNetwork {
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

        /** @type {(address: string, cert?: string) => ChannelT} */
        this._createNetworkChannel = createNetworkChannel;

        /** @type {string | null} */
        this._ledgerId = null;

        /** @type {number} */
        this._minBackoff = 250;

        /** @type {number} */
        this._maxNodeAttempts = -1;

        this._transportSecurity = false;
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
        if (this._transportSecurity != transportSecurity) {
            this._network.clear();

            for (let i = 0; i < this._nodes.length; i++) {
                let node = this._nodes[i];
                node.close();

                node = /** @type {NetworkNodeT} */ (
                    transportSecurity
                        ? node
                              .toSecure()
                              .setCert(
                                  this._ledgerId != null ? this._ledgerId : ""
                              )
                        : node.toInsecure()
                );
                this._nodes[i] = node;

                const nodes =
                    this._network.get(node.getKey()) != null
                        ? /** @type {NetworkNodeT[]} */ (
                              this._network.get(node.getKey())
                          )
                        : [];
                nodes.push(node);
                this._network.set(node.getKey(), nodes);
            }
        }

        this._transportSecurity = transportSecurity;
        return this;
    }

    /**
     * @param {NetworkName} networkName
     * @returns {this}
     */
    setNetworkName(networkName) {
        this._ledgerId = _ledgerIdToLedgerId(networkName);
        return this;
    }

    /**
     * @returns {string | null}
     */
    get networkName() {
        return this._ledgerId != null
            ? _ledgerIdToNetworkName(this._ledgerId)
            : null;
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

                if (node._attempts < this._maxNodeAttempts) {
                    continue;
                }

                this._closeNode(i);
            }
        }
    }

    /**
     * @param {number} count
     * @returns {NetworkNodeT[]}
     */
    _getNumberOfMostHealthyNodes(count) {
        this._removeDeadNodes();
        this._nodes.sort((a, b) => a.compare(b));

        for (const [, value] of this._network) {
            // eslint-disable-next-line ie11/no-loop-func
            value.sort((a, b) => a.compare(b));
        }

        /** @type {NetworkNodeT[]} */
        const nodes = [];
        const keys = new Set();

        for (const node of this._nodes) {
            if (keys.size >= count) {
                break;
            }

            if (!keys.has(node.getKey())) {
                nodes.push(node);
            }
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
        // Remove nodes that are not in the new network
        for (const i of this._getNodesToRemove(network)) {
            this._closeNode(i);
        }

        // Add new nodes
        for (const [key, value] of network) {
            const node = this._createNodeFromNetworkEntry([key, value]);

            this._nodes.push(node);

            const network = this._network.has(node.getKey())
                ? /** @type {NetworkNodeT[]} */ (
                      this._network.get(node.getKey())
                  )
                : [];
            network.push(node);
            this._network.set(node.getKey(), network);
        }

        shuffle(this._nodes);
        for (const [, value] of this._network) {
            shuffle(value);
        }

        this._ledgerId = null;
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
     * @param {KeyT} key
     * @returns {NetworkNodeT}
     */
    getNode(key) {
        return /** @type {NetworkNodeT[]} */ (
            this._network.get(key.toString())
        )[0];
    }

    close() {
        for (const node of this._nodes) {
            node.close();
        }

        this._network.clear();
        this._nodes = [];
    }
}

/**
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 *
 * @template T
 * @param {Array<T>} array
 */
function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}
