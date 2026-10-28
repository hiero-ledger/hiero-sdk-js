// SPDX-License-Identifier: Apache-2.0

import ClprServiceEndpoint from "./ClprServiceEndpoint.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.state.clpr.ClprEndpoint.$Properties} EndpointProtobuf
 */

/**
 * Read-only endpoint participating in a CLPR service's syncs.
 *
 * The TLS certificate and account ID remain opaque bytes. Mutable values
 * returned by this model are copies.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 */
export default class ClprEndpoint {
    /** @type {ClprServiceEndpoint} */
    #serviceEndpoint;

    /** @type {Uint8Array} */
    #tlsCertificate;

    /** @type {Uint8Array} */
    #accountId;

    /**
     * @private
     * @param {object} props
     * @param {ClprServiceEndpoint} props.serviceEndpoint
     * @param {Uint8Array} props.tlsCertificate
     * @param {Uint8Array} props.accountId
     */
    constructor(props) {
        this.#serviceEndpoint = ClprServiceEndpoint._fromProtobuf(
            props.serviceEndpoint,
        );
        this.#tlsCertificate = new Uint8Array(props.tlsCertificate);
        this.#accountId = new Uint8Array(props.accountId);

        Object.freeze(this);
    }

    /**
     * Network address and port.
     * @returns {ClprServiceEndpoint}
     */
    get serviceEndpoint() {
        return ClprServiceEndpoint._fromProtobuf(this.#serviceEndpoint);
    }

    /**
     * DER-encoded certificate for mutual TLS transport.
     * @returns {Uint8Array}
     */
    get tlsCertificate() {
        return new Uint8Array(this.#tlsCertificate);
    }

    /**
     * Raw on-ledger account identifier associated with this endpoint.
     * @returns {Uint8Array}
     */
    get accountId() {
        return new Uint8Array(this.#accountId);
    }

    /**
     * @internal
     * @param {EndpointProtobuf} endpoint
     * @returns {ClprEndpoint}
     */
    static _fromProtobuf(endpoint) {
        return new ClprEndpoint({
            serviceEndpoint: ClprServiceEndpoint._fromProtobuf(
                endpoint.serviceEndpoint ?? {},
            ),
            tlsCertificate: endpoint.tlsCertificate ?? new Uint8Array(),
            accountId: endpoint.accountId ?? new Uint8Array(),
        });
    }
}
