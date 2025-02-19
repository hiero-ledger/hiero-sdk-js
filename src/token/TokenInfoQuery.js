// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import TokenId from "./TokenId.js";
import TokenInfo from "./TokenInfo.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.ITokenInfo} HashgraphProto.proto.ITokenInfo
 * @typedef {import("@hashgraph/proto").proto.ITokenGetInfoQuery} HashgraphProto.proto.ITokenGetInfoQuery
 * @typedef {import("@hashgraph/proto").proto.ITokenGetInfoResponse} HashgraphProto.proto.ITokenGetInfoResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Retrieve the detail characteristics for a token.
 * @augments {Query<TokenInfo>}
 */
export default class TokenInfoQuery extends Query {
    /**
     * @param {object} properties
     * @param {TokenId | string} [properties.tokenId]
     */
    constructor(properties = {}) {
        super();

        /**
         * @private
         * @type {?TokenId}
         */
        this._tokenId = null;
        if (properties.tokenId != null) {
            this.setTokenId(properties.tokenId);
        }
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {TokenInfoQuery}
     */
    static _fromProtobuf(query) {
        const info = /** @type {HashgraphProto.proto.ITokenGetInfoQuery} */ (
            query.tokenGetInfo
        );

        return new TokenInfoQuery({
            tokenId:
                info.token != null
                    ? TokenId._fromProtobuf(info.token)
                    : undefined,
        });
    }

    /**
     * @returns {?TokenId}
     */
    get tokenId() {
        return this._tokenId;
    }

    /**
     * Set the token ID for which the info is being requested.
     *
     * @param {TokenId | string} tokenId
     * @returns {TokenInfoQuery}
     */
    setTokenId(tokenId) {
        this._tokenId =
            typeof tokenId === "string"
                ? TokenId.fromString(tokenId)
                : tokenId.clone();

        return this;
    }

    /**
     * @override
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<Hbar>}
     */
    async getCost(client) {
        return super.getCost(client);
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._tokenId != null) {
            this._tokenId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<HashgraphProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.token.getTokenInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const tokenGetInfo =
            /** @type {HashgraphProto.proto.ITokenGetInfoResponse} */ (
                response.tokenGetInfo
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            tokenGetInfo.header
        );
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<TokenInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const info = /** @type {HashgraphProto.proto.ITokenGetInfoResponse} */ (
            response.tokenGetInfo
        );

        return Promise.resolve(
            TokenInfo._fromProtobuf(
                /** @type {HashgraphProto.proto.ITokenInfo} */ (info.tokenInfo),
            ),
        );
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IQueryHeader} header
     * @returns {HashgraphProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            tokenGetInfo: {
                header,
                token:
                    this._tokenId != null ? this._tokenId._toProtobuf() : null,
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

        return `TokenInfoQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("tokenGetInfo", TokenInfoQuery._fromProtobuf);
