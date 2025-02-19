// SPDX-License-Identifier: Apache-2.0

import Query, { QUERY_REGISTRY } from "../query/Query.js";
import ContractId from "./ContractId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IQuery} HashgraphProto.proto.IQuery
 * @typedef {import("@hashgraph/proto").proto.IQueryHeader} HashgraphProto.proto.IQueryHeader
 * @typedef {import("@hashgraph/proto").proto.IResponse} HashgraphProto.proto.IResponse
 * @typedef {import("@hashgraph/proto").proto.IResponseHeader} HashgraphProto.proto.IResponseHeader
 * @typedef {import("@hashgraph/proto").proto.IContractGetBytecodeQuery} HashgraphProto.proto.IContractGetBytecodeQuery
 * @typedef {import("@hashgraph/proto").proto.IContractGetBytecodeResponse} HashgraphProto.proto.IContractGetBytecodeResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Query to retrieve the bytecode of a smart contract from the network.
 *
 * This query returns the bytecode of a smart contract instance that has been
 * created on the Hedera network. The bytecode represents the compiled code
 * that is executed by the Hedera network when the contract is called.
 *
 * @augments {Query<Uint8Array>}
 */
export default class ContractByteCodeQuery extends Query {
    /**
     * @param {object} props
     * @param {ContractId | string} [props.contractId]
     */
    constructor(props = {}) {
        super();

        /**
         * @type {?ContractId}
         * @private
         */
        this._contractId = null;
        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.IQuery} query
     * @returns {ContractByteCodeQuery}
     */
    static _fromProtobuf(query) {
        const bytecode =
            /** @type {HashgraphProto.proto.IContractGetBytecodeQuery} */ (
                query.contractGetBytecode
            );

        return new ContractByteCodeQuery({
            contractId:
                bytecode.contractID != null
                    ? ContractId._fromProtobuf(bytecode.contractID)
                    : undefined,
        });
    }

    /**
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * Set the contract ID for which the info is being requested.
     *
     * @param {ContractId | string} contractId
     * @returns {ContractByteCodeQuery}
     */
    setContractId(contractId) {
        this._contractId =
            typeof contractId === "string"
                ? ContractId.fromString(contractId)
                : contractId.clone();

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
     * @param {Channel} channel
     * @param {HashgraphProto.proto.IQuery} request
     * @returns {Promise<HashgraphProto.proto.IResponse>}
     */
    _execute(channel, request) {
        return channel.smartContract.contractGetBytecode(request);
    }

    /**
     * @override
     * @internal
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {HashgraphProto.proto.IResponseHeader}
     */
    _mapResponseHeader(response) {
        const contractGetBytecodeResponse =
            /** @type {HashgraphProto.proto.IContractGetBytecodeResponse} */ (
                response.contractGetBytecodeResponse
            );
        return /** @type {HashgraphProto.proto.IResponseHeader} */ (
            contractGetBytecodeResponse.header
        );
    }

    /**
     * @protected
     * @override
     * @param {HashgraphProto.proto.IResponse} response
     * @returns {Promise<Uint8Array>}
     */
    _mapResponse(response) {
        const contractGetBytecodeResponse =
            /** @type {HashgraphProto.proto.IContractGetBytecodeResponse} */ (
                response.contractGetBytecodeResponse
            );

        return Promise.resolve(
            contractGetBytecodeResponse.bytecode != null
                ? contractGetBytecodeResponse.bytecode
                : new Uint8Array(),
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
            contractGetBytecode: {
                header,
                contractID:
                    this._contractId != null
                        ? this._contractId._toProtobuf()
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

        return `ContractByteCodeQuery:${timestamp.toString()}`;
    }
}

// eslint-disable-next-line @typescript-eslint/unbound-method
QUERY_REGISTRY.set("contractGetBytecode", ContractByteCodeQuery._fromProtobuf);
