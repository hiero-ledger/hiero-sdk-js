import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import ProxyStaker from "./ProxyStaker.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").ICryptoGetStakersQuery} proto.ICryptoGetStakersQuery
 * @typedef {import("@exodus/hashgraph-proto").ICryptoGetStakersResponse} proto.ICryptoGetStakersResponse
 * @typedef {import("@exodus/hashgraph-proto").IAllProxyStakers} proto.IAllProxyStakers
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * Get all the accounts that are proxy staking to this account.
 * For each of them, give the amount currently staked.
 *
 * This is not yet implemented, but will be in a future version of the API.
 *
 * @augments {Query<ProxyStaker[]>}
 */
export default class AccountStakersQuery extends Query {
    /**
     * @param {object} [props]
     * @param {(AccountId | string)=} props.accountId
     */
    constructor(props = {}) {
        super();

        /**
         * @type {?AccountId}
         * @private
         */
        this._accountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     * @internal
     * @param {proto.IQuery} query
     * @returns {AccountStakersQuery}
     */
    static _fromProtobuf(query) {
        const stakers = /** @type {proto.ICryptoGetStakersQuery} */ (
            query.cryptoGetProxyStakers
        );

        return new AccountStakersQuery({
            accountId:
                stakers.accountID != null
                    ? AccountId._fromProtobuf(stakers.accountID)
                    : undefined,
        });
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account ID for which the stakers are being requested.
     *
     * @param {AccountId | string} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
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
        return channel.crypto.getStakersByAccountID(request);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const cryptoGetProxyStakers =
            /** @type {proto.ICryptoGetStakersResponse} */ (
                response.cryptoGetProxyStakers
            );
        return /** @type {proto.IResponseHeader} */ (
            cryptoGetProxyStakers.header
        );
    }

    /**
     * @protected
     * @override
     * @param {proto.IResponse} response
     * @returns {Promise<ProxyStaker[]>}
     */
    _mapResponse(response) {
        const cryptoGetProxyStakers =
            /** @type {proto.ICryptoGetStakersResponse} */ (
                response.cryptoGetProxyStakers
            );
        const stakers = /** @type {proto.IAllProxyStakers} */ (
            cryptoGetProxyStakers.stakers
        );

        return Promise.resolve(
            (stakers.proxyStaker != null ? stakers.proxyStaker : []).map(
                (staker) => ProxyStaker._fromProtobuf(staker)
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
            cryptoGetProxyStakers: {
                header,
                accountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
            },
        };
    }
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("cryptoGetProxyStakers", AccountStakersQuery._fromProtobuf);
