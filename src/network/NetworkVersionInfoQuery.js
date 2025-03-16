// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import NetworkVersionInfo from "./NetworkVersionInfo.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HieroProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HieroProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HieroProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HieroProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.INetworkGetVersionInfoQuery} HieroProto.proto.INetworkGetVersionInfoQuery
 * @typedef {import("@hashgraph/proto").proto.INetworkGetVersionInfoResponse} HieroProto.proto.INetworkGetVersionInfoResponse
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
     * @param {HieroProto.proto.IQuery} query
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
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.network.getVersionInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const networkGetVersionInfo =
            /** @type {HieroProto.proto.INetworkGetVersionInfoResponse} */ (
                response.networkGetVersionInfo
            );
        return /** @type {HieroProto.proto.IResponseHeader} */ (
            networkGetVersionInfo.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HieroProto.proto.IResponse} response
     * @returns {Promise<NetworkVersionInfo>}
     */
    _mapResponse(response) {
        const info =
            /** @type {HieroProto.proto.INetworkGetVersionInfoResponse} */ (
                response.networkGetVersionInfo
            );
        return Promise.resolve(NetworkVersionInfo._fromProtobuf(info));
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQueryHeader} header
     * @returns {HieroProto.proto.IQuery}
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
