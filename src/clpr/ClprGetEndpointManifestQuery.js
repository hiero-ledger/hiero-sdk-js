// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
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
 * Read the current CLPR endpoint manifest without an operator or payment.
 * Execution sends no cost request.
 *
 * The manifest and its state proof are paired and should be kept together.
 * An empty state proof is a successful read; retry later for proof material.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 * @augments {Query<ClprEndpointManifestInfo>}
 */
export default class ClprGetEndpointManifestQuery extends Query {
    /**
     * @internal
     * @returns {ClprGetEndpointManifestQuery}
     */
    static _fromProtobuf() {
        return new ClprGetEndpointManifestQuery();
    }

    /**
     * @override
     * @protected
     * @returns {boolean}
     */
    _isPaymentRequired() {
        return false;
    }

    /**
     * Build the execution request without a payment transaction.
     * @override
     * @internal
     * @returns {Promise<ProtoQuery>}
     */
    _makeRequestAsync() {
        return Promise.resolve(this._makeRequest());
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
        return { clprGetEndpointManifest: { header } };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        return `ClprGetEndpointManifestQuery:${this._timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "clprGetEndpointManifest",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprGetEndpointManifestQuery._fromProtobuf,
);
