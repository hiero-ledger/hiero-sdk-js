// SPDX-License-Identifier: Apache-2.0

import Query from "../query/Query.js";
import ClprEndpointManifestInfo from "./ClprEndpointManifestInfo.js";

/**
 * @typedef {import("@hiero-ledger/proto").proto.IQuery} ProtoQuery
 * @typedef {import("@hiero-ledger/proto").proto.IQueryHeader} QueryHeader
 * @typedef {import("@hiero-ledger/proto").proto.IResponse} ProtoResponse
 * @typedef {import("@hiero-ledger/proto").proto.IResponseHeader} ResponseHeader
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.ClprGetEndpointManifestResponse.$Properties} ManifestResponse
 * @typedef {import("../channel/Channel.js").default} Channel
 */

/**
 * Read the current CLPR endpoint manifest with the standard query payment flow.
 * Execution requires an operator and looks up the cost unless a payment is set.
 *
 * The manifest and its state proof are paired and should be kept together.
 * An empty state proof is a successful read; retry later for proof material.
 * CLPR needs the network setting `clpr.enabled`, which a network can turn off.
 * @augments {Query<ClprEndpointManifestInfo>}
 */
export default class ClprGetEndpointManifestQuery extends Query {
    constructor() {
        super();

        /**
         * @private
         * @type {boolean}
         */
        this._forManifestRecovery = false;
    }

    /**
     * @internal
     * @param {ProtoQuery} query
     * @returns {ClprGetEndpointManifestQuery}
     */
    static _fromProtobuf(query) {
        return new ClprGetEndpointManifestQuery().setForManifestRecovery(
            query?.clprGetEndpointManifest?.forManifestRecovery === true,
        );
    }

    /**
     * Requests a manifest-only proof shaped for a recovery
     * ClprSubmitBundleTransaction instead of Channel creation.
     *
     * @param {boolean} forManifestRecovery
     * @returns {this}
     */
    setForManifestRecovery(forManifestRecovery) {
        this._forManifestRecovery = forManifestRecovery === true;
        return this;
    }

    /**
     * @returns {boolean}
     */
    get forManifestRecovery() {
        return this._forManifestRecovery;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ProtoQuery} request
     * @returns {Promise<ProtoResponse>}
     */
    _execute(channel, request) {
        return channel.clpr.getEndpointManifest(request);
    }

    /**
     * @override
     * @internal
     * @param {ProtoResponse} response
     * @returns {ResponseHeader}
     */
    _mapResponseHeader(response) {
        const manifest = /** @type {ManifestResponse} */ (
            response.clprGetEndpointManifest
        );
        return /** @type {ResponseHeader} */ (manifest.header);
    }

    /**
     * @override
     * @protected
     * @param {ProtoResponse} response
     * @returns {Promise<ClprEndpointManifestInfo>}
     */
    _mapResponse(response) {
        return Promise.resolve(
            ClprEndpointManifestInfo._fromProtobuf(
                /** @type {ManifestResponse} */ (
                    response.clprGetEndpointManifest
                ),
            ),
        );
    }

    /**
     * @override
     * @internal
     * @param {QueryHeader} header
     * @returns {ProtoQuery}
     */
    _onMakeRequest(header) {
        return {
            clprGetEndpointManifest: {
                header,
                // Omit false so default queries keep their existing bytes.
                forManifestRecovery: this._forManifestRecovery || null,
            },
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        return `ClprGetEndpointManifestQuery:${this._timestamp.toString()}`;
    }
}
