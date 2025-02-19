// SPDX-License-Identifier: Apache-2.0

import ScheduleId from "./ScheduleId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Hbar from "../Hbar.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HashgraphProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HashgraphProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HashgraphProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HashgraphProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HashgraphProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IScheduleDeleteTransactionBody} HashgraphProto.proto.IScheduleDeleteTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IScheduleID} HashgraphProto.proto.IScheduleID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("@hashgraph/cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Create a new Hedera™ crypto-currency account.
 */
export default class ScheduleDeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {ScheduleId | string} [props.scheduleId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?ScheduleId}
         */
        this._scheduleId = null;

        if (props.scheduleId != null) {
            this.setScheduleId(props.scheduleId);
        }

        this._defaultMaxTransactionFee = new Hbar(5);
    }

    /**
     * @internal
     * @param {HashgraphProto.proto.ITransaction[]} transactions
     * @param {HashgraphProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HashgraphProto.proto.ITransactionBody[]} bodies
     * @returns {ScheduleDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const scheduleDelete =
            /** @type {HashgraphProto.proto.IScheduleDeleteTransactionBody} */ (
                body.scheduleDelete
            );

        return Transaction._fromProtobufTransactions(
            new ScheduleDeleteTransaction({
                scheduleId:
                    scheduleDelete.scheduleID != null
                        ? ScheduleId._fromProtobuf(
                              /** @type {HashgraphProto.proto.IScheduleID} */ (
                                  scheduleDelete.scheduleID
                              ),
                          )
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
     * @returns {?ScheduleId}
     */
    get scheduleId() {
        return this._scheduleId;
    }

    /**
     * @param {ScheduleId | string} scheduleId
     * @returns {this}
     */
    setScheduleId(scheduleId) {
        this._requireNotFrozen();
        this._scheduleId =
            typeof scheduleId === "string"
                ? ScheduleId.fromString(scheduleId)
                : scheduleId.clone();

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._scheduleId != null) {
            this._scheduleId.validateChecksum(client);
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
        return channel.schedule.deleteSchedule(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HashgraphProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "scheduleDelete";
    }

    /**
     * @override
     * @protected
     * @returns {HashgraphProto.proto.IScheduleDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            scheduleID:
                this._scheduleId != null
                    ? this._scheduleId._toProtobuf()
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
        return `ScheduleDeleteTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "scheduleDelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ScheduleDeleteTransaction._fromProtobuf,
);
