// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import TransactionRecord from "./TransactionRecord.js";
import TransactionReceipt from "./TransactionReceipt.js";
import TransactionId from "./TransactionId.js";
import Status from "../Status.js";
import PrecheckStatusError from "../PrecheckStatusError.js";
import ReceiptStatusError from "../ReceiptStatusError.js";
import RecordStatusError from "../RecordStatusError.js";
import { ExecutionState } from "../Executable.js";
import * as HieroProto from "@hashgraph/proto";

const { proto } = HieroProto;

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Get the record for a transaction.
 * <p>
 * If the transaction requested a record, then the record lasts for one hour, and a state proof is available for it.
 * If the transaction created an account, file, or smart contract instance, then the record will contain the ID for
 * what it created. If the transaction called a smart contract function, then the record contains the result of
 * that call. If the transaction was a cryptocurrency transfer, then the record includes the TransferList
 * which gives the details of that transfer. If the transaction didn't return anything that should be
 * in the record, then the results field will be set to nothing.
 * @augments {Query<TransactionRecord>}
 */
export default class TransactionRecordQuery extends Query {
    /**
     * @param {object} [props]
     * @param {TransactionId} [props.transactionId]
     * @param {boolean} [props.includeChildren]
     * @param {boolean} [props.includeDuplicates]
     * @param {boolean} [props.validateReceiptStatus]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?TransactionId}
         */
        this._transactionId = null;

        /**
         * @private
         * @type {?boolean}
         */
        this._includeChildren = null;

        /**
         * @private
         * @type {?boolean}
         */
        this._includeDuplicates = null;

        this._validateReceiptStatus = true;

        if (props.transactionId != null) {
            this.setTransactionId(props.transactionId);
        }

        if (props.includeChildren != null) {
            this.setIncludeChildren(props.includeChildren);
        }

        if (props.includeDuplicates != null) {
            this.setIncludeDuplicates(props.includeDuplicates);
        }

        if (props.validateReceiptStatus != null) {
            this.setValidateReceiptStatus(props.validateReceiptStatus);
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
     * @param {HieroProto.proto.IQuery} query
     * @returns {TransactionRecordQuery}
     */
    static _fromProtobuf(query) {
        const record =
            /** @type {HieroProto.proto.ITransactionGetRecordQuery} */ (
                query.transactionGetRecord
            );

        return new TransactionRecordQuery({
            transactionId: record.transactionID
                ? TransactionId._fromProtobuf(record.transactionID)
                : undefined,
            includeChildren:
                record.includeChildRecords != null
                    ? record.includeChildRecords
                    : undefined,
            includeDuplicates:
                record.includeDuplicates != null
                    ? record.includeDuplicates
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
     * @param {boolean} includeChildren
     * @returns {TransactionRecordQuery}
     */
    setIncludeChildren(includeChildren) {
        this._includeChildren = includeChildren;
        return this;
    }

    /**
     * @returns {boolean}
     */
    get includeChildren() {
        return this._includeChildren != null ? this._includeChildren : false;
    }

    /**
     * @param {boolean} includeDuplicates
     * @returns {TransactionRecordQuery}
     */
    setIncludeDuplicates(includeDuplicates) {
        this._duplicates = includeDuplicates;
        return this;
    }

    /**
     * @returns {boolean}
     */
    get includeDuplicates() {
        return this._duplicates != null ? this._duplicates : false;
    }

    /**
     * @param {boolean} validateReceiptStatus
     * @returns {this}
     */
    setValidateReceiptStatus(validateReceiptStatus) {
        this._validateReceiptStatus = validateReceiptStatus;
        return this;
    }

    /**
     * @returns {boolean}
     */
    get validateReceiptStatus() {
        return this._validateReceiptStatus;
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQuery} request
     * @param {HieroProto.proto.IResponse} response
     * @returns {[Status, ExecutionState]}
     */
    _shouldRetry(request, response) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        let status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : proto.ResponseCodeEnum.OK,
        );

        if (this._logger) {
            this._logger.debug(
                `[${this._getLogId()}] received node precheck status ${status.toString()}`,
            );
        }

        switch (status) {
            case Status.Busy:
            case Status.Unknown:
            case Status.ReceiptNotFound:
            case Status.RecordNotFound:
            case Status.PlatformNotActive:
                return [status, ExecutionState.Retry];

            case Status.Ok:
                break;

            default:
                return [status, ExecutionState.Error];
        }

        const transactionGetRecord =
            /** @type {HieroProto.proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        const header = /** @type {HieroProto.proto.IResponseHeader} */ (
            transactionGetRecord.header
        );

        if (header.responseType === HieroProto.proto.ResponseType.COST_ANSWER) {
            return [status, ExecutionState.Finished];
        }

        const record = /** @type {HieroProto.proto.ITransactionRecord} */ (
            transactionGetRecord.transactionRecord
        );
        const receipt = /** @type {HieroProto.proto.ITransactionReceipt} */ (
            record.receipt
        );
        const receiptStatusCode =
            /** @type {HieroProto.proto.ResponseCodeEnum} */ (receipt.status);
        status = Status._fromCode(receiptStatusCode);

        if (this._logger) {
            this._logger.debug(
                `[${this._getLogId()}] received record's receipt ${status.toString()}`,
            );
        }

        switch (status) {
            case Status.Ok:
            case Status.Busy:
            case Status.Unknown:
            case Status.ReceiptNotFound:
            case Status.RecordNotFound:
                return [status, ExecutionState.Retry];

            case Status.Success:
                return [status, ExecutionState.Finished];

            default:
                return [
                    status,
                    this._validateReceiptStatus
                        ? ExecutionState.Error
                        : ExecutionState.Finished,
                ];
        }
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQuery} request
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeId
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response, nodeId) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        let status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : proto.ResponseCodeEnum.OK,
        );
        switch (status) {
            case Status.Ok:
                // Do nothing
                break;

            case Status.ContractRevertExecuted:
                return new RecordStatusError({
                    status,
                    transactionId: this._getTransactionId(),
                    transactionRecord: TransactionRecord._fromProtobuf({
                        transactionRecord:
                            // @ts-ignore
                            response.transactionGetRecord.transactionRecord,
                    }),
                });

            default:
                return new PrecheckStatusError({
                    nodeId,
                    status,
                    transactionId: this._getTransactionId(),
                    contractFunctionResult: null,
                });
        }

        const transactionGetRecord =
            /** @type {HieroProto.proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        const record = /** @type {HieroProto.proto.ITransactionRecord} */ (
            transactionGetRecord.transactionRecord
        );
        const receipt = /** @type {HieroProto.proto.ITransactionReceipt} */ (
            record.receipt
        );
        const receiptStatusError =
            /** @type {HieroProto.proto.ResponseCodeEnum} */ (receipt.status);

        status = Status._fromCode(receiptStatusError);

        switch (status) {
            case Status.ContractRevertExecuted:
                return new RecordStatusError({
                    status,
                    transactionId: this._getTransactionId(),
                    transactionRecord: TransactionRecord._fromProtobuf({
                        transactionRecord:
                            // @ts-ignore
                            response.transactionGetRecord.transactionRecord,
                    }),
                });

            default:
                return new ReceiptStatusError({
                    status,
                    transactionId: this._getTransactionId(),
                    transactionReceipt: TransactionReceipt._fromProtobuf({
                        receipt,
                    }),
                });
        }
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
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.getTxRecordByTxID(request);
    }

    /**
     * @override
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const transactionGetRecord =
            /** @type {HieroProto.proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        return /** @type {HieroProto.proto.IResponseHeader} */ (
            transactionGetRecord.header
        );
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<TransactionRecord>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const record =
            /** @type {HieroProto.proto.ITransactionGetRecordResponse} */ (
                response.transactionGetRecord
            );
        return Promise.resolve(TransactionRecord._fromProtobuf(record));
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQueryHeader} header
     * @returns {HieroProto.proto.IQuery}
     */
    _onMakeRequest(header) {
        return {
            transactionGetRecord: {
                header,
                transactionID:
                    this._transactionId != null
                        ? this._transactionId._toProtobuf()
                        : null,
                includeChildRecords: this._includeChildren,
                includeDuplicates: this._includeDuplicates,
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

        return `TransactionRecordQuery:${timestamp.toString()}`;
    }
}

QUERY_REGISTRY.set(
    "transactionGetRecord",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TransactionRecordQuery._fromProtobuf,
);
