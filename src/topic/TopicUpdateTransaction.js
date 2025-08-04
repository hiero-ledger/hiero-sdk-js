// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "../account/AccountId.js";
import TopicId from "./TopicId.js";
import Duration from "../Duration.js";
import Key from "../Key.js";
import Timestamp from "../Timestamp.js";
import CustomFixedFee from "../token/CustomFixedFee.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IConsensusUpdateTopicTransactionBody} HieroProto.proto.IConsensusUpdateTopicTransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 */

/**
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
     * @param {Key} [props.feeScheduleKey]
     * @param {Key[]} [props.feeExemptKeys]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {AccountId | string} [props.autoRenewAccountId]
     * @param {CustomFixedFee[]} [props.customFees]
     * @param {?string} [props.topicMemo]
     * @param {Timestamp | Date} [props.expirationTime]
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
         * @type {?Key}
         */
        this._feeScheduleKey = null;

        if (props.feeScheduleKey != null) {
            this.setFeeScheduleKey(props.feeScheduleKey);
        }

        /**
         * @private
         * @type {?Key[]}
         */
        this._feeExemptKeys = null;

        if (props.feeExemptKeys != null) {
            this.setFeeExemptKeys(props.feeExemptKeys);
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

        /**
         * @private
         * @type {?CustomFixedFee[]}
         */
        this._customFees = null;

        if (props.customFees != null) {
            this.setCustomFees(props.customFees);
        }

        /**
         * @private
         * @type {?Timestamp}
         */
        this._expirationTime = null;

        if (props.expirationTime != null) {
            this.setExpirationTime(props.expirationTime);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {TopicUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const update =
            /** @type {HieroProto.proto.IConsensusUpdateTopicTransactionBody} */ (
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
                        ? Key._fromProtobufKey(update.adminKey)
                        : undefined,
                submitKey:
                    update.submitKey != null
                        ? Key._fromProtobufKey(update.submitKey)
                        : undefined,
                feeScheduleKey:
                    update.feeScheduleKey != null
                        ? Key._fromProtobufKey(update.feeScheduleKey)
                        : undefined,
                feeExemptKeys:
                    update.feeExemptKeyList != null &&
                    update.feeExemptKeyList.keys != null
                        ? update?.feeExemptKeyList.keys.map((key) =>
                              Key._fromProtobufKey(key),
                          )
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
                customFees:
                    update.customFees != null && update.customFees.fees != null
                        ? update.customFees.fees.map((customFee) =>
                              CustomFixedFee._fromProtobuf(customFee),
                          )
                        : undefined,
                topicMemo:
                    update.memo != null
                        ? Object.hasOwn(update.memo, "value")
                            ? update.memo.value
                            : undefined
                        : undefined,
                expirationTime:
                    update.expirationTime != null
                        ? Timestamp._fromProtobuf(update.expirationTime)
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
     * @returns {?Timestamp}
     */
    get expirationTime() {
        return this._expirationTime;
    }

    /**
     * @param {Timestamp | Date | null} expirationTime
     * @returns {TopicUpdateTransaction}
     */
    setExpirationTime(expirationTime) {
        this._requireNotFrozen();

        this._expirationTime =
            expirationTime instanceof Date
                ? Timestamp.fromDate(expirationTime)
                : expirationTime;

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
     * Returns the key which allows updates to the new topic’s fees.
     * @returns {?Key}
     */
    getFeeScheduleKey() {
        return this._feeScheduleKey;
    }

    /**
     * Sets the key which allows updates to the new topic’s fees.
     * @param {Key} feeScheduleKey
     * @returns {this}
     */
    setFeeScheduleKey(feeScheduleKey) {
        this._requireNotFrozen();
        this._feeScheduleKey = feeScheduleKey;

        return this;
    }

    /**
     * @returns {TopicUpdateTransaction}
     */
    clearFeeScheduleKey() {
        this._requireNotFrozen();
        this._feeScheduleKey = null;

        return this;
    }

    /**
     * Returns the keys that will be exempt from paying fees.
     * @returns {?Key[]}
     */
    getFeeExemptKeys() {
        return this._feeExemptKeys;
    }

    /**
     * Sets the keys that will be exempt from paying fees.
     * @param {Key[]} feeExemptKeys
     * @returns {this}
     */
    setFeeExemptKeys(feeExemptKeys) {
        this._requireNotFrozen();
        this._feeExemptKeys = feeExemptKeys;

        return this;
    }

    /**
     * Adds a key that will be exempt from paying fees.
     * @param {Key} key
     * @returns {this}
     */
    addFeeExemptKey(key) {
        this._requireNotFrozen();
        if (this._feeExemptKeys == null) {
            this._feeExemptKeys = [];
        }

        this._feeExemptKeys.push(key);

        return this;
    }

    /**
     * Clears all keys that will be exempt from paying fees, effectively removing them from the network state.
     * @returns {this}
     */
    clearFeeExemptKeys() {
        this._requireNotFrozen();
        this._feeExemptKeys = [];

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
     * Returns the fixed fees to assess when a message is submitted to the new topic.
     * @returns {?CustomFixedFee[]}
     */
    getCustomFees() {
        return this._customFees;
    }

    /**
     * Sets the fixed fees to assess when a message is submitted to the new topic.
     *
     * @param {CustomFixedFee[]} customFees
     * @returns {this}
     */
    setCustomFees(customFees) {
        this._requireNotFrozen();
        this._customFees = customFees;

        return this;
    }

    /**
     * Adds fixed fee to assess when a message is submitted to the new topic.
     *
     * @param {CustomFixedFee} customFee
     * @returns {this}
     */
    addCustomFee(customFee) {
        this._requireNotFrozen();
        if (this._customFees == null) {
            this._customFees = [];
        }

        this._customFees.push(customFee);

        return this;
    }

    /**
     * Clears fixed fees, effectively removing them from the network state.
     *
     * @returns {this}
     */
    clearCustomFees() {
        this._requireNotFrozen();
        this._customFees = [];

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
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.consensus.updateTopic(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "consensusUpdateTopic";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IConsensusUpdateTopicTransactionBody}
     */
    _makeTransactionData() {
        return {
            topicID: this._topicId != null ? this._topicId._toProtobuf() : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            submitKey:
                this._submitKey != null
                    ? this._submitKey._toProtobufKey()
                    : null,
            feeScheduleKey:
                this._feeScheduleKey != null
                    ? this._feeScheduleKey._toProtobufKey()
                    : null,
            feeExemptKeyList:
                this._feeExemptKeys != null
                    ? {
                          keys: this._feeExemptKeys.map((key) =>
                              key._toProtobufKey(),
                          ),
                      }
                    : null,
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
            customFees:
                this._customFees != null
                    ? {
                          fees: this._customFees.map((customFee) =>
                              customFee._toTopicFeeProtobuf(),
                          ),
                      }
                    : null,
            expirationTime:
                this._expirationTime != null
                    ? this._expirationTime._toProtobuf()
                    : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `TopicUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "consensusUpdateTopic",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    TopicUpdateTransaction._fromProtobuf,
);
