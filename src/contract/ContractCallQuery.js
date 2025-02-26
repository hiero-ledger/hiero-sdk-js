// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import ContractId from "./ContractId.js";
import AccountId from "../account/AccountId.js";
import ContractFunctionParameters from "./ContractFunctionParameters.js";
import ContractFunctionResult from "./ContractFunctionResult.js";
import Long from "long";
import * as HieroProto from "@hashgraph/proto";
import PrecheckStatusError from "../PrecheckStatusError.js";
import Status from "../Status.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 */

/**
 * @typedef {object} FunctionParameters
 * @property {ContractFunctionParameters} parameters
 * @property {string} name
 */

/**
 * A query that calls a function of a contract instance. It will consume the amount of gas
 * specified, and return the result of the function call.
 *
 * This query will not update the state of the contract instance on the network, but will
 * only retrieve information. To update the state, you must use ContractExecuteTransaction.
 *
 * @augments {Query<ContractFunctionResult>}
 */
export default class ContractCallQuery extends Query {
    /**
     * @param {object} [props]
     * @param {ContractId | string} [props.contractId]
     * @param {number | Long} [props.gas]
     * @param {FunctionParameters | Uint8Array} [props.functionParameters]
     * @param {number | Long} [props.maxResultSize]
     * @param {AccountId | string} [props.senderAccountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?ContractId}
         */
        this._contractId = null;
        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }

        /**
         * @private
         * @type {?Long}
         */
        this._gas = null;
        if (props.gas != null) {
            this.setGas(props.gas);
        }

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._functionParameters = null;
        if (props.functionParameters != null) {
            if (props.functionParameters instanceof Uint8Array) {
                this.setFunctionParameters(props.functionParameters);
            } else {
                this.setFunction(
                    props.functionParameters.name,
                    props.functionParameters.parameters,
                );
            }
        }

        /**
         * @private
         * @type {?Long}
         */
        this._maxResultSize = null;
        if (props.maxResultSize != null) {
            this.setMaxResultSize(props.maxResultSize);
        }

        /**
         * @private
         * @type {?AccountId}
         */
        this._senderAccountId = null;
        if (props.senderAccountId != null) {
            this.setSenderAccountId(props.senderAccountId);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.IQuery} query
     * @returns {ContractCallQuery}
     */
    static _fromProtobuf(query) {
        const call = /** @type {HieroProto.proto.IContractCallLocalQuery} */ (
            query.contractCallLocal
        );

        return new ContractCallQuery({
            contractId:
                call.contractID != null
                    ? ContractId._fromProtobuf(call.contractID)
                    : undefined,
            gas: call.gas != null ? call.gas : undefined,
            functionParameters:
                call.functionParameters != null
                    ? call.functionParameters
                    : undefined,
            maxResultSize:
                call.maxResultSize != null ? call.maxResultSize : undefined,
        });
    }

    /**
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * Set the contract ID for which the call is being requested.
     *
     * @param {ContractId | string} contractId
     * @returns {ContractCallQuery}
     */
    setContractId(contractId) {
        this._contractId =
            typeof contractId === "string"
                ? ContractId.fromString(contractId)
                : contractId.clone();

        return this;
    }

    /**
     * @returns {?Long}
     */
    get gas() {
        return this._gas;
    }

    /**
     * @param {number | Long} gas
     * @returns {ContractCallQuery}
     */
    setGas(gas) {
        this._gas = gas instanceof Long ? gas : Long.fromValue(gas);
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get senderAccountId() {
        return this._senderAccountId;
    }

    /**
     * @param {AccountId | string} senderAccountId
     * @returns {ContractCallQuery}
     */
    setSenderAccountId(senderAccountId) {
        this._senderAccountId =
            typeof senderAccountId === "string"
                ? AccountId.fromString(senderAccountId)
                : senderAccountId;
        return this;
    }

    /**
     * @returns {?Uint8Array}
     */
    get functionParameters() {
        return this._functionParameters;
    }

    /**
     * @param {Uint8Array} params
     * @returns {ContractCallQuery}
     */
    setFunctionParameters(params) {
        this._functionParameters = params;
        return this;
    }

    /**
     * @param {string} name
     * @param {?ContractFunctionParameters} [params]
     * @returns {ContractCallQuery}
     */
    setFunction(name, params) {
        this._functionParameters = (
            params != null ? params : new ContractFunctionParameters()
        )._build(name);

        return this;
    }

    /**
     * @param {number | Long} size
     * @returns {ContractCallQuery}
     */
    setMaxResultSize(size) {
        this._maxResultSize =
            size instanceof Long ? size : Long.fromValue(size);
        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._contractId != null) {
            this._contractId.validateChecksum(client);
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
    _mapStatusError(request, response, nodeId) {
        const { nodeTransactionPrecheckCode } =
            this._mapResponseHeader(response);

        const status = Status._fromCode(
            nodeTransactionPrecheckCode != null
                ? nodeTransactionPrecheckCode
                : HieroProto.proto.ResponseCodeEnum.OK,
        );

        const call =
            /**
             *@type {HieroProto.proto.IContractCallLocalResponse}
             */
            (response.contractCallLocal);
        if (!call.functionResult) {
            return new PrecheckStatusError({
                nodeId,
                status,
                transactionId: this._getTransactionId(),
                contractFunctionResult: null,
            });
        }

        const contractFunctionResult = this._mapResponseSync(response);

        return new PrecheckStatusError({
            nodeId,
            status,
            transactionId: this._getTransactionId(),
            contractFunctionResult,
        });
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.IQuery} request
     * @returns {Promise<HieroProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.smartContract.contractCallLocalMethod(request);
    }

    /**
     * @override
     * @internal
     * @param {HieroProto.proto.IResponse} response
     * @returns {HieroProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const contractCallLocal =
            /** @type {HieroProto.proto.IContractCallLocalResponse} */ (
                response.contractCallLocal
            );
        return /** @type {HieroProto.proto.IResponseHeader} */ (
            contractCallLocal.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HieroProto.proto.IResponse} response
     * @returns {Promise<ContractFunctionResult>}
     */
    _mapResponse(response) {
        const call =
            /**
             *@type {HieroProto.proto.IContractCallLocalResponse}
             */
            (response.contractCallLocal);

        return Promise.resolve(
            ContractFunctionResult._fromProtobuf(
                /**
                 * @type {HieroProto.proto.IContractFunctionResult}
                 */
                (call.functionResult),
                false,
            ),
        );
    }

    /**
     * @private
     * @param {HieroProto.proto.IResponse} response
     * @returns {ContractFunctionResult}
     */
    _mapResponseSync(response) {
        const call =
            /**
             *@type {HieroProto.proto.IContractCallLocalResponse}
             */
            (response.contractCallLocal);

        return ContractFunctionResult._fromProtobuf(
            /**
             * @type {HieroProto.proto.IContractFunctionResult}
             */
            (call.functionResult),
            false,
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
            contractCallLocal: {
                header,
                contractID:
                    this._contractId != null
                        ? this._contractId._toProtobuf()
                        : null,
                gas: this._gas,
                maxResultSize: this._maxResultSize,
                functionParameters: this._functionParameters,
                senderId:
                    this._senderAccountId != null
                        ? this._senderAccountId._toProtobuf()
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

        return `ContractCallQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("contractCallLocal", ContractCallQuery._fromProtobuf);
