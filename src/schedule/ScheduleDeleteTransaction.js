import ScheduleId from "./ScheduleId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IScheduleDeleteTransactionBody} proto.IScheduleDeleteTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IScheduleID} proto.IScheduleID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
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
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {ScheduleDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const scheduleDelete =
            /** @type {proto.IScheduleDeleteTransactionBody} */ (
                body.scheduleDelete
            );

        return Transaction._fromProtobufTransactions(
            new ScheduleDeleteTransaction({
                scheduleId:
                    scheduleDelete.scheduleID != null
                        ? ScheduleId._fromProtobuf(
                              /** @type {proto.IScheduleID} */ (
                                  scheduleDelete.scheduleID
                              )
                          )
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
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.schedule.deleteSchedule(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "scheduleDelete";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IScheduleDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            scheduleID:
                this._scheduleId != null
                    ? this._scheduleId._toProtobuf()
                    : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "scheduleDelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ScheduleDeleteTransaction._fromProtobuf
);
