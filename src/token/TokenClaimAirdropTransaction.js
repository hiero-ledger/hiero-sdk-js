// SPDX-License-Identifier: Apache-2.0
import PendingAirdropId from "../token/PendingAirdropId.js";
import AirdropPendingTransaction from "./AirdropPendingTransaction.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITokenClaimAirdropTransactionBody} HieroProto.proto.ITokenClaimAirdropTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * A transaction that allows an account to claim tokens from a pending airdrop.
 * This transaction is used to finalize the receipt of tokens that were distributed
 * through an airdrop mechanism but require explicit claiming by the recipient.
 */
export default class TokenClaimAirdropTransaction extends AirdropPendingTransaction {
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
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.token.claimAirdrop(request);
    }

    /**
     * @override
     * @internal
     * @returns {HieroProto.proto.ITokenClaimAirdropTransactionBody}
     */
    _makeTransactionData() {
        return {
            pendingAirdrops: this.pendingAirdropIds.map((pendingAirdropId) =>
                pendingAirdropId.toBytes(),
            ),
        };
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TokenClaimAirdropTransaction}
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
            /** @type {HieroProto.proto.ITokenClaimAirdropTransactionBody} */ (
                body.tokenClaimAirdrop
            );

        return Transaction._fromProtobufTransactions(
            new TokenClaimAirdropTransaction({
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
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "tokenClaimAirdrop";
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TokenClaimAirdropTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "tokenClaimAirdrop",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TokenClaimAirdropTransaction._fromProtobuf,
);
