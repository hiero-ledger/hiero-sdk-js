import Query, { QUERY_REGISTRY } from "../query/Query.js";
import TransactionRecord from "./TransactionRecord.js";
import TransactionReceipt from "./TransactionReceipt.js";
import TransactionId from "./TransactionId.js";
import Status from "../Status.js";
import PrecheckStatusError from "../PrecheckStatusError.js";
import ReceiptStatusError from "../ReceiptStatusError.js";
import { ExecutionState } from "../Executable.js";
import { ResponseType, ResponseCodeEnum } from "@exodus/hashgraph-proto";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").ITransactionRecord} proto.ITransactionRecord
 * @typedef {import("@exodus/hashgraph-proto").ITransactionReceipt} proto.ITransactionReceipt
 * @typedef {import("@exodus/hashgraph-proto").ITransactionGetRecordResponse} proto.ITransactionGetRecordResponse
 * @typedef {import("@exodus/hashgraph-proto").ITransactionGetRecordQuery} proto.ITransactionGetRecordQuery
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").ResponseCodeEnum} proto.ResponseCodeEnum
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * @augments {Query<TransactionRecord>}
 */
export default class TransactionRecordQuery extends Query {
    /**
     * @param {object} [props]
     * @param {TransactionId} [props.transactionId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?TransactionId}
         */
        this._transactionId = null;

        if (props.transactionId != null) {
            this.setTransactionId(props.transactionId);
        }
    }

    /**
     * @returns {?TransactionId}
     */
    get transactionId() {
        return this._transactionId;
    }

    /**
     * @internal
     * @param {proto.IQuery} query
     * @returns {TransactionRecordQuery}
     */
    static _fromProtobuf(query) {
        const record = /** @type {proto.ITransactionGetRecordQuery} */ (
            query.transactionGetRecord
        );

        return new TransactionRecordQuery({
            transactionId: record.transactionID
                ? TransactionId._fromProtobuf(record.transactionID)
                : undefined,
        });
    }

    /**
     * Set the transaction ID for which the record is being requested.
     *
     * @param {TransactionId | string} transactionId
     * @returns {TransactionRecordQuery}
     */
    setTransactionId(transactionId) {
        this._transactionId =
            typeof transactionId === "string"
                ? TransactionId.fromString(transactionId)
                : transactionId.clone();

        return this;
    }

    /**
     * @override
     * @internal
     * @param {proto.IQuery} request
     * @param {proto.IResponse} response
     * @returns {ExecutionState}
     */
    _shouldRetry(request, response) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        let status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : ResponseCodeEnum.OK
        );

        switch (status) {
            case Status.Busy:
            case Status.Unknown:
            case Status.ReceiptNotFound:
            case Status.RecordNotFound:
                return ExecutionState.Retry;

            case Status.Ok:
                break;

            default:
                return ExecutionState.Error;
        }

        const transactionGetRecord =
            /** @type {proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        const header = /** @type {proto.IResponseHeader} */ (
            transactionGetRecord.header
        );

        if (header.responseType === ResponseType.COST_ANSWER) {
            return ExecutionState.Finished;
        }

        const record = /** @type {proto.ITransactionRecord} */ (
            transactionGetRecord.transactionRecord
        );
        const receipt = /** @type {proto.ITransactionReceipt} */ (
            record.receipt
        );
        const receiptStatusCode = /** @type {proto.ResponseCodeEnum} */ (
            receipt.status
        );
        status = Status._fromCode(receiptStatusCode);

        switch (status) {
            case Status.Ok:
            case Status.Busy:
            case Status.Unknown:
            case Status.ReceiptNotFound:
            case Status.RecordNotFound:
                return ExecutionState.Retry;

            case Status.Success:
                return ExecutionState.Finished;

            default:
                return ExecutionState.Error;
        }
    }

    /**
     * @override
     * @internal
     * @param {proto.IQuery} request
     * @param {proto.IResponse} response
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        let status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : ResponseCodeEnum.OK
        );

        switch (status) {
            case Status.Ok:
                // Do nothing
                break;

            default:
                return new PrecheckStatusError({
                    status,
                    transactionId: this._getTransactionId(),
                });
        }

        const transactionGetRecord =
            /** @type {proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        const record = /** @type {proto.ITransactionRecord} */ (
            transactionGetRecord.transactionRecord
        );
        const receipt = /** @type {proto.ITransactionReceipt} */ (
            record.receipt
        );
        const receiptStatusError = /** @type {proto.ResponseCodeEnum} */ (
            receipt.status
        );

        status = Status._fromCode(receiptStatusError);

        return new ReceiptStatusError({
            status,
            transactionId: this._getTransactionId(),
            transactionReceipt: TransactionReceipt._fromProtobuf(receipt),
        });
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (
            this._transactionId != null &&
            this._transactionId.accountId != null
        ) {
            this._transactionId.accountId.validateChecksum(client);
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
        return channel.crypto.getTxRecordByTxID(request);
    }

    /**
     * @override
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const transactionGetRecord =
            /** @type {proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        return /** @type {proto.IResponseHeader} */ (
            transactionGetRecord.header
        );
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {proto.IQuery} request
     * @returns {Promise<TransactionRecord>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const record = /** @type {proto.ITransactionGetRecordResponse} */ (
            response.transactionGetRecord
        );

        return Promise.resolve(
            TransactionRecord._fromProtobuf(
                /** @type {proto.ITransactionRecord} */ (
                    record.transactionRecord
                )
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
            transactionGetRecord: {
                header,
                transactionID:
                    this._transactionId != null
                        ? this._transactionId._toProtobuf()
                        : null,
            },
        };
    }
}

QUERY_REGISTRY.set(
    "transactionGetRecord",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TransactionRecordQuery._fromProtobuf
);
