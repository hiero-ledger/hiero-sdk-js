// SPDX-License-Identifier: Apache-2.0

import TransactionId from "../transaction/TransactionId.js";
import Hbar from "../Hbar.js";
import AccountId from "../account/AccountId.js";
import * as HieroProto from "@hashgraph/proto";
import QueryBase from "./QueryBase.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../Status.js").default} Status
 * @typedef {import("../Executable.js").ExecutionState} ExecutionState
 */

/**
 * @template OutputT
 * @augments {QueryBase<HieroProto.proto.IQuery, HieroProto.proto.IResponse, Hbar>}
 */
export default class CostQuery extends QueryBase {
    /**
     * @param {import("./Query.js").default<OutputT>} query
     */
    constructor(query) {
        super();

        this._query = query;
        this._grpcDeadline = query._grpcDeadline;
        this._requestTimeout = query._requestTimeout;
        this._nodeAccountIds = query._nodeAccountIds.clone();
        this._operator = query._operator;

        /**
         * @type {HieroProto.proto.IQueryHeader | null}
         */
        this._header = null;
    }

    /**
     * @returns {TransactionId}
     */
    _getTransactionId() {
        return this._query._getTransactionId();
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        return `CostQuery:${this._query._getLogId()}`;
    }

    /**
     * @abstract
     * @protected
     * @param {import("../client/Client.js").default<*, *>} client
     * @returns {Promise<void>}
     */
    async _beforeExecute(client) {
        if (client == null) {
            throw new Error("Cannot do CostQuery without Client");
        }

        const operator =
            this._operator != null ? this._operator : client._operator;

        if (operator == null) {
            throw new Error(
                "`client` must have an `operator` or an explicit payment transaction must be provided",
            );
        }

        if (this._query._nodeAccountIds.isEmpty) {
            this._query._nodeAccountIds.setList(
                client._network.getNodeAccountIdsForExecute(),
            );
        }

        // operator.accountId
        const transactionId = TransactionId.generate(operator.accountId);
        if (this._query.paymentTransactionId == null) {
            this._query.setPaymentTransactionId(transactionId);
        }

        const logId = this._getLogId();
        const nodeId = new AccountId(0);
        const paymentTransactionId =
            /** @type {import("../transaction/TransactionId.js").default} */
            (TransactionId.generate(new AccountId(0)));
        const paymentAmount = new Hbar(0);
        if (this._logger) {
            this._logger.debug(
                `[${logId}] making a payment transaction for node ${nodeId.toString()} and transaction ID ${paymentTransactionId.toString()} with amount ${paymentAmount.toString()}`,
            );
        }

        this._header = {
            payment: await this._makePaymentTransaction(
                paymentTransactionId,
                new AccountId(0),
                operator,
                paymentAmount,
            ),
            responseType: HieroProto.proto.ResponseType.COST_ANSWER,
        };
    }

    /**
     * @abstract
     * @internal
     * @returns {Promise<HieroProto.proto.IQuery>}
     */
    _makeRequestAsync() {
        return Promise.resolve(
            this._query._onMakeRequest(
                /** @type {HieroProto.proto.IQueryHeader} */ (this._header),
            ),
        );
    }

    /**
     * @abstract
     * @internal
     * @param {HieroProto.proto.IQuery} request
     * @param {HieroProto.proto.IResponse} response
     * @returns {[Status, ExecutionState]}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        return this._query._shouldRetry(request, response);
    }

    /**
     * @abstract
     * @internal
     * @param {HieroProto.proto.IQuery} request
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeId
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response, nodeId) {
        return this._query._mapStatusError(request, response, nodeId);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<Hbar>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const cost = this._query._mapResponseHeader(response).cost;
        return Promise.resolve(
            Hbar.fromTinybars(/** @type {Long | number} */ (cost)),
        );
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return this._query._execute(channel, request);
    }

    /**
     * @param {HieroProto.proto.Query} request
     * @returns {Uint8Array}
     */
    _requestToBytes(request) {
        return this._query._requestToBytes(request);
    }

    /**
     * @param {HieroProto.proto.Response} response
     * @returns {Uint8Array}
     */
    _responseToBytes(response) {
        return this._query._responseToBytes(response);
    }
}
