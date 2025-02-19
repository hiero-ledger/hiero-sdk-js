// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import TopicId from "./TopicId.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IConsensusDeleteTopicTransactionBody} HashgraphProto.proto.IConsensusDeleteTopicTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HashgraphProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HashgraphProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HashgraphProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HashgraphProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HashgraphProto.proto.ITransactionResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Delete a topic.
 *
 * No more transactions or queries on the topic will succeed.
 *
 * If an adminKey is set, this transaction must be signed by that key.
 * If there is no adminKey, this transaction will fail with Status#Unautorized.
 */
export default class TopicDeleteTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {TopicId | string} [props.topicId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?TopicId}
         */
        this._topicId = null;

        if (props.topicId != null) {
            this.setTopicId(props.topicId);
        }
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.ITransaction[]} transactions
     * @param {HashgraphProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HashgraphProto.proto.ITransactionBody[]} bodies
     * @returns {TopicDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const topicDelete =
            /** @type {HashgraphProto.proto.IConsensusDeleteTopicTransactionBody} */ (
                body.consensusDeleteTopic
            );

        return Transaction._fromProtobufTransactions(
            new TopicDeleteTransaction({
                topicId:
                    topicDelete.topicID != null
                        ? TopicId._fromProtobuf(topicDelete.topicID)
                        : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @returns {?TopicId}
     */
    get topicId() {
        return this._topicId;
    }

    /**
     * Set the topic ID which is being deleted in this transaction.
     *
     * @param {TopicId | string} topicId
     * @returns {TopicDeleteTransaction}
     */
    setTopicId(topicId) {
        this._requireNotFrozen();
        this._topicId =
            typeof topicId === "string"
                ? TopicId.fromString(topicId)
                : topicId.clone();

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._topicId != null) {
            this._topicId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HashgraphProto.proto.ITransaction} request
     * @returns {Promise<HashgraphProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.consensus.deleteTopic(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HashgraphProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "consensusDeleteTopic";
    }

    /**
     * @override
     * @protected
     * @returns {HashgraphProto.proto.IConsensusDeleteTopicTransactionBody}
     */
    _makeTransactionData() {
        return {
            topicID: this._topicId != null ? this._topicId._toProtobuf() : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TopicDeleteTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "consensusDeleteTopic",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TopicDeleteTransaction._fromProtobuf,
);
