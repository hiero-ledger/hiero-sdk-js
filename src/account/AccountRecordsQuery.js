import Query, { QUERY_REGISTRY } from "../query/Query.js";
import AccountId from "./AccountId.js";
import TransactionRecord from "../transaction/TransactionRecord.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").ICryptoGetAccountRecordsQuery} proto.ICryptoGetAccountRecordsQuery
 * @typedef {import("@exodus/hashgraph-proto").ICryptoGetAccountRecordsResponse} proto.ICryptoGetAccountRecordsResponse
 * @typedef {import("@exodus/hashgraph-proto").ITransactionRecord} proto.ITransactionRecord
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
     * @param {proto.IQuery} query
     * @returns {AccountRecordsQuery}
     */
    static _fromProtobuf(query) {
        const records = /** @type {proto.ICryptoGetAccountRecordsQuery} */ (
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
     * @param {proto.IQuery} request
     * @returns {Promise<proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.getAccountRecords(request);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const cryptoGetAccountRecords =
            /** @type {proto.ICryptoGetAccountRecordsResponse} */ (
                response.cryptoGetAccountRecords
            );
        return /** @type {proto.IResponseHeader} */ (
            cryptoGetAccountRecords.header
        );
    }

    /**
     * @protected
     * @override
     * @param {proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {proto.IQuery} request
     * @returns {Promise<TransactionRecord[]>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const cryptoGetAccountRecords =
            /** @type {proto.ICryptoGetAccountRecordsResponse} */ (
                response.cryptoGetAccountRecords
            );
        const records = /** @type {proto.ITransactionRecord[]} */ (
            cryptoGetAccountRecords.records
        );

        return Promise.resolve(
            records.map((record) => TransactionRecord._fromProtobuf(record))
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
            cryptoGetAccountRecords: {
                header,
                accountID:
                    this._accountId != null
                        ? this._accountId._toProtobuf()
                        : null,
            },
        };
    }
}

QUERY_REGISTRY.set(
    "cryptoGetAccountRecords",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountRecordsQuery._fromProtobuf
);
