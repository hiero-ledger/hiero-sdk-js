// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import NftId from "./NftId.js";
import AccountId from "../account/AccountId.js";
import TokenId from "../token/TokenId.js";
import TokenNftInfo from "./TokenNftInfo.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Hbar from "../Hbar.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HieroProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HieroProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HieroProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenNftInfo} HieroProto.proto.ITokenNftInfo
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HieroProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.ITokenGetNftInfoQuery} HieroProto.proto.ITokenGetNftInfoQuery
 * @typedef {import("@hashgraph/proto").proto.ITokenGetNftInfosQuery} HieroProto.proto.ITokenGetNftInfosQuery
 * @typedef {import("@hashgraph/proto").proto.ITokenGetAccountNftInfosQuery} HieroProto.proto.ITokenGetAccountNftInfosQuery
 * @typedef {import("@hashgraph/proto").proto.ITokenGetNftInfoResponse} HieroProto.proto.ITokenGetNftInfoResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenGetNftInfosResponse} HieroProto.proto.ITokenGetNftInfosResponse
 * @typedef {import("@hashgraph/proto").proto.ITokenGetAccountNftInfosResponse} HieroProto.proto.ITokenGetAccountNftInfosResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 */

/**
 * @augments {Query<TokenNftInfo[]>}
 */
export default class TokenNftInfoQuery extends Query {
    /**
     * @param {object} properties
     * @param {NftId | string} [properties.nftId]
     * @param {AccountId | string} [properties.accountId]
     * @param {TokenId | string} [properties.tokenId]
     * @param {Long | number} [properties.start]
     * @param {Long | number} [properties.end]
     */
    constructor(properties = {}) {
        super();

        /**
         * @private
         * @type {?NftId}
         */
        this._nftId = null;
        if (properties.nftId != null) {
            this.setNftId(properties.nftId);
        }

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;
        if (properties.accountId != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setAccountId(properties.accountId);
        }

        /**
         * @private
         * @type {?TokenId}
         */
        this._tokenId = null;
        if (properties.tokenId != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setTokenId(properties.tokenId);
        }

        /**
         * @private
         * @type {?Long}
         */
        this._start = null;
        if (properties.start != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setStart(properties.start);
        }

        /**
         * @private
         * @type {?Long}
         */
        this._end = null;
        if (properties.end != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setEnd(properties.end);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.IQuery} query
     * @returns {TokenNftInfoQuery}
     */
    static _fromProtobuf(query) {
        if (query.tokenGetNftInfo != null) {
            const info = /** @type {HieroProto.proto.ITokenGetNftInfoQuery} */ (
                query.tokenGetNftInfo
            );

            return new TokenNftInfoQuery({
                nftId:
                    info.nftID != null
                        ? NftId._fromProtobuf(info.nftID)
                        : undefined,
            });
        } else if (query.tokenGetAccountNftInfos != null) {
            const info =
                /** @type {HieroProto.proto.ITokenGetAccountNftInfosQuery} */ (
                    query.tokenGetAccountNftInfos
                );

            return new TokenNftInfoQuery({
                accountId:
                    info.accountID != null
                        ? AccountId._fromProtobuf(info.accountID)
                        : undefined,
                start: info.start != null ? info.start : undefined,
                end: info.end != null ? info.end : undefined,
            });
        } else {
            const info =
                /** @type {HieroProto.proto.ITokenGetNftInfosQuery} */ (
                    query.tokenGetNftInfos
                );

            return new TokenNftInfoQuery({
                tokenId:
                    info.tokenID != null
                        ? TokenId._fromProtobuf(info.tokenID)
                        : undefined,
                start: info.start != null ? info.start : undefined,
                end: info.end != null ? info.end : undefined,
            });
        }
    }

    /**
     * @returns {?NftId}
     */
    get nftId() {
        return this._nftId;
    }

    /**
     * Set the token ID for which the info is being requested.
     *
     * @param {NftId | string} nftId
     * @returns {TokenNftInfoQuery}
     */
    setNftId(nftId) {
        this._nftId =
            typeof nftId === "string"
                ? NftId.fromString(nftId)
                : NftId._fromProtobuf(nftId._toProtobuf());

        return this;
    }

    /**
     * @deprecated with no replacement
     * @returns {?AccountId}
     */
    get accountId() {
        console.warn(
            "`TokenNftInfoQuery.accountId` is deprecated with no replacement",
        );
        return this._accountId;
    }

    /**
     * @deprecated with no replacement
     * Set the token ID for which the info is being requested.
     * @param {AccountId | string} accountId
     * @returns {TokenNftInfoQuery}
     */
    setAccountId(accountId) {
        console.warn(
            "`TokenNftInfoQuery.setAccountId()` is deprecated with no replacement",
        );
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : AccountId._fromProtobuf(accountId._toProtobuf());

        return this;
    }

    /**
     * @deprecated with no replacement
     * @returns {?TokenId}
     */
    get tokenId() {
        console.warn(
            "`TokenNftInfoQuery.tokenId` is deprecated with no replacement",
        );
        return this._tokenId;
    }

    /**
     * @deprecated with no replacement
     * Set the token ID for which the info is being requested.
     * @param {TokenId | string} tokenId
     * @returns {TokenNftInfoQuery}
     */
    setTokenId(tokenId) {
        console.warn(
            "`TokenNftInfoQuery.setTokenId()` is deprecated with no replacement",
        );
        this._tokenId =
            typeof tokenId === "string"
                ? TokenId.fromString(tokenId)
                : TokenId._fromProtobuf(tokenId._toProtobuf());

        return this;
    }

    /**
     * @deprecated with no replacement
     * @returns {?Long}
     */
    get start() {
        console.warn(
            "`TokenNftInfoQuery.start` is deprecated with no replacement",
        );
        return this._start;
    }

    /**
     * @deprecated with no replacement
     * Set the token ID for which the info is being requested.
     * @param {Long | number} start
     * @returns {TokenNftInfoQuery}
     */
    setStart(start) {
        console.warn(
            "`TokenNftInfoQuery.setStart()` is deprecated with no replacement",
        );
        this._start =
            typeof start === "number" ? Long.fromNumber(start) : start;

        return this;
    }

    /**
     * @deprecated with no replacement
     * @returns {?Long}
     */
    get end() {
        console.warn(
            "`TokenNftInfoQuery.end` is deprecated with no replacement",
        );
        return this._end;
    }

    /**
     * @deprecated with no replacement
     * Set the token ID for which the info is being requested.
     * @param {Long | number} end
     * @returns {TokenNftInfoQuery}
     */
    setEnd(end) {
        console.warn(
            "`TokenNftInfoQuery.setEnd()` is deprecated with no replacement",
        );
        this._end = typeof end === "number" ? Long.fromNumber(end) : end;

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
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.token.getTokenNftInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const infos = /** @type {HieroProto.proto.ITokenGetNftInfoResponse} */ (
            response.tokenGetNftInfo
        );

        return /** @type {HieroProto.proto.IResponseHeader} */ (infos.header);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<TokenNftInfo[]>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const nfts = [
            /** @type {HieroProto.proto.ITokenNftInfo} */
            (
                /** @type {HieroProto.proto.ITokenGetNftInfoResponse} */ (
                    response.tokenGetNftInfo
                ).nft
            ),
        ];

        return Promise.resolve(
            nfts.map((nft) =>
                TokenNftInfo._fromProtobuf(
                    /** @type {HieroProto.proto.ITokenNftInfo} */ (nft),
                ),
            ),
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQueryHeader} header
     * @returns {HieroProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            tokenGetNftInfo: {
                header,
                nftID: this._nftId != null ? this._nftId._toProtobuf() : null,
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

        return `TokenNftInfoQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("tokenGetNftInfo", TokenNftInfoQuery._fromProtobuf);
