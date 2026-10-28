// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import ClprLedgerConfigurationInfo from "./ClprLedgerConfigurationInfo.js";

/**
 * @typedef {import("@hiero-ledger/proto").proto.IQuery} ProtoQuery
 * @typedef {import("@hiero-ledger/proto").proto.IQueryHeader} QueryHeader
 * @typedef {import("@hiero-ledger/proto").proto.IResponse} ProtoResponse
 * @typedef {import("@hiero-ledger/proto").proto.IResponseHeader} ResponseHeader
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.clpr.ClprGetLedgerConfigurationResponse.$Properties} ConfigurationResponse
 * @typedef {import("../channel/Channel.js").default} Channel
 */

/**
 * Read the current CLPR ledger configuration without an operator or payment.
 * Execution sends no cost request.
 *
 * Configuration fields are live, while the state proof is a signed snapshot.
 * An empty state proof is a successful read; retry later for proof material.
 * CLPR is off by default and must be enabled with `clpr.enabled`.
 * @augments {Query<ClprLedgerConfigurationInfo>}
 */
export default class ClprGetLedgerConfigurationQuery extends Query {
    /**
     * @internal
     * @returns {ClprGetLedgerConfigurationQuery}
     */
    static _fromProtobuf() {
        return new ClprGetLedgerConfigurationQuery();
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
        return channel.clpr.getLedgerConfiguration(request);
    }

    /**
     * @override
     * @internal
     * @param {ProtoResponse} response
     * @returns {ResponseHeader}
     */
    _mapResponseHeader(response) {
        const configuration = /** @type {ConfigurationResponse} */ (
            response.clprGetLedgerConfiguration
        );
        return /** @type {ResponseHeader} */ (configuration.header);
    }

    /**
     * @override
     * @protected
     * @param {ProtoResponse} response
     * @returns {Promise<ClprLedgerConfigurationInfo>}
     */
    _mapResponse(response) {
        return Promise.resolve(
            ClprLedgerConfigurationInfo._fromProtobuf(
                /** @type {ConfigurationResponse} */ (
                    response.clprGetLedgerConfiguration
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
        return { clprGetLedgerConfiguration: { header } };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        return `ClprGetLedgerConfigurationQuery:${this._timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "clprGetLedgerConfiguration",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ClprGetLedgerConfigurationQuery._fromProtobuf,
);
