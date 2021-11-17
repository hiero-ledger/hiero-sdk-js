import Query, { QUERY_REGISTRY } from "../query/Query.js";
import TokenId from "./TokenId.js";
import TokenInfo from "./TokenInfo.js";
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").ITokenInfo} proto.ITokenInfo
 * @typedef {import("@exodus/hashgraph-proto").ITokenGetInfoQuery} proto.ITokenGetInfoQuery
 * @typedef {import("@exodus/hashgraph-proto").ITokenGetInfoResponse} proto.ITokenGetInfoResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
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
     * @param {proto.IQuery} query
     * @returns {TokenInfoQuery}
     */
    static _fromProtobuf(query) {
        const info = /** @type {proto.ITokenGetInfoQuery} */ (
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
        let cost = await super.getCost(client);

        if (cost.toTinybars().greaterThan(25)) {
            return cost;
        } else {
            return Hbar.fromTinybars(25);
        }
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
     * @param {proto.IQuery} request
     * @returns {Promise<proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.token.getTokenInfo(request);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const tokenGetInfo = /** @type {proto.ITokenGetInfoResponse} */ (
            response.tokenGetInfo
        );
        return /** @type {proto.IResponseHeader} */ (tokenGetInfo.header);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {proto.IQuery} request
     * @returns {Promise<TokenInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const info = /** @type {proto.ITokenGetInfoResponse} */ (
            response.tokenGetInfo
        );

        return Promise.resolve(
            TokenInfo._fromProtobuf(
                /** @type {proto.ITokenInfo} */ (info.tokenInfo)
            )
        );
    }

    /**
     * @override
     * @internal
     * @param {proto.IQueryHeader} header
     * @returns {proto.IQuery}
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
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("tokenGetInfo", TokenInfoQuery._fromProtobuf);
