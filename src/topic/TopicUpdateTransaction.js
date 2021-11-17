import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import AccountId from "../account/AccountId.js";
import TopicId from "./TopicId.js";
import Duration from "../Duration.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").IConsensusUpdateTopicTransactionBody} proto.IConsensusUpdateTopicTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Update a topic.
 *
 * If there is no adminKey, the only authorized update (available to anyone) is to extend the expirationTime.
 * Otherwise transaction must be signed by the adminKey.
 *
 * If an adminKey is updated, the transaction must be signed by the pre-update adminKey and post-update adminKey.
 *
 * If a new autoRenewAccount is specified (not just being removed), that account must also sign the transaction.
 */
export default class TopicUpdateTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {TopicId | string} [props.topicId]
     * @param {Key} [props.adminKey]
     * @param {Key} [props.submitKey]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {AccountId | string} [props.autoRenewAccountId]
     * @param {string} [props.topicMemo]
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
         * @type {?string}
         */
        this._topicMemo = null;

        if (props.topicMemo != null) {
            this.setTopicMemo(props.topicMemo);
        }

        /**
         * @private
         * @type {?Key}
         */
        this._submitKey = null;

        if (props.submitKey != null) {
            this.setSubmitKey(props.submitKey);
        }

        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = null;

        if (props.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }

        /**
         * @private
         * @type {?AccountId}
         */
        this._autoRenewAccountId = null;

        if (props.autoRenewAccountId != null) {
            this.setAutoRenewAccountId(props.autoRenewAccountId);
        }

        /**
         * @private
         * @type {?Duration}
         */
        this._autoRenewPeriod = null;

        if (props.autoRenewPeriod != null) {
            this.setAutoRenewPeriod(props.autoRenewPeriod);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {TopicUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const update =
            /** @type {proto.IConsensusUpdateTopicTransactionBody} */ (
                body.consensusUpdateTopic
            );

        return Transaction._fromProtobufTransactions(
            new TopicUpdateTransaction({
                topicId:
                    update.topicID != null
                        ? TopicId._fromProtobuf(update.topicID)
                        : undefined,
                adminKey:
                    update.adminKey != null
                        ? keyFromProtobuf(update.adminKey)
                        : undefined,
                submitKey:
                    update.submitKey != null
                        ? keyFromProtobuf(update.submitKey)
                        : undefined,
                autoRenewAccountId:
                    update.autoRenewAccount != null
                        ? AccountId._fromProtobuf(update.autoRenewAccount)
                        : undefined,
                autoRenewPeriod:
                    update.autoRenewPeriod != null
                        ? update.autoRenewPeriod.seconds != null
                            ? update.autoRenewPeriod.seconds
                            : undefined
                        : undefined,
                topicMemo:
                    update.memo != null
                        ? update.memo.value != null
                            ? update.memo.value
                            : undefined
                        : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
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
     * @returns {TopicUpdateTransaction}
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
     * @returns {TopicUpdateTransaction}
     */
    clearTopicId() {
        this._requireNotFrozen();
        this._topicId = null;

        return this;
    }

    /**
     * @returns {?string}
     */
    get topicMemo() {
        return this._topicMemo;
    }

    /**
     * @param {string} topicMemo
     * @returns {TopicUpdateTransaction}
     */
    setTopicMemo(topicMemo) {
        this._requireNotFrozen();
        this._topicMemo = topicMemo;

        return this;
    }

    /**
     * @returns {TopicUpdateTransaction}
     */
    clearTopicMemo() {
        this._requireNotFrozen();
        this._topicMemo = null;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     * @param {Key} adminKey
     * @returns {TopicUpdateTransaction}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();
        this._adminKey = adminKey;

        return this;
    }

    /**
     * @returns {TopicUpdateTransaction}
     */
    clearAdminKey() {
        this._requireNotFrozen();
        this._adminKey = null;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get submitKey() {
        return this._submitKey;
    }

    /**
     * @param {Key} submitKey
     * @returns {TopicUpdateTransaction}
     */
    setSubmitKey(submitKey) {
        this._requireNotFrozen();
        this._submitKey = submitKey;

        return this;
    }

    /**
     * @returns {TopicUpdateTransaction}
     */
    clearSubmitKey() {
        this._requireNotFrozen();
        this._submitKey = null;

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get autoRenewAccountId() {
        return this._autoRenewAccountId;
    }

    /**
     * @param {AccountId | string} autoRenewAccountId
     * @returns {TopicUpdateTransaction}
     */
    setAutoRenewAccountId(autoRenewAccountId) {
        this._requireNotFrozen();
        this._autoRenewAccountId =
            autoRenewAccountId instanceof AccountId
                ? autoRenewAccountId
                : AccountId.fromString(autoRenewAccountId);

        return this;
    }

    /**
     * @returns {TopicUpdateTransaction}
     */
    clearAutoRenewAccountId() {
        this._requireNotFrozen();
        this._autoRenewAccountId = null;

        return this;
    }

    /**
     * @returns {?Duration}
     */
    get autoRenewPeriod() {
        return this._autoRenewPeriod;
    }

    /**
     * Set the auto renew period for this account.
     *
     * @param {Duration | Long | number} autoRenewPeriod
     * @returns {TopicUpdateTransaction}
     */
    setAutoRenewPeriod(autoRenewPeriod) {
        this._requireNotFrozen();
        this._autoRenewPeriod =
            autoRenewPeriod instanceof Duration
                ? autoRenewPeriod
                : new Duration(autoRenewPeriod);

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._topicId != null) {
            this._topicId.validateChecksum(client);
        }

        if (this._autoRenewAccountId != null) {
            this._autoRenewAccountId.validateChecksum(client);
        }
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.consensus.updateTopic(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "consensusUpdateTopic";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IConsensusUpdateTopicTransactionBody}
     */
    _makeTransactionData() {
        return {
            topicID: this._topicId != null ? this._topicId._toProtobuf() : null,
            adminKey:
                this._adminKey != null ? keyToProtobuf(this._adminKey) : null,
            submitKey:
                this._submitKey != null ? keyToProtobuf(this._submitKey) : null,
            memo:
                this._topicMemo != null
                    ? {
                          value: this._topicMemo,
                      }
                    : null,
            autoRenewAccount:
                this._autoRenewAccountId != null
                    ? this._autoRenewAccountId._toProtobuf()
                    : null,
            autoRenewPeriod:
                this._autoRenewPeriod != null
                    ? this._autoRenewPeriod._toProtobuf()
                    : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "consensusUpdateTopic",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TopicUpdateTransaction._fromProtobuf
);
