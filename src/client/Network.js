import AccountId from "../account/AccountId.js";
import Node from "../Node.js";
import { _ledgerIdToNetworkName } from "../NetworkName.js";
import ManagedNetwork from "./ManagedNetwork.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 */

/**
 * @typedef {import("./Client.js").NetworkName} NetworkName
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
                })
            )
        );
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
     * @param {NetworkName} networkName
     * @returns {this}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setNetworkName(networkName) {
        super.setNetworkName(networkName);
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
     * @internal
     * @returns {number}
     */
    getNumberOfNodesForTransaction() {
        if (this._maxNodesPerTransaction > 0) {
            return this._maxNodesPerTransaction;
        }

        return (this._nodes.length + 3 - 1) / 3;
    }

    /**
     * @internal
     * @returns {AccountId[]}
     */
    getNodeAccountIdsForExecute() {
        return this._getNumberOfMostHealthyNodes(
            this.getNumberOfNodesForTransaction()
        ).map((node) => node.accountId);
    }
}
