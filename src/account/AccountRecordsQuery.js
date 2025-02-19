// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import TransactionRecord from "../transaction/TransactionRecord.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.ICryptoGetAccountRecordsQuery} HashgraphProto.proto.ICryptoGetAccountRecordsQuery
 * @typedef {import("@hashgraph/proto").proto.ICryptoGetAccountRecordsResponse} HashgraphProto.proto.ICryptoGetAccountRecordsResponse
 * @typedef {import("@hashgraph/proto").proto.ITransactionRecord} HashgraphProto.proto.ITransactionRecord
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * Get all the records for an account for any transfers into it and out of it,
 * that were above the threshold, during the last 25 hours.
 *
 * @augments {Query<TransactionRecord[]>}
 */
export default class AccountRecordsQuery extends Query {
    /**
     * @param {object} [props]
     * @param {AccountId | string} [props.accountId]
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
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {AccountRecordsQuery}
     */
    static _fromProtobuf(query) {
        const records =
            /** @type {HashgraphProto.proto.ICryptoGetAccountRecordsQuery} */ (
                query.cryptoGetAccountRecords
            );

        return new AccountRecordsQuery({
            accountId:
                records.accountID != null
                    ? AccountId._fromProtobuf(records.accountID)
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
     * Set the account ID for which the records are being requested.
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
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<HashgraphProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.getAccountRecords(request);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const cryptoGetAccountRecords =
            /** @type {HashgraphProto.proto.ICryptoGetAccountRecordsResponse} */ (
                response.cryptoGetAccountRecords
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            cryptoGetAccountRecords.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HashgraphProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<TransactionRecord[]>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const cryptoGetAccountRecords =
            /** @type {HashgraphProto.proto.ICryptoGetAccountRecordsResponse} */ (
                response.cryptoGetAccountRecords
            );
        const records =
            /** @type {HashgraphProto.proto.ITransactionRecord[]} */ (
                cryptoGetAccountRecords.records
            );

        return Promise.resolve(
            records.map((record) =>
                TransactionRecord._fromProtobuf({ transactionRecord: record }),
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
            cryptoGetAccountRecords: {
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

        return `AccountRecordsQuery:${timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "cryptoGetAccountRecords",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountRecordsQuery._fromProtobuf,
);
