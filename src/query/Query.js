import Status from "../Status.js";
import AccountId from "../account/AccountId.js";
import Hbar from "../Hbar.js";
import Executable, { ExecutionState } from "../Executable.js";
import TransactionId from "../transaction/TransactionId.js";
import {
    Query as ProtoQuery,
    TransactionBody as ProtoTransactionBody,
    SignedTransaction as ProtoSignedTransaction,
    ResponseType as ProtoResponseType,
    ResponseCodeEnum,
} from "@exodus/hashgraph-proto";
import PrecheckStatusError from "../PrecheckStatusError.js";
import MaxQueryPaymentExceeded from "../MaxQueryPaymentExceeded.js";
import Long from "long";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 */

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IResponseHeader} proto.IResponseHeader
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ResponseCodeEnum} proto.ResponseCodeEnum
 */

/**
 * @typedef {import("../client/Client.js").ClientOperator} ClientOperator
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * @type {Map<ProtoQuery["query"], (query: proto.IQuery) => Query<*>>}
 */
export const QUERY_REGISTRY = new Map();

/**
 * Base class for all queries that can be submitted to Hedera.
 *
 * @abstract
 * @template OutputT
 * @augments {Executable<proto.IQuery, proto.IResponse, OutputT>}
 */
export default class Query extends Executable {
    constructor() {
        super();

        /** @type {?TransactionId} */
        this._paymentTransactionId = null;

        /** @type {proto.ITransaction[]} */
        this._paymentTransactions = [];

        /** @type {?Hbar} */
        this._queryPayment = null;

        /** @type {?Hbar} */
        this._maxQueryPayment = null;
    }

    /**
     * @template T
     * @param {Uint8Array} bytes
     * @returns {Query<T>}
     */
    static fromBytes(bytes) {
        const query = ProtoQuery.decode(bytes);

        if (query.query == null) {
            throw new Error("(BUG) query.query was not set in the protobuf");
        }

        const fromProtobuf = /** @type {(query: proto.IQuery) => Query<T>} */ (
            QUERY_REGISTRY.get(query.query)
        );

        if (fromProtobuf == null) {
            throw new Error(
                `(BUG) Query.fromBytes() not implemented for type ${query.query}`
            );
        }

        return fromProtobuf(query);
    }

    /**
     * @returns {Uint8Array}
     */
    toBytes() {
        return ProtoQuery.encode(this._makeRequest()).finish();
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
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @returns {Promise<Hbar>}
     */
    getCost(client) {
        if (COST_QUERY.length != 1) {
            throw new Error("CostQuery has not been loaded yet");
        }

        return COST_QUERY[0](this).execute(client);
    }

    /**
     * @param {TransactionId} paymentTransactionId
     * @returns {this}
     */
    setPaymentTransactionId(paymentTransactionId) {
        this._paymentTransactionId = paymentTransactionId;
        return this;
    }

    /**
     * @returns {?TransactionId}
     */
    get paymentTransactionId() {
        return this._paymentTransactionId;
    }

    /**
     * @returns {TransactionId}
     */
    _getTransactionId() {
        if (this._paymentTransactionId == null) {
            throw new Error(
                "Query.PaymentTransactionId was not set duration execution"
            );
        }

        return this._paymentTransactionId;
    }

    /**
     * @protected
     * @returns {boolean}
     */
    _isPaymentRequired() {
        return true;
    }

    /**
     * @param {Client} client
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    _validateChecksums(client) {
        // Do nothing
    }

    /**
     * @template MirrorChannelT
     * @param {import("../client/Client.js").default<Channel, MirrorChannelT>} client
     * @returns {Promise<void>}
     */
    async _beforeExecute(client) {
        if (this._paymentTransactions.length > 0) {
            return;
        }

        if (client.isAutoValidateChecksumsEnabled()) {
            this._validateChecksums(client);
        }

        if (this._nodeIds.length == 0) {
            this._nodeIds = client._network.getNodeAccountIdsForExecute();
        }

        const operator = client._operator;

        if (this._paymentTransactionId == null) {
            if (this._isPaymentRequired()) {
                if (operator != null) {
                    this._paymentTransactionId = TransactionId.generate(
                        operator.accountId
                    );
                } else {
                    throw new Error(
                        "`client` must have an `operator` or an explicit payment transaction must be provided"
                    );
                }
            } else {
                this._paymentTransactionId = TransactionId.generate(
                    new AccountId(0)
                );
            }
        }

        let cost =
            this._queryPayment != null
                ? this._queryPayment
                : client.maxQueryPayment;

        if (
            this._paymentTransactions.length !== 0 ||
            !this._isPaymentRequired()
        ) {
            cost = new Hbar(0);
        } else {
            if (this._queryPayment == null) {
                const actualCost = await this.getCost(client);

                if (
                    cost.toTinybars().toInt() < actualCost.toTinybars().toInt()
                ) {
                    throw new MaxQueryPaymentExceeded(cost, actualCost);
                }

                cost = actualCost;
            }
        }

        for (const node of this._nodeIds) {
            this._paymentTransactions.push(
                await _makePaymentTransaction(
                    /** @type {import("../transaction/TransactionId.js").default} */ (
                        this._paymentTransactionId
                    ),
                    node,
                    this._isPaymentRequired() ? operator : null,
                    /** @type {Hbar} */ (cost)
                )
            );
        }
    }

    /**
     * @abstract
     * @internal
     * @param {proto.IResponse} response
     * @returns {proto.IResponseHeader}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponseHeader(response) {
        throw new Error("not implemented");
    }

    /**
     * @protected
     * @returns {proto.IQueryHeader}
     */
    _makeRequestHeader() {
        /** @type {proto.IQueryHeader} */
        let header = {};

        if (this._isPaymentRequired() && this._paymentTransactions.length > 0) {
            header = {
                responseType: ProtoResponseType.ANSWER_ONLY,
                payment: this._paymentTransactions[this._nextNodeIndex],
            };
        }

        return header;
    }

    /**
     * @abstract
     * @internal
     * @param {proto.IQueryHeader} header
     * @returns {proto.IQuery}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _onMakeRequest(header) {
        throw new Error("not implemented");
    }

    /**
     * @internal
     * @returns {proto.IQuery}
     */
    _makeRequest() {
        /** @type {proto.IQueryHeader} */
        let header = {};

        if (this._isPaymentRequired() && this._paymentTransactions != null) {
            header = {
                payment: this._paymentTransactions[this._nextNodeIndex],
                responseType: ProtoResponseType.ANSWER_ONLY,
            };
        }

        return this._onMakeRequest(header);
    }

    /**
     * @override
     * @internal
     * @returns {Promise<proto.IQuery>}
     */
    _makeRequestAsync() {
        return Promise.resolve(this._makeRequest());
    }

    /**
     * @override
     * @internal
     * @param {proto.IQuery} request
     * @param {proto.IResponse} response
     * @returns {ExecutionState}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : ResponseCodeEnum.OK
        );

        switch (status) {
            case Status.Busy:
            case Status.Unknown:
            case Status.PlatformTransactionNotCreated:
                return ExecutionState.Retry;
            case Status.Ok:
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

        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : ResponseCodeEnum.OK
        );

        return new PrecheckStatusError({
            status,
            transactionId: this._getTransactionId(),
        });
    }

    /**
     * @returns {AccountId}
     */
    _getNodeAccountId() {
        if (this._nodeIds.length > 0) {
            // if there are payment transactions,
            // we need to use the node of the current payment transaction
            return this._nodeIds[this._nextNodeIndex];
        } else {
            throw new Error(
                "(BUG) nodeAccountIds were not set for query before executing"
            );
        }
    }

    /**
     * @override
     * @protected
     * @returns {void}
     */
    _advanceRequest() {
        if (this._isPaymentRequired() && this._paymentTransactions.length > 0) {
            // each time we move our cursor to the next transaction
            // wrapping around to ensure we are cycling
            super._nextNodeIndex =
                (this._nextNodeIndex + 1) % this._paymentTransactions.length;
        } else {
            super._advanceRequest();
        }
    }
}

/**
 * @param {TransactionId} paymentTransactionId
 * @param {AccountId} nodeId
 * @param {?ClientOperator} operator
 * @param {Hbar} paymentAmount
 * @returns {Promise<proto.ITransaction>}
 */
export async function _makePaymentTransaction(
    paymentTransactionId,
    nodeId,
    operator,
    paymentAmount
) {
    const accountAmounts = [];

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
            amount: paymentAmount.negated().toTinybars(),
        });
        accountAmounts.push({
            accountID: nodeId._toProtobuf(),
            amount: paymentAmount.toTinybars(),
        });
    }
    /**
     * @type {proto.ITransactionBody}
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

    /** @type {proto.ISignedTransaction} */
    const signedTransaction = {
        bodyBytes: ProtoTransactionBody.encode(body).finish(),
    };

    if (operator != null) {
        const signature = await operator.transactionSigner(
            /** @type {Uint8Array} */ (signedTransaction.bodyBytes)
        );

        signedTransaction.sigMap = {
            sigPair: [
                {
                    pubKeyPrefix: operator.publicKey.toBytes(),
                    ed25519: signature,
                },
            ],
        };
    }

    return {
        signedTransactionBytes:
            ProtoSignedTransaction.encode(signedTransaction).finish(),
    };
}

/**
 * @type {((query: Query<*>) => import("./CostQuery.js").default<*>)[]}
 */
export const COST_QUERY = [];
