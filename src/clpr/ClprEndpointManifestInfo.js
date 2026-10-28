// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import ClprEndpoint from "./ClprEndpoint.js";

/**
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.ClprGetEndpointManifestResponse.$Properties} ManifestResponse
 */

/**
 * Read-only CLPR endpoint manifest paired with its opaque state proof.
 *
 * Keep the manifest and proof together when constructing a peer endpoint cache
 * or a manifest recovery request. An empty proof is a successful read when no
 * signed snapshot is available yet; retry later for proof material.
 * Mutable values returned by this model are copies, and endpoint lists are frozen.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 */
export default class ClprEndpointManifestInfo {
    /** @type {Long} */
    #version;

    /** @type {Uint8Array} */
    #serviceAddress;

    /** @type {ReadonlyArray<ClprEndpoint>} */
    #endpoints;

    /** @type {Uint8Array} */
    #manifestStateProof;

    /**
     * @private
     * @param {object} props
     * @param {Long} props.version
     * @param {Uint8Array} props.serviceAddress
     * @param {ReadonlyArray<ClprEndpoint>} props.endpoints
     * @param {Uint8Array} props.manifestStateProof
     */
    constructor(props) {
        this.#version = Long.fromValue(props.version, true);
        this.#serviceAddress = new Uint8Array(props.serviceAddress);
        this.#endpoints = Object.freeze([...props.endpoints]);
        this.#manifestStateProof = new Uint8Array(props.manifestStateProof);

        Object.freeze(this);
    }

    /**
     * Manifest version, preserving the full unsigned uint64 range.
     * @returns {Long}
     */
    get version() {
        return Long.fromValue(this.#version, true);
    }

    /**
     * On-ledger address of the CLPR service this manifest belongs to.
     * @returns {Uint8Array}
     */
    get serviceAddress() {
        return new Uint8Array(this.#serviceAddress);
    }

    /**
     * Current endpoint set as a frozen list copy, which may be empty.
     * @returns {ReadonlyArray<ClprEndpoint>}
     */
    get endpoints() {
        return Object.freeze([...this.#endpoints]);
    }

    /**
     * State proof paired with this manifest. Empty bytes are a successful read.
     * @returns {Uint8Array}
     */
    get manifestStateProof() {
        return new Uint8Array(this.#manifestStateProof);
    }

    /**
     * @internal
     * @param {ManifestResponse} response
     * @returns {ClprEndpointManifestInfo}
     */
    static _fromProtobuf(response) {
        const manifest = response.manifest ?? {};

        return new ClprEndpointManifestInfo({
            version: Long.fromValue(manifest.version ?? 0, true),
            serviceAddress: manifest.serviceAddress ?? new Uint8Array(),
            endpoints: (manifest.endpoints ?? []).map((endpoint) =>
                ClprEndpoint._fromProtobuf(endpoint),
            ),
            manifestStateProof: response.manifestStateProof ?? new Uint8Array(),
        });
    }
}
