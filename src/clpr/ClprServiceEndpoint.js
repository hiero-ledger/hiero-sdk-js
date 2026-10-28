// SPDX-License-Identifier: Apache-2.0

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.state.clpr.ClprServiceEndpoint.$Properties} ServiceEndpointProtobuf
 */

/**
 * Read-only IP address and port for a CLPR endpoint.
 *
 * The IP address is an IPv4 or IPv6 numeric string.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 */
export default class ClprServiceEndpoint {
    /**
     * @private
     * @param {object} props
     * @param {string} props.ipAddress
     * @param {number} props.port
     */
    constructor(props) {
        /** @readonly */
        this.ipAddress = props.ipAddress;
        /** @readonly */
        this.port = props.port;

        Object.freeze(this);
    }

    /**
     * @internal
     * @param {ServiceEndpointProtobuf} endpoint
     * @returns {ClprServiceEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new ClprServiceEndpoint({
            ipAddress: endpoint.ipAddress ?? "",
            port: endpoint.port ?? 0,
        });
    }
}
