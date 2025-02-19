// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import AccountInfo from "./AccountInfo.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HieroProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HieroProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HieroProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HieroProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.CryptoGetInfoResponse.IAccountInfo} HieroProto.proto.CryptoGetInfoResponse.IAccountInfo
 * @typedef {import("@hashgraph/proto").proto.ICryptoGetInfoQuery} HieroProto.proto.ICryptoGetInfoQuery
 * @typedef {import("@hashgraph/proto").proto.ICryptoGetInfoResponse} HieroProto.proto.ICryptoGetInfoResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * Retrieves the metadata of an account
 * @augments {Query<AccountInfo>}
 */
export default class AccountInfoQuery extends Query {
    /**
     * @param {object} props
     * @param {AccountId | string} [props.accountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;
        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.IQuery} query
     * @returns {AccountInfoQuery}
     */
    static _fromProtobuf(query) {
        const info = /** @type {HieroProto.proto.ICryptoGetInfoQuery} */ (
            query.cryptoGetInfo
        );

        return new AccountInfoQuery({
            accountId:
                info.accountID != null
                    ? AccountId._fromProtobuf(info.accountID)
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
     * Set the account ID for which the info is being requested.
     *
     * @param {AccountId | string} accountId
     * @returns {AccountInfoQuery}
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
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.getAccountInfo(request);
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
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const cryptoGetInfo =
            /** @type {HieroProto.proto.ICryptoGetInfoResponse} */ (
                response.cryptoGetInfo
            );
        return /** @type {HieroProto.proto.IResponseHeader} */ (
            cryptoGetInfo.header
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<AccountInfo>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const info = /** @type {HieroProto.proto.ICryptoGetInfoResponse} */ (
            response.cryptoGetInfo
        );

        return Promise.resolve(
            AccountInfo._fromProtobuf(
                /** @type {HieroProto.proto.CryptoGetInfoResponse.IAccountInfo} */ (
                    info.accountInfo
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
            cryptoGetInfo: {
                header,
                accountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
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
        return `AccountInfoQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("cryptoGetInfo", AccountInfoQuery._fromProtobuf);
