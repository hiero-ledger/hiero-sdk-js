// SPDX-License-Identifier: Apache-2.0

import ManagedNode from "./ManagedNode.js";

/**
 * @typedef {import("./channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("./ManagedNodeAddress.js").default} ManagedNodeAddress
 */

/**
 * @typedef {object} NewNode
 * @property {string} address
 * @property {(address: string, cert?: string) => MirrorChannel} channelInitFunction
 */

/**
 * @typedef {object} CloneNode
 * @property {MirrorNode} node
 * @property {ManagedNodeAddress} address
 */

/**
 * @augments {ManagedNode<MirrorChannel>}
 */
export default class MirrorNode extends ManagedNode {
    /**
     * @param {object} props
     * @param {NewNode=} [props.newNode]
     * @param {CloneNode=} [props.cloneNode]
     */
    constructor(props = {}) {
        super(props);
    }

    /**
     * @returns {string}
     */
    getKey() {
        return this._address.toString();
    }

    /**
     * Gets the base URL for this mirror node's REST API.
     *
     * @returns {string} The base URL for the mirror node REST API
     * @throws {Error} When the mirror node has invalid address configuration
     */
    get mirrorRestApiBaseUrl() {
        const host = this.address.address;
        const port = this.address.port;

        if (!host || !port) {
            throw new Error("Mirror node has invalid address configuration");
        }

        // For localhost/127.0.0.1, mirror node gRPC and REST API use different ports
        // gRPC typically uses port 5600, but REST API uses port 5551
        // Note: Contract calls may use port 8545 (handled separately in MirrorNodeContractQuery)
        if (host === "localhost" || host === "127.0.0.1") {
            return `http://${host}:5551/api/v1`;
        }

        const scheme = this._getSchemeFromHostAndPort(host, port);

        return `${scheme}://${host}:${port}/api/v1`;
    }

    /**
     * Determines the appropriate scheme (http/https) based on the host and port.
     *
     * @private
     * @param {string} host - The host address
     * @param {number} port - The port number
     * @returns {string} - The scheme ('http' or 'https')
     */
    _getSchemeFromHostAndPort(host, port) {
        // For localhost and 127.0.0.1, use HTTP scheme
        if (host === "localhost" || host === "127.0.0.1") {
            return "http";
        }

        // Standard HTTP ports
        if (port === 80) {
            return "http";
        }

        // For other ports, assume HTTPS for security
        return "https";
    }
}
