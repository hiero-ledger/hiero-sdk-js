// SPDX-License-Identifier: Apache-2.0

import Hbar from "../Hbar.js";
import AccountId from "../account/AccountId.js";
import * as HieroProto from "@hashgraph/proto";
import Long from "long";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../Status.js").default} Status
 * @typedef {import("../Executable.js").ExecutionState} ExecutionState
 */

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
