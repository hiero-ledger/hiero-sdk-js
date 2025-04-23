// SPDX-License-Identifier: Apache-2.0

import Status from "../Status.js";
import AccountId from "../account/AccountId.js";
import Hbar from "../Hbar.js";
import { ExecutionState } from "../Executable.js";
import TransactionId from "../transaction/TransactionId.js";
import * as HieroProto from "@hashgraph/proto";
import PrecheckStatusError from "../PrecheckStatusError.js";
import MaxQueryPaymentExceeded from "../MaxQueryPaymentExceeded.js";
import QueryBase from "./QueryBase.js";
import CostQuery from "./CostQuery.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../channel/MirrorChannel.js").default} MirrorChannel
 * @typedef {import("../PublicKey.js").default} PublicKey
 * @typedef {import("../client/Client.js").ClientOperator} ClientOperator
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../logger/Logger.js").default} Logger
 */

/**
 * This registry holds a bunch of callbacks for `fromProtobuf()` implementations
 * Since this is essentially aa cache, perhaps we should move this variable into the `Cache`
 * type for consistency?
 *
 * @type {Map<HieroProto.proto.Query["query"], (query: HieroProto.proto.IQuery) => Query<*>>}
 */
export const QUERY_REGISTRY = new Map();

/**
 * Base class for all queries that can be submitted to Hedera.
 *
 * @abstract
 * @template OutputT
 * @augments {QueryBase<HieroProto.proto.IQuery, HieroProto.proto.IResponse, OutputT>}
 */
export default class Query extends QueryBase {
    constructor() {
        super();

        /**
         * The payment transaction ID
         *
         * @type {?TransactionId}
         */
        this._paymentTransactionId = null;

        /**
         * The payment transactions list where each index points to a different node
         *
         * @type {HieroProto.proto.ITransaction[]}
         */
        this._paymentTransactions = [];

        /**
         * The amount being paid to the node for this query.
         * A user can set this field explicitly, or we'll query the value during execution.
         *
         * @type {?Hbar}
         */
        this._queryPayment = null;

        /**
         * The maximum query payment a user is willing to pay. Unlike `Transaction.maxTransactionFee`
         * this field only exists in the SDK; there is no protobuf field equivalent. If and when
         * we query the actual cost of the query and the cost is greater than the max query payment
         * we'll throw a `MaxQueryPaymentExceeded` error.
         *
         * @type {?Hbar}
         */
        this._maxQueryPayment = null;

        /**
         * This is strictly used for `_getLogId()` which requires a timestamp. The timestamp it typically
         * uses comes from the payment transaction ID, but that field is not set if this query is free.
         * For those occasions we use this timestamp field generated at query construction instead.
         *
         * @type {number}
         */
        this._timestamp = Date.now();
    }

    /**
     * Deserialize a query from bytes. The bytes should be a `proto.Query`.
     *
     * @template T
     * @param {Uint8Array} bytes
     * @returns {Query<T>}
     */
    static fromBytes(bytes) {
        const query = HieroProto.proto.Query.decode(bytes);

        if (query.query == null) {
            throw new Error("(BUG) query.query was not set in the protobuf");
        }

        const fromProtobuf =
            /** @type {(query: HieroProto.proto.IQuery) => Query<T>} */ (
                QUERY_REGISTRY.get(query.query)
            );

        if (fromProtobuf == null) {
            throw new Error(
                `(BUG) Query.fromBytes() not implemented for type ${query.query}`,
            );
        }

        return fromProtobuf(query);
    }

    /**
     * Serialize the query into bytes.
     *
     * **NOTE**: Does not preserve payment transactions
     *
     * @returns {Uint8Array}
     */
    toBytes() {
        return HieroProto.proto.Query.encode(this._makeRequest()).finish();
    }

    /**
     * Set an explicit payment amount for this query.
     *
     * The client will submit exactly this amount for the payment of this query. Hedera
     * will not return any remainder.
     *
     * @param {Hbar} queryPayment
     * @returns {this}
     */
    setQueryPayment(queryPayment) {
        this._queryPayment = queryPayment;

        return this;
    }

    /**
     * Set the maximum payment allowable for this query.
     *
     * @param {Hbar} maxQueryPayment
     * @returns {this}
     */
    setMaxQueryPayment(maxQueryPayment) {
        this._maxQueryPayment = maxQueryPayment;

        return this;
    }

    /**
     * Fetch the cost of this query from a consensus node
     *
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<Hbar>}
     */
    async getCost(client) {
        // The node account IDs must be set to execute a cost query
        if (this._nodeAccountIds.isEmpty) {
            this._nodeAccountIds.setList(
                client._network.getNodeAccountIdsForExecute(),
            );
        }

        // Change the timestamp. Should we be doing this?
        this._timestamp = Date.now();
        const cost = await new CostQuery(this).execute(client);
        return Hbar.fromTinybars(
            cost._valueInTinybar.multipliedBy(1.1).toFixed(0),
        );
    }

    /**
     * Set he payment transaction explicitly
     *
     * @param {TransactionId} paymentTransactionId
     * @returns {this}
     */
    setPaymentTransactionId(paymentTransactionId) {
        this._paymentTransactionId = paymentTransactionId;
        return this;
    }

    /**
     * Get the payment transaction ID
     *
     * @returns {?TransactionId}
     */
    get paymentTransactionId() {
        return this._paymentTransactionId;
    }

    /**
     * Get the current transaction ID, and make sure it's not null
     *
     * @returns {TransactionId}
     */
    _getTransactionId() {
        if (this._paymentTransactionId == null) {
            throw new Error(
                "Query.PaymentTransactionId was not set duration execution",
            );
        }

        return this._paymentTransactionId;
    }

    /**
     * Is payment required for this query. By default most queries require payment
     * so the default implementation returns true.
     *
     * @protected
     * @returns {boolean}
     */
    _isPaymentRequired() {
        return true;
    }

    /**
     * Validate checksums of the query.
     *
     * @param {Client} client
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    _validateChecksums(client) {
        // Shouldn't we be checking `paymentTransactionId` here sine it contains an `accountId`?
        // Do nothing
    }

    /**
     * Before we proceed exeuction, we need to do a couple checks
     *
     * @template {MirrorChannel} MirrorChannelT
     * @param {import("../client/Client.js").default<Channel, MirrorChannelT>} client
     * @returns {Promise<void>}
     */
    async _beforeExecute(client) {
        // If we're executing this query multiple times the the payment transaction ID list
        // will already be set
        if (this._paymentTransactions.length > 0) {
            return;
        }

        // Check checksums if enabled
        if (client.isAutoValidateChecksumsEnabled()) {
            this._validateChecksums(client);
        }

        // If the nodes aren't set, set them.
        if (this._nodeAccountIds.isEmpty) {
            this._nodeAccountIds.setList(
                client._network.getNodeAccountIdsForExecute(),
            );
        }

        // Save the operator
        this._operator =
            this._operator != null ? this._operator : client._operator;

        // And payment is required
        if (this._isPaymentRequired()) {
            // Assign the account IDs to which the transaction should be sent.
            this.transactionNodeIds = Object.values(client.network).map(
                (accountNodeId) => accountNodeId.toString(),
            );

            // And the client has an operator
            if (this._operator != null) {
                // Generate the payment transaction ID
                this._paymentTransactionId = TransactionId.generate(
                    this._operator.accountId,
                );
            } else {
                // If payment is required, but an operator did not exist, throw an error
                throw new Error(
                    "`client` must have an `operator` or an explicit payment transaction must be provided",
                );
            }
        } else {
            // If the payment transaction ID is not set, but this query doesn't require a payment
            // set the payment transaction ID to an empty transaction ID.
            // FIXME: Should use `TransactionId.withValidStart()` instead
            this._paymentTransactionId = TransactionId.generate(
                new AccountId(0),
            );
        }

        let cost = new Hbar(0);

        const maxQueryPayment =
            this._maxQueryPayment != null
                ? this._maxQueryPayment
                : client.defaultMaxQueryPayment;

        if (this._queryPayment != null) {
            cost = this._queryPayment;
        } else if (
            this._paymentTransactions.length === 0 &&
            this._isPaymentRequired()
        ) {
            // If the query payment was not explictly set, fetch the actual cost.
            const actualCost = await this.getCost(client);

            // Confirm it's less than max query payment
            if (
                maxQueryPayment.toTinybars().toInt() <
                actualCost.toTinybars().toInt()
            ) {
                throw new MaxQueryPaymentExceeded(actualCost, maxQueryPayment);
            }

            cost = actualCost;
            if (this._logger) {
                this._logger.debug(
                    `[${this._getLogId()}] received cost for query ${cost.toString()}`,
                );
            }
        }

        // Set the either queried cost, or the original value back into `queryPayment`
        // in case a user executes same query multiple times. However, users should
        // really not be executing the same query multiple times meaning this is
        // typically not needed.
        this._queryPayment = cost;

        // Not sure if we should be overwritting this field tbh.
        this._timestamp = Date.now();

        this._nodeAccountIds.setLocked();

        // Generate the payment transactions
        for (const nodeId of this._nodeAccountIds.list) {
            const logId = this._getLogId();
            const paymentTransactionId =
                /** @type {import("../transaction/TransactionId.js").default} */ (
                    this._paymentTransactionId
                );
            const paymentAmount = /** @type {Hbar} */ (this._queryPayment);

            if (this._logger) {
                this._logger.debug(
                    `[${logId}] making a payment transaction for node ${nodeId.toString()} and transaction ID ${paymentTransactionId.toString()} with amount ${paymentAmount.toString()}`,
                );
            }

            this._paymentTransactions.push(
                await this._makePaymentTransaction(
                    paymentTransactionId,
                    nodeId,
                    this._isPaymentRequired() ? this._operator : null,
                    paymentAmount,
                ),
            );
        }
    }

    /**
     * @abstract
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponseHeader(response) {
        throw new Error("not implemented");
    }

    /**
     * @protected
     * @returns {HieroProto.proto.IQueryHeader}
     */
    _makeRequestHeader() {
        /** @type {HieroProto.proto.IQueryHeader} */
        let header = {};

        if (this._isPaymentRequired() && this._paymentTransactions.length > 0) {
            header = {
                responseType: HieroProto.proto.ResponseType.ANSWER_ONLY,
                payment: this._paymentTransactions[this._nodeAccountIds.index],
            };
        }

        return header;
    }

    /**
     * @abstract
     * @internal
     * @param {HieroProto.proto.IQueryHeader} header
     * @returns {HieroProto.proto.IQuery}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _onMakeRequest(header) {
        throw new Error("not implemented");
    }

    /**
     * @internal
     * @returns {HieroProto.proto.IQuery}
     */
    _makeRequest() {
        /** @type {HieroProto.proto.IQueryHeader} */
        let header = {};

        if (this._isPaymentRequired() && this._paymentTransactions != null) {
            header = {
                payment: this._paymentTransactions[this._nodeAccountIds.index],
                responseType: HieroProto.proto.ResponseType.ANSWER_ONLY,
            };
        }

        return this._onMakeRequest(header);
    }

    /**
     * @override
     * @internal
     * @returns {Promise<HieroProto.proto.IQuery>}
     */
    async _makeRequestAsync() {
        /** @type {HieroProto.proto.IQueryHeader} */
        let header = {
            responseType: HieroProto.proto.ResponseType.ANSWER_ONLY,
        };

        const logId = this._getLogId();
        const nodeId = this._nodeAccountIds.current;
        const paymentTransactionId = TransactionId.generate(
            this._operator ? this._operator.accountId : new AccountId(0),
        );
        const paymentAmount = /** @type {Hbar} */ (this._queryPayment);

        if (this._logger) {
            this._logger.debug(
                `[${logId}] making a payment transaction for node ${nodeId.toString()} and transaction ID ${paymentTransactionId.toString()} with amount ${paymentAmount.toString()}`,
            );
        }

        header.payment = await this._makePaymentTransaction(
            paymentTransactionId,
            nodeId,
            this._isPaymentRequired() ? this._operator : null,
            paymentAmount,
        );

        return this._onMakeRequest(header);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IQuery} request
     * @param {HieroProto.proto.IResponse} response
     * @returns {[Status, ExecutionState]}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : HieroProto.proto.ResponseCodeEnum.OK,
        );
        if (this._logger) {
            this._logger.debug(
                `[${this._getLogId()}] received status ${status.toString()}`,
            );
        }

        switch (status) {
            case Status.Busy:
            case Status.Unknown:
            case Status.PlatformTransactionNotCreated:
            case Status.PlatformNotActive:
                return [status, ExecutionState.Retry];
            case Status.Ok:
                return [status, ExecutionState.Finished];
            default:
                return [status, ExecutionState.Error];
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

        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : HieroProto.proto.ResponseCodeEnum.OK,
        );

        return new PrecheckStatusError({
            nodeId,
            status,
            transactionId: this._getTransactionId(),
            contractFunctionResult: null,
        });
    }

    /**
     * @param {HieroProto.proto.Query} request
     * @returns {Uint8Array}
     */
    _requestToBytes(request) {
        return HieroProto.proto.Query.encode(request).finish();
    }

    /**
     * @param {HieroProto.proto.Response} response
     * @returns {Uint8Array}
     */
    _responseToBytes(response) {
        return HieroProto.proto.Response.encode(response).finish();
    }
}
