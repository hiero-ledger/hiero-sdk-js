import Transaction, {
    TRANSACTION_REGISTRY,
    CHUNK_SIZE,
} from "../transaction/Transaction.js";
import TopicId from "./TopicId.js";
import * as utf8 from "../encoding/utf8.js";
import TransactionId from "../transaction/TransactionId.js";
import Timestamp from "../Timestamp.js";
import * as util from "../util.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IConsensusSubmitMessageTransactionBody} proto.IConsensusSubmitMessageTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IConsensusMessageChunkInfo} proto.IConsensusMessageChunkInfo
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("../schedule/ScheduleCreateTransaction.js").default} ScheduleCreateTransaction
 */

export default class TopicMessageSubmitTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {TopicId | string} [props.topicId]
     * @param {Uint8Array | string} [props.message]
     * @param {number} [props.maxChunks]
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

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._message = null;

        if (props.message != null) {
            this.setMessage(props.message);
        }

        /**
         * @private
         * @type {number}
         */
        this._maxChunks = 20;

        if (props.maxChunks != null) {
            this.setMaxChunks(props.maxChunks);
        }

        /** @type {proto.IConsensusMessageChunkInfo | null} */
        this._chunkInfo = null;
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {TopicMessageSubmitTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const message =
            /** @type {proto.IConsensusSubmitMessageTransactionBody} */ (
                body.consensusSubmitMessage
            );

        return Transaction._fromProtobufTransactions(
            new TopicMessageSubmitTransaction({
                topicId:
                    message.topicID != null
                        ? TopicId._fromProtobuf(message.topicID)
                        : undefined,
                message: message.message != null ? message.message : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @param {TransactionId} transactionId
     * @returns {this}
     */
    setTransactionId(transactionId) {
        this._requireNotFrozen();

        if (
            transactionId.accountId == null ||
            transactionId.validStart == null
        ) {
            throw new Error(
                "`TopicMessageSubmitTransaction` does not support `TransactionId` built from `nonce`"
            );
        }

        this._transactionIds = [transactionId];

        return this;
    }

    /**
     * @returns {?TopicId}
     */
    get topicId() {
        return this._topicId;
    }

    /**
     * @param {TopicId | string} topicId
     * @returns {this}
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
     * @returns {?Uint8Array}
     */
    get message() {
        return this._message;
    }

    /**
     * @param {string | Uint8Array} message
     * @returns {this}
     */
    setMessage(message) {
        this._requireNotFrozen();
        message = util.requireStringOrUint8Array(message);
        this._message =
            typeof message === "string" ? utf8.encode(message) : message;
        return this;
    }

    /**
     * @returns {?number}
     */
    get maxChunks() {
        return this._maxChunks;
    }

    /**
     * @param {number} maxChunks
     * @returns {this}
     */
    setMaxChunks(maxChunks) {
        this._requireNotFrozen();
        this._maxChunks = maxChunks;
        return this;
    }

    /**
     * Freeze this transaction from further modification to prepare for
     * signing or serialization.
     *
     * Will use the `Client`, if available, to generate a default Transaction ID and select 1/3
     * nodes to prepare this transaction for.
     *
     * @param {?import("../client/Client.js").default<Channel, *>} client
     * @returns {this}
     */
    freezeWith(client) {
        super.freezeWith(client);

        if (this._message == null) {
            return this;
        }

        const chunks = Math.floor(
            (this._message.length + (CHUNK_SIZE - 1)) / CHUNK_SIZE
        );

        if (chunks > this._maxChunks) {
            throw new Error(
                `Message with size ${this._message.length} too long for ${this._maxChunks} chunks`
            );
        }

        const initialTransactionId = this.transactionId._toProtobuf();
        let nextTransactionId = this.transactionId;

        super._transactions = [];
        super._transactionIds = [];
        super._signedTransactions = [];
        super._nextTransactionIndex = 0;

        for (let chunk = 0; chunk < chunks; chunk++) {
            this._chunkInfo = {
                initialTransactionID: initialTransactionId,
                total: chunks,
                number: chunk + 1,
            };

            this._transactionIds.push(nextTransactionId);

            for (const nodeAccountId of this._nodeIds) {
                this._signedTransactions.push(
                    this._makeSignedTransaction(nodeAccountId)
                );
            }

            nextTransactionId = new TransactionId(
                /** @type {AccountId} */ (nextTransactionId.accountId),
                new Timestamp(
                    /** @type {Timestamp} */ (
                        nextTransactionId.validStart
                    ).seconds,
                    /** @type {Timestamp} */ (
                        nextTransactionId.validStart
                    ).nanos.add(1)
                )
            );

            super._nextTransactionIndex = this._nextTransactionIndex + 1;
        }

        this._chunkInfo = null;
        super._nextTransactionIndex = 0;

        return this;
    }

    /**
     * @returns {ScheduleCreateTransaction}
     */
    schedule() {
        this._requireNotFrozen();

        if (this._message != null && this._message.length > CHUNK_SIZE) {
            throw new Error(
                `cannot scheduled \`TopicMessageSubmitTransaction\` with message over ${CHUNK_SIZE} bytes`
            );
        }

        return super.schedule();
    }

    /**
     * @param {import("../client/Client.js").default<*, *>} client
     * @returns {Promise<TransactionResponse>}
     */
    async execute(client) {
        return (await this.executeAll(client))[0];
    }

    /**
     * @param {import("../client/Client.js").default<*, *>} client
     * @returns {Promise<TransactionResponse[]>}
     */
    async executeAll(client) {
        if (!super._isFrozen()) {
            this.freezeWith(client);
        }

        // on execute, sign each transaction with the operator, if present
        // and we are signing a transaction that used the default transaction ID

        const transactionId = this.transactionId;
        const operatorAccountId = client.operatorAccountId;

        if (
            operatorAccountId != null &&
            operatorAccountId.equals(
                /** @type {AccountId} */ (transactionId.accountId)
            )
        ) {
            await super.signWithOperator(client);
        }

        const responses = [];
        for (let i = 0; i < this._transactionIds.length; i++) {
            responses.push(await super.execute(client));
        }

        return responses;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.consensus.submitMessage(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "consensusSubmitMessage";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IConsensusSubmitMessageTransactionBody}
     */
    _makeTransactionData() {
        if (this._chunkInfo != null && this._message != null) {
            const num = /** @type {number} */ (this._chunkInfo.number);
            const startIndex = (num - 1) * CHUNK_SIZE;
            let endIndex = startIndex + CHUNK_SIZE;

            if (endIndex > this._message.length) {
                endIndex = this._message.length;
            }

            return {
                topicID:
                    this._topicId != null ? this._topicId._toProtobuf() : null,
                message: this._message.slice(startIndex, endIndex),
                chunkInfo: this._chunkInfo,
            };
        } else {
            return {
                topicID:
                    this._topicId != null ? this._topicId._toProtobuf() : null,
                message: this._message,
            };
        }
    }
}

TRANSACTION_REGISTRY.set(
    "consensusSubmitMessage",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TopicMessageSubmitTransaction._fromProtobuf
);
