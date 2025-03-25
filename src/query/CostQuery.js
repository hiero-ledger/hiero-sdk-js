// SPDX-License-Identifier: Apache-2.0

import TransactionId from "../transaction/TransactionId.js";
import Hbar from "../Hbar.js";
import Executable from "../Executable.js";
import AccountId from "../account/AccountId.js";
import * as HieroProto from "@hashgraph/proto";
import Long from "long";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../Status.js").default} Status
 * @typedef {import("../Executable.js").ExecutionState} ExecutionState
 */

/**
 * @template OutputT
 * @augments {Executable<HieroProto.proto.IQuery, HieroProto.proto.IResponse, Hbar>}
 */
export default class CostQuery extends Executable {
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
            payment: await _makePaymentTransaction(
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

/**
 * Generate a payment transaction given, aka. `TransferTransaction`
 *
 * @param {TransactionId} paymentTransactionId
 * @param {AccountId} nodeId
 * @param {?import("../Executable.js").ClientOperator} operator
 * @param {Hbar} paymentAmount
 * @returns {Promise<HieroProto.proto.ITransaction>}
 */
export async function _makePaymentTransaction(
    paymentTransactionId,
    nodeId,
    operator,
    paymentAmount,
) {
    const accountAmounts = [];

    // If an operator is provided then we should make sure we transfer
    // from the operator to the node.
    // If an operator is not provided we simply create an effectively
    // empty account amounts
    if (operator != null) {
        accountAmounts.push({
            accountID: operator.accountId._toProtobuf(),
            amount: paymentAmount.negated().toTinybars(),
        });
        accountAmounts.push({
            accountID: nodeId._toProtobuf(),
            amount: paymentAmount.toTinybars(),
        });
    } else {
        accountAmounts.push({
            accountID: new AccountId(0)._toProtobuf(),
            // If the account ID is 0, shouldn't we just hard
            // code this value to 0? Same for the latter.
            amount: paymentAmount.negated().toTinybars(),
        });
        accountAmounts.push({
            accountID: nodeId._toProtobuf(),
            amount: paymentAmount.toTinybars(),
        });
    }
    /**
     * @type {HieroProto.proto.ITransactionBody}
     */
    const body = {
        transactionID: paymentTransactionId._toProtobuf(),
        nodeAccountID: nodeId._toProtobuf(),
        transactionFee: new Hbar(1).toTinybars(),
        transactionValidDuration: {
            seconds: Long.fromNumber(120),
        },
        cryptoTransfer: {
            transfers: {
                accountAmounts,
            },
        },
    };

    /** @type {HieroProto.proto.ISignedTransaction} */
    const signedTransaction = {
        bodyBytes: HieroProto.proto.TransactionBody.encode(body).finish(),
    };

    // Sign the transaction if an operator is provided
    //
    // We have _several_ places where we build the transactions, maybe this is
    // something we can deduplicate?
    if (operator != null) {
        const signature = await operator.transactionSigner(
            /** @type {Uint8Array} */ (signedTransaction.bodyBytes),
        );

        signedTransaction.sigMap = {
            sigPair: [operator.publicKey._toProtobufSignature(signature)],
        };
    }

    // Create and return a `proto.Transaction`
    return {
        signedTransactionBytes:
            HieroProto.proto.SignedTransaction.encode(
                signedTransaction,
            ).finish(),
    };
}
