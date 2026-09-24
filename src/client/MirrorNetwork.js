// SPDX-License-Identifier: Apache-2.0

import MirrorNode from "../MirrorNode.js";
import ManagedNetwork from "./ManagedNetwork.js";

/**
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 */

/**
 * @augments {ManagedNetwork<MirrorChannel, MirrorNode, string>}
 */
export default class MirrorNetwork extends ManagedNetwork {
    /**
     * @param {(address: string) => MirrorChannel} channelInitFunction
     */
    constructor(channelInitFunction) {
        super(channelInitFunction);

        /**
         * Position of the next mirror node to serve a REST call. REST base
         * URLs are chosen round-robin over the configured mirror nodes, one
         * per call, so a two-node network with one node down is not a coin
         * flip re-flipped on every call. Unlike the gRPC mirror channel, a
         * REST transport failure never demotes a node.
         *
         * @private
         * @type {number}
         */
        this._restRoundRobinIndex = 0;
    }

    /**
     * @param {string[]} network
     */
    setNetwork(network) {
        this._setNetwork(new Map(network.map((address) => [address, address])));
    }

    /**
     * @returns {string[]}
     */
    get network() {
        /**
         * @type {string[]}
         */
        var n = [];

        for (const node of this._nodes) {
            n.push(node.address.toString());
        }

        return n;
    }

    /**
     * @abstract
     * @param {[string, string]} entry
     * @returns {MirrorNode}
     */
    _createNodeFromNetworkEntry(entry) {
        return new MirrorNode({
            newNode: {
                address: entry[1],
                channelInitFunction: this._createNetworkChannel,
            },
        }).setMinBackoff(this._minBackoff);
    }

    /**
     * @abstract
     * @param {Map<string, string>} network
     * @returns {number[]}
     */
    _getNodesToRemove(network) {
        const indexes = [];

        const values = Object.values(network);

        for (let i = this._nodes.length - 1; i >= 0; i--) {
            const node = this._nodes[i];

            if (!values.includes(node.address.toString())) {
                indexes.push(i);
            }
        }

        return indexes;
    }

    /**
     * @returns {MirrorNode}
     */
    getNextMirrorNode() {
        return this._getNumberOfMostHealthyNodes(1)[0];
    }

    /**
     * The mirror node the next REST call targets, chosen round-robin over
     * every configured mirror node. Every attempt and every page of that
     * call then targets the same node.
     *
     * @returns {MirrorNode}
     * @throws {Error} When no mirror network is configured
     */
    nextMirrorNodeForRest() {
        if (this._nodes.length === 0) {
            throw new Error(
                "Client has no mirror network configured or no healthy mirror nodes are available",
            );
        }

        const index = this._restRoundRobinIndex % this._nodes.length;
        this._restRoundRobinIndex = (index + 1) % this._nodes.length;
        return this._nodes[index];
    }

    /**
     * Gets the base URL for the mirror node REST API, advancing the
     * round-robin position.
     *
     * @returns {string} The base URL for the mirror node REST API
     * @throws {Error} When no mirror network is configured or available
     */
    get mirrorRestApiBaseUrl() {
        try {
            return this.nextMirrorNodeForRest().mirrorRestApiBaseUrl;
        } catch (error) {
            // Re-throw with a more descriptive error message
            throw new Error(
                "Client has no mirror network configured or no healthy mirror nodes are available",
            );
        }
    }
}
