// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import ContractId from "../contract/ContractId.js";
import AccountBalance from "./AccountBalance.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.IQuery} HieroProto.proto.IQuery
 * @typedef {import("@hiero-ledger/proto").proto.IQueryHeader} HieroProto.proto.IQueryHeader
 * @typedef {import("@hiero-ledger/proto").proto.IResponse} HieroProto.proto.IResponse
 * @typedef {import("@hiero-ledger/proto").proto.IResponseHeader} HieroProto.proto.IResponseHeader
 * @typedef {import("@hiero-ledger/proto").proto.ICryptoGetAccountBalanceQuery} HieroProto.proto.ICryptoGetAccountBalanceQuery
 * @typedef {import("@hiero-ledger/proto").proto.ICryptoGetAccountBalanceResponse} HieroProto.proto.ICryptoGetAccountBalanceResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../client/Client.js").default<Channel, MirrorChannel>} Client
 */

/**
 * The message reported both when an `AccountBalanceQuery` is constructed and
 * when any attempt is made to execute it.
 *
 * Exported for the other internal call sites that have to report the same
 * removal (`Wallet.getAccountBalance`, `LocalProvider.getAccountBalance`).
 * Not part of the public API — it is deliberately absent from `exports.js`.
 *
 * @internal
 */
export const ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE =
    "Deprecated: AccountBalanceQuery is no longer supported. " +
    "Use MirrorNodeAccountBalanceQuery or the mirror node REST API " +
    "(GET /api/v1/accounts/{id}) to retrieve account balances.";

/**
 * @deprecated - The `CryptoService/cryptoGetBalance` endpoint has been removed
 * from the consensus node. Use `MirrorNodeAccountBalanceQuery` or the mirror
 * node REST API (`GET /api/v1/accounts/{id}`) instead.
 *
 * Get the balance of a Hedera™ crypto-currency account.
 *
 * This returns only the balance, so its a smaller and faster reply
 * than AccountInfoQuery.
 *
 * This query is free.
 *
 * @augments {Query<AccountBalance>}
 */
export default class AccountBalanceQuery extends Query {
    /**
     * @param {object} [props]
     * @param {AccountId | string} [props.accountId]
     * @param {ContractId | string} [props.contractId]
     */
    constructor(props = {}) {
        super();

        /**
         * @type {?AccountId}
         * @private
         */
        this._accountId = null;

        /**
         * @type {?ContractId}
         * @private
         */
        this._contractId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }

        console.warn(ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE);
    }

    /**
     * @internal
     * @param {HieroProto.proto.IQuery} query
     * @returns {AccountBalanceQuery}
     */
    static _fromProtobuf(query) {
        const balance =
            /** @type {HieroProto.proto.ICryptoGetAccountBalanceQuery} */ (
                query.cryptogetAccountBalance
            );

        return new AccountBalanceQuery({
            accountId:
                balance.accountID != null
                    ? AccountId._fromProtobuf(balance.accountID)
                    : undefined,
            contractId:
                balance.contractID != null
                    ? ContractId._fromProtobuf(balance.contractID)
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
     * Set the account ID for which the balance is being requested.
     *
     * This is mutually exclusive with `setContractId`.
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
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * Set the contract ID for which the balance is being requested.
     *
     * This is mutually exclusive with `setAccountId`.
     *
     * @param {ContractId | string} contractId
     * @returns {this}
     */
    setContractId(contractId) {
        this._contractId =
            typeof contractId === "string"
                ? ContractId.fromString(contractId)
                : contractId.clone();

        return this;
    }

    /**
     * @protected
     * @override
     * @returns {boolean}
     */
    _isPaymentRequired() {
        return false;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
        }

        if (this._contractId != null) {
            this._contractId.validateChecksum(client);
        }
    }

    /**
     * @deprecated - `AccountBalanceQuery` is no longer supported. Use
     * `MirrorNodeAccountBalanceQuery` or the mirror node REST API instead.
     *
     * Rejects without contacting a consensus node.
     *
     * @override
     * @template {Channel} ChannelT
     * @template {MirrorChannel} MirrorChannelT
     * @param {import("../client/Client.js").default<ChannelT, MirrorChannelT>} client
     * @param {number=} requestTimeout
     * @returns {Promise<AccountBalance>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(client, requestTimeout) {
        return Promise.reject(
            new Error(ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE),
        );
    }

    /**
     * @deprecated - `AccountBalanceQuery` is no longer supported. Use
     * `MirrorNodeAccountBalanceQuery` or the mirror node REST API instead.
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _execute(channel, request) {
        return Promise.reject(
            new Error(ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE),
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const cryptogetAccountBalance =
            /** @type {HieroProto.proto.ICryptoGetAccountBalanceResponse} */ (
                response.cryptogetAccountBalance
            );
        return /** @type {HieroProto.proto.IResponseHeader} */ (
            cryptogetAccountBalance.header
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {Promise<AccountBalance>}
     */

    _mapResponse(response) {
        const cryptogetAccountBalance =
            /** @type {HieroProto.proto.ICryptoGetAccountBalanceResponse} */ (
                response.cryptogetAccountBalance
            );
        return Promise.resolve(
            AccountBalance._fromProtobuf(cryptogetAccountBalance),
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
            cryptogetAccountBalance: {
                header,
                accountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
                contractID:
                    this._contractId != null
                        ? this._contractId._toProtobuf()
                        : null,
            },
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        return `AccountBalanceQuery:${this._timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "cryptogetAccountBalance",
    AccountBalanceQuery._fromProtobuf.bind(null),
);
