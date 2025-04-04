// SPDX-License-Identifier: Apache-2.0

import Executable from "../Executable.js";
import Hbar from "../Hbar.js";
import AccountId from "../account/AccountId.js";
import * as HieroProto from "@hashgraph/proto";
import Long from "long";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../Status.js").default} Status
 * @typedef {import("../Executable.js").ExecutionState} ExecutionState
 * @typedef {import("../client/Client.js").ClientOperator} ClientOperator
 * @typedef {import("../PublicKey.js").default} PublicKey
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../logger/Logger.js").default} Logger
 */

/**
 * Base class for all query-related functionality that can be shared between Query and CostQuery.
 *
 * @abstract
 * @template RequestT
 * @template ResponseT
 * @template OutputT
 * @augments {Executable<RequestT, ResponseT, OutputT>}
 */
export default class QueryBase extends Executable {
    constructor() {
        super();
    }

    /**
     * Create a payment transaction for a query
     *
     * @param {TransactionId} paymentTransactionId
     * @param {AccountId} nodeId
     * @param {?ClientOperator} operator
     * @param {Hbar} paymentAmount
     * @returns {Promise<HieroProto.proto.ITransaction>}
     */
    async _makePaymentTransaction(
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
}
