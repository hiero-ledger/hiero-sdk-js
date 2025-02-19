// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import NetworkVersionInfo from "./NetworkVersionInfo.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.INetworkGetVersionInfoQuery} HashgraphProto.proto.INetworkGetVersionInfoQuery
 * @typedef {import("@hashgraph/proto").proto.INetworkGetVersionInfoResponse} HashgraphProto.proto.INetworkGetVersionInfoResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 */

/**
 *
 * A query to retrieve version information about the Hedera network.
 *
 * This query returns information about the versions of both the Hedera Services software
 * and the protobuf schema in use by the network. This information is useful for ensuring
 * client-network compatibility and debugging version-related issues.
 *
 * @augments {Query<NetworkVersionInfo>}
 */
export default class NetworkVersionInfoQuery extends Query {
    constructor() {
        super();
    }

    /**
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {NetworkVersionInfoQuery}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _fromProtobuf(query) {
        return new NetworkVersionInfoQuery();
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<HashgraphProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.network.getVersionInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const networkGetVersionInfo =
            /** @type {HashgraphProto.proto.INetworkGetVersionInfoResponse} */ (
                response.networkGetVersionInfo
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            networkGetVersionInfo.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {Promise<NetworkVersionInfo>}
     */
    _mapResponse(response) {
        const info =
            /** @type {HashgraphProto.proto.INetworkGetVersionInfoResponse} */ (
                response.networkGetVersionInfo
            );
        return Promise.resolve(NetworkVersionInfo._fromProtobuf(info));
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IQueryHeader} header
     * @returns {HashgraphProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            networkGetVersionInfo: {
                header,
            },
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp =
            this._paymentTransactionId != null &&
            this._paymentTransactionId.validStart != null
                ? this._paymentTransactionId.validStart
                : this._timestamp;

        return `NetworkVersionInfoQuery:${timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "networkGetVersionInfo",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    NetworkVersionInfoQuery._fromProtobuf,
);
