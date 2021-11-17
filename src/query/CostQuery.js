import TransactionId from "../transaction/TransactionId.js";
import Hbar from "../Hbar.js";
import Executable from "../Executable.js";
import AccountId from "../account/AccountId.js";
import { _makePaymentTransaction, COST_QUERY } from "./Query.js";
import { ResponseType as ProtoResponseType } from "@exodus/hashgraph-proto";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IQuery} proto.IQuery
 * @typedef {import("@exodus/hashgraph-proto").IResponse} proto.IResponse
 * @typedef {import("@exodus/hashgraph-proto").IQueryHeader} proto.IQueryHeader
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../Status.js").default} Status
 * @typedef {import("../Executable.js").ExecutionState} ExecutionState
 */

/**
 * @template OutputT
 * @augments {Executable<proto.IQuery, proto.IResponse, Hbar>}
 */
export default class CostQuery extends Executable {
    /**
     * @param {import("./Query.js").default<OutputT>} query
     */
    constructor(query) {
        super();

        this._query = query;

        /**
         * @type {proto.IQueryHeader | null}
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
     * @abstract
     * @protected
     * @param {import("../client/Client.js").default<*, *>} client
     * @returns {Promise<void>}
     */
    async _beforeExecute(client) {
        if (client == null) {
            throw new Error("Cannot do CostQuery without Client");
        }

        const operator = client._operator;

        if (operator == null) {
            throw new Error(
                "`client` must have an `operator` or an explicit payment transaction must be provided"
            );
        }

        if (this._query._nodeIds.length == 0) {
            this._query._nodeIds =
                client._network.getNodeAccountIdsForExecute();
        }

        this._header = {
            payment: await _makePaymentTransaction(
                /** @type {import("../transaction/TransactionId.js").default} */
                (TransactionId.generate(new AccountId(0))),
                new AccountId(0),
                operator,
                new Hbar(0)
            ),
            responseType: ProtoResponseType.COST_ANSWER,
        };
    }

    /**
     * @abstract
     * @internal
     * @returns {Promise<proto.IQuery>}
     */
    _makeRequestAsync() {
        return Promise.resolve(
            this._query._onMakeRequest(
                /** @type {proto.IQueryHeader} */ (this._header)
            )
        );
    }

    /**
     * @abstract
     * @internal
     * @param {proto.IQuery} request
     * @param {proto.IResponse} response
     * @returns {ExecutionState}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _shouldRetry(request, response) {
        return this._query._shouldRetry(request, response);
    }

    /**
     * @abstract
     * @internal
     * @param {proto.IQuery} request
     * @param {proto.IResponse} response
     * @returns {Error}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapStatusError(request, response) {
        return this._query._mapStatusError(request, response);
    }

    /**
     * @override
     * @internal
     * @param {proto.IResponse} response
     * @param {AccountId} nodeAccountId
     * @param {proto.IQuery} request
     * @returns {Promise<Hbar>}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _mapResponse(response, nodeAccountId, request) {
        const cost = this._query._mapResponseHeader(response).cost;
        return Promise.resolve(
            Hbar.fromTinybars(/** @type {Long | number} */ (cost))
        );
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.IQuery} request
     * @returns {Promise<proto.IResponse>}
     */
    _execute(channel, request) {
        return this._query._execute(channel, request);
    }

    /**
     * @override
     * @returns {AccountId}
     */
    _getNodeAccountId() {
        return this._query._getNodeAccountId();
    }
}

COST_QUERY.push((query) => new CostQuery(query));
