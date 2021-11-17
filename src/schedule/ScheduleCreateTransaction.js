import AccountId from "../account/AccountId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
    SCHEDULE_CREATE_TRANSACTION,
} from "../transaction/Transaction.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IScheduleCreateTransactionBody} proto.IScheduleCreateTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 * @typedef {import("@exodus/hashgraph-proto").ISignatureMap} proto.ISignatureMap
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("@exodus/hashgraph-cryptography").PublicKey} PublicKey
 * @typedef {import("@exodus/hashgraph-cryptography").PrivateKey} PrivateKey
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Create a new Hedera™ crypto-currency account.
 */
export default class ScheduleCreateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Key} [props.adminKey]
     * @param {AccountId} [props.payerAccountID]
     * @param {string} [props.scheduleMemo]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = null;

        /**
         * @private
         * @type {?Transaction}
         */
        this._scheduledTransaction = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._payerAccountId = null;

        /**
         * @private
         * @type {?string}
         */
        this._scheduleMemo = null;

        /**
         * @private
         * @type {Set<string>}
         */
        this._scheduledSignerPublicKeys = new Set();

        if (props.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }

        if (props.payerAccountID != null) {
            this.setPayerAccountId(props.payerAccountID);
        }

        if (props.scheduleMemo != null) {
            this.setScheduleMemo(props.scheduleMemo);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {ScheduleCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const create = /** @type {proto.IScheduleCreateTransactionBody} */ (
            body.scheduleCreate
        );

        return Transaction._fromProtobufTransactions(
            new ScheduleCreateTransaction({
                adminKey:
                    create.adminKey != null
                        ? keyFromProtobuf(create.adminKey)
                        : undefined,
                payerAccountID:
                    create.payerAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (
                                  create.payerAccountID
                              )
                          )
                        : undefined,
                scheduleMemo: create.memo != null ? create.memo : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
        );
    }

    /**
     * @internal
     * @param {Transaction} tx
     * @returns {this}
     */
    _setScheduledTransaction(tx) {
        this._scheduledTransaction = tx;

        return this;
    }

    /**
     * @returns {?Key}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     * Set the key for this account.
     *
     * This is the key that must sign each transfer out of the account.
     *
     * If `receiverSignatureRequired` is true, then the key must also sign
     * any transfer into the account.
     *
     * @param {Key} key
     * @returns {this}
     */
    setAdminKey(key) {
        this._requireNotFrozen();
        this._adminKey = key;

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get payerAccountId() {
        return this._payerAccountId;
    }

    /**
     * @param {AccountId} account
     * @returns {this}
     */
    setPayerAccountId(account) {
        this._requireNotFrozen();
        this._payerAccountId = account;

        return this;
    }

    /**
     * @param {string} memo
     * @returns {this}
     */
    setScheduleMemo(memo) {
        this._requireNotFrozen();
        this._scheduleMemo = memo;

        return this;
    }

    /**
     * @returns {?string}
     */
    get getScheduleMemo() {
        this._requireNotFrozen();
        return this._scheduleMemo;
    }

    /**
     * @param {Transaction} transaction
     * @returns {this}
     */
    setScheduledTransaction(transaction) {
        this._requireNotFrozen();
        transaction._requireNotFrozen();

        this._scheduledTransaction =
            transaction.schedule()._scheduledTransaction;

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._payerAccountId != null) {
            this._payerAccountId.validateChecksum(client);
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
        return channel.schedule.createSchedule(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "scheduleCreate";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IScheduleCreateTransactionBody}
     */
    _makeTransactionData() {
        return {
            adminKey:
                this._adminKey != null ? keyToProtobuf(this._adminKey) : null,
            payerAccountID:
                this._payerAccountId != null
                    ? this._payerAccountId._toProtobuf()
                    : null,
            scheduledTransactionBody:
                this._scheduledTransaction != null
                    ? this._scheduledTransaction._getScheduledTransactionBody()
                    : null,
            memo: this._scheduleMemo,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "scheduleCreate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ScheduleCreateTransaction._fromProtobuf
);

SCHEDULE_CREATE_TRANSACTION.push(() => new ScheduleCreateTransaction());
