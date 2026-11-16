// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Timestamp from "../Timestamp.js";
import ClprThrottles from "./ClprThrottles.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.ClprGetLedgerConfigurationResponse.$Properties} ConfigurationResponse
 */

/**
 * Read-only CLPR ledger configuration and its opaque state proof.
 *
 * Configuration fields are live, while the proof describes a signed snapshot.
 * An empty proof is a successful read when no signed snapshot is available yet.
 * Mutable values returned by this model are copies.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 */
export default class ClprLedgerConfigurationInfo {
    /** @type {Uint8Array} */
    #serviceAddress;

    /** @type {Timestamp} */
    #timestamp;

    /** @type {ClprThrottles} */
    #throttles;

    /** @type {Uint8Array} */
    #initialTrustAnchor;

    /** @type {Uint8Array} */
    #initialTrustAnchorId;

    /** @type {Uint8Array} */
    #configurationStateProof;

    /**
     * @private
     * @param {object} props
     * @param {number} props.protocolVersion
     * @param {string} props.chainId
     * @param {Uint8Array} props.serviceAddress
     * @param {Timestamp} props.timestamp
     * @param {ClprThrottles} props.throttles
     * @param {Uint8Array} props.initialTrustAnchor
     * @param {Uint8Array} props.initialTrustAnchorId
     * @param {Uint8Array} props.configurationStateProof
     */
    constructor(props) {
        /** @readonly */
        this.protocolVersion = props.protocolVersion;
        /** @readonly */
        this.chainId = props.chainId;

        this.#serviceAddress = new Uint8Array(props.serviceAddress);
        this.#timestamp = new Timestamp(
            Long.fromValue(props.timestamp.seconds),
            Long.fromValue(props.timestamp.nanos),
        );
        this.#throttles = ClprThrottles._fromProtobuf(
            props.throttles._toProtobuf(),
        );
        this.#initialTrustAnchor = new Uint8Array(props.initialTrustAnchor);
        this.#initialTrustAnchorId = new Uint8Array(props.initialTrustAnchorId);
        this.#configurationStateProof = new Uint8Array(
            props.configurationStateProof,
        );

        Object.freeze(this);
    }

    /**
     * This ledger's CLPR service address.
     * @returns {Uint8Array}
     */
    get serviceAddress() {
        return new Uint8Array(this.#serviceAddress);
    }

    /**
     * Consensus time of the last configuration update.
     * @returns {Timestamp}
     */
    get timestamp() {
        return new Timestamp(
            Long.fromValue(this.#timestamp.seconds),
            Long.fromValue(this.#timestamp.nanos),
        );
    }

    /**
     * The ledger's capacity limits, including any server values outside the
     * configuration-update rules.
     * @returns {ClprThrottles}
     */
    get throttles() {
        return ClprThrottles._fromProtobuf(this.#throttles._toProtobuf());
    }

    /**
     * Opaque starting trust anchor.
     * @returns {Uint8Array}
     */
    get initialTrustAnchor() {
        return new Uint8Array(this.#initialTrustAnchor);
    }

    /**
     * Opaque identifier for the starting trust anchor.
     * @returns {Uint8Array}
     */
    get initialTrustAnchorId() {
        return new Uint8Array(this.#initialTrustAnchorId);
    }

    /**
     * Snapshot state proof. Empty bytes are a successful read.
     * @returns {Uint8Array}
     */
    get configurationStateProof() {
        return new Uint8Array(this.#configurationStateProof);
    }

    /**
     * @internal
     * @param {ConfigurationResponse} response
     * @returns {ClprLedgerConfigurationInfo}
     */
    static _fromProtobuf(response) {
        const configuration = response.configuration ?? {};

        return new ClprLedgerConfigurationInfo({
            protocolVersion: configuration.protocolVersion ?? 0,
            chainId: configuration.chainId ?? "",
            serviceAddress: configuration.serviceAddress ?? new Uint8Array(),
            timestamp: Timestamp._fromProtobuf(configuration.timestamp ?? {}),
            throttles: ClprThrottles._fromProtobuf(
                configuration.throttles ?? {},
            ),
            initialTrustAnchor:
                configuration.initialTrustAnchor ?? new Uint8Array(),
            initialTrustAnchorId:
                configuration.initialTrustAnchorId ?? new Uint8Array(),
            configurationStateProof:
                response.configurationStateProof ?? new Uint8Array(),
        });
    }
}
