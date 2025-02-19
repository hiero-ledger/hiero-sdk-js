// SPDX-License-Identifier: Apache-2.0
import PendingAirdropId from "../token/PendingAirdropId.js";
import { TRANSACTION_REGISTRY } from "../transaction/Transaction.js";
import Transaction from "../transaction/Transaction.js";
import AirdropPendingTransaction from "./AirdropPendingTransaction.js";

/**
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HashgraphProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HashgraphProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HashgraphProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HashgraphProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HashgraphProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenCancelAirdropTransactionBody} HashgraphProto.proto.ITokenCancelAirdropTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * A transaction that allows the cancellation of pending airdrops.
 * This transaction can be used by authorized accounts to cancel airdrop operations
 * that have been initiated but not yet claimed by recipients.
 */
export default class TokenCancelAirdropTransaction extends AirdropPendingTransaction {
    /**
     * @param {object} props
     * @param {PendingAirdropId[]} [props.pendingAirdropIds]
     */
    constructor(props = {}) {
        super(props);
    }

    /**
     * @override
     * @internal
     * @returns {HashgraphProto.proto.ITokenCancelAirdropTransactionBody}
     */
    _makeTransactionData() {
        return {
            pendingAirdrops: this.pendingAirdropIds.map((pendingAirdropId) =>
                pendingAirdropId.toBytes(),
            ),
        };
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HashgraphProto.proto.ITransaction} request
     * @returns {Promise<HashgraphProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.token.cancelAirdrop(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HashgraphProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenCancelAirdrop";
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.ITransaction[]} transactions
     * @param {HashgraphProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HashgraphProto.proto.ITransactionBody[]} bodies
     * @returns {TokenCancelAirdropTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const { pendingAirdrops } =
            /** @type {HashgraphProto.proto.ITokenCancelAirdropTransactionBody} */ (
                body.tokenCancelAirdrop
            );

        return Transaction._fromProtobufTransactions(
            new TokenCancelAirdropTransaction({
                pendingAirdropIds: pendingAirdrops?.map((pendingAirdrop) => {
                    return PendingAirdropId.fromBytes(pendingAirdrop);
                }),
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenCancelAirdrop:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenCancelAirdrop",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenCancelAirdropTransaction._fromProtobuf,
);
