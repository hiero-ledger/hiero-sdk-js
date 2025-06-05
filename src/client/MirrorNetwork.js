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
    }

    /**
     * @param {string[]} network
     */
    setNetwork(network) {
        // eslint-disable-next-line ie11/no-collection-args
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
}
