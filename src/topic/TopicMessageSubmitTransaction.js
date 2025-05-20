// SPDX-License-Identifier: Apache-2.0

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
 * @typedef {import("@hashgraph/proto").proto.IConsensusSubmitMessageTransactionBody} HieroProto.proto.IConsensusSubmitMessageTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IConsensusMessageChunkInfo} HieroProto.proto.IConsensusMessageChunkInfo
 * @typedef {import("@hashgraph/proto").proto.IFixedFee} HieroProto.proto.IFixedFee
 * @typedef {import("@hashgraph/proto").proto.ICustomFeeLimit} HieroProto.proto.ICustomFeeLimit
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../token/CustomFixedFee.js").default} CustomFixedFee
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionResponse.js").default} TransactionResponse
 * @typedef {import("../schedule/ScheduleCreateTransaction.js").default} ScheduleCreateTransaction
 * @typedef {import("../transaction/CustomFeeLimit.js").default} CustomFeeLimit
 */

/**
 * <p>
 * Valid and authorized messages on valid topics will be ordered by the
 * consensus service, published in the block stream, and available to all
 * subscribers on this topic via the mirror nodes.<br/>
 * If this transaction succeeds the resulting TransactionReceipt SHALL
 * contain the latest topicSequenceNumber and topicRunningHash for the
 * topic.<br/>
 * If the topic has a `submitKey` then that key MUST sign this
 * transaction.<br/>
 */
export default class TopicMessageSubmitTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {TopicId | string} [props.topicId]
     * @param {Uint8Array | string} [props.message]
     * @param {number} [props.maxChunks]
     * @param {number} [props.chunkSize]
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
         * The maximum number of chunks a topic message can be split into.
         * Default max chunk size: 20
         * This value can be overridden with `setMaxChunks`
         */
        this._maxChunks = 20;

        /**
         * @private
         * @type {number}
         * The size of each chunk for a given topic message in bytes.
         */
        this._chunkSize = CHUNK_SIZE;

        if (props.maxChunks != null) {
            this.setMaxChunks(props.maxChunks);
        }

        if (props.chunkSize != null) {
            this.setChunkSize(props.chunkSize);
        }

        /** @type {HieroProto.proto.IConsensusMessageChunkInfo | null} */
        this._chunkInfo = null;
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TopicMessageSubmitTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const message =
            /** @type {HieroProto.proto.IConsensusSubmitMessageTransactionBody} */ (
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
     * @deprecated  - Use `getMessage()` instead
     * @returns {?Uint8Array}
     */
    get message() {
        return this._message;
    }

    /**
     * @returns {?Uint8Array}
     */
    getMessage() {
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
            message instanceof Uint8Array ? message : utf8.encode(message);
        return this;
    }

    /**
     * Gets the maximum custom fee that the user is willing to pay for the message.
     * @returns {CustomFeeLimit[]}
     */
    getCustomFeeLimits() {
        return this._customFeeLimits;
    }

    /**
     * Sets the maximum custom fee that the user is willing to pay for message submission.
     * @param {CustomFeeLimit[]} customFeeLimits
     * @returns {this}
     */
    setCustomFeeLimits(customFeeLimits) {
        this._requireNotFrozen();

        this._customFeeLimits = customFeeLimits;

        return this;
    }

    /**
     * Adds a maximum custom fee that the user is willing to pay for message submission.
     * @param {CustomFeeLimit} customFeeLimit
     * @returns {this}
     */
    addCustomFeeLimit(customFeeLimit) {
        this._requireNotFrozen();

        this._customFeeLimits.push(customFeeLimit);

        return this;
    }

    /**
     * @deprecated  - Use `getMaxChunks()` instead
     * @returns {?number}
     */
    get maxChunks() {
        return this._maxChunks;
    }

    /**
     * @returns {?number}
     */
    getMaxChunks() {
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
     * @deprecated  - Use `getChunkSize()` instead
     * @returns {?number}
     */
    get chunkSize() {
        return this._chunkSize;
    }

    /**
     * @returns {?number}
     */
    getChunkSize() {
        return this._chunkSize;
    }

    /**
     * @param {number} chunkSize
     * @returns {this}
     */
    setChunkSize(chunkSize) {
        this._chunkSize = chunkSize;
        return this;
    }

    /**
     * @override
     * @returns {number}
     */
    getRequiredChunks() {
        if (this._message == null) {
            return 1;
        }

        const result = Math.ceil(this._message.length / this._chunkSize);
        return result;
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
            (this._message.length + (this._chunkSize - 1)) / this._chunkSize,
        );

        if (chunks > this._maxChunks) {
            throw new Error(
                `Message with size ${this._message.length} too long for ${this._maxChunks} chunks`,
            );
        }

        const initialTransactionId = this._getTransactionId()._toProtobuf();
        let nextTransactionId = this._getTransactionId();

        // Hack around the locked list. Should refactor a bit to remove such code
        this._transactionIds.locked = false;

        this._transactions.clear();
        this._transactionIds.clear();
        this._signedTransactions.clear();

        for (let chunk = 0; chunk < chunks; chunk++) {
            this._chunkInfo = {
                initialTransactionID: initialTransactionId,
                total: chunks,
                number: chunk + 1,
            };

            this._transactionIds.push(nextTransactionId);
            this._transactionIds.advance();

            for (const nodeAccountId of this._nodeAccountIds.list) {
                this._signedTransactions.push(
                    this._makeSignedTransaction(nodeAccountId),
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
                    ).nanos.add(1),
                ),
            );
        }

        this._transactionIds.advance();
        this._chunkInfo = null;

        return this;
    }

    /**
     * @returns {ScheduleCreateTransaction}
     */
    schedule() {
        this._requireNotFrozen();

        if (this._message != null && this._message.length > this._chunkSize) {
            throw new Error(
                `cannot schedule \`TopicMessageSubmitTransaction\` with message over ${this._chunkSize} bytes`,
            );
        }

        return super.schedule();
    }

    /**
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @param {number=} requestTimeout
     * @returns {Promise<TransactionResponse>}
     */
    async execute(client, requestTimeout) {
        return (await this.executeAll(client, requestTimeout))[0];
    }

    /**
     * @param {import("../client/Client.js").default<Channel, *>} client
     * @param {number=} requestTimeout
     * @returns {Promise<TransactionResponse[]>}
     */
    async executeAll(client, requestTimeout) {
        if (!super._isFrozen()) {
            this.freezeWith(client);
        }

        // on execute, sign each transaction with the operator, if present
        // and we are signing a transaction that used the default transaction ID

        const transactionId = this._getTransactionId();
        const operatorAccountId = client.operatorAccountId;

        if (
            operatorAccountId != null &&
            operatorAccountId.equals(
                /** @type {AccountId} */ (transactionId.accountId),
            )
        ) {
            await super.signWithOperator(client);
        }

        const responses = [];
        let remainingTimeout = requestTimeout;
        for (let i = 0; i < this._transactionIds.length; i++) {
            const startTimestamp = Date.now();
            responses.push(await super.execute(client, remainingTimeout));

            if (remainingTimeout != null) {
                remainingTimeout = Date.now() - startTimestamp;
            }
        }

        return responses;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.consensus.submitMessage(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "consensusSubmitMessage";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IConsensusSubmitMessageTransactionBody}
     */
    _makeTransactionData() {
        if (this._chunkInfo != null && this._message != null) {
            const num = /** @type {number} */ (this._chunkInfo.number);
            const startIndex = (num - 1) * this._chunkSize;
            let endIndex = startIndex + this._chunkSize;

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

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TopicMessageSubmitTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "consensusSubmitMessage",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TopicMessageSubmitTransaction._fromProtobuf,
);
