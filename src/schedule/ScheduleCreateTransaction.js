// SPDX-License-Identifier: Apache-2.0

import Timestamp from "../Timestamp.js";
import AccountId from "../account/AccountId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
    SCHEDULE_CREATE_TRANSACTION,
} from "../transaction/Transaction.js";
import Key from "../Key.js";
import Hbar from "../Hbar.js";
import * as HieroProto from "@hashgraph/proto";

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../PublicKey.js").default} PublicKey
 * @typedef {import("../PrivateKey.js").default} PrivateKey
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
     * @param {Timestamp} [props.expirationTime]
     * @param {boolean} [props.waitForExpiry]
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

        /**
         * @private
         * @type {?Timestamp}
         */
        this._expirationTime = null;

        /**
         * @private
         * @type {?boolean}
         */
        this._waitForExpiry = null;

        if (props.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }

        if (props.payerAccountID != null) {
            this.setPayerAccountId(props.payerAccountID);
        }

        if (props.scheduleMemo != null) {
            this.setScheduleMemo(props.scheduleMemo);
        }

        this._defaultMaxTransactionFee = new Hbar(5);
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {ScheduleCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const create =
            /** @type {HieroProto.proto.IScheduleCreateTransactionBody} */ (
                body.scheduleCreate
            );

        const scheduledTransaction = new ScheduleCreateTransaction({
            adminKey:
                create.adminKey != null
                    ? Key._fromProtobufKey(create.adminKey)
                    : undefined,
            payerAccountID:
                create.payerAccountID != null
                    ? AccountId._fromProtobuf(
                          /** @type {HieroProto.proto.IAccountID} */ (
                              create.payerAccountID
                          ),
                      )
                    : undefined,
            scheduleMemo: create.memo != null ? create.memo : undefined,
            waitForExpiry:
                create.waitForExpiry != null ? create.waitForExpiry : undefined,
            expirationTime:
                create.expirationTime != null
                    ? Timestamp._fromProtobuf(create.expirationTime)
                    : undefined,
        });
        if (body.scheduleCreate != null) {
            const scheduleCreateBody =
                body.scheduleCreate.scheduledTransactionBody;

            const scheduleCreateBodyBytes =
                HieroProto.proto.TransactionBody.encode(
                    // @ts-ignore
                    scheduleCreateBody,
                ).finish();

            const signedScheduledCreateTransaction =
                HieroProto.proto.SignedTransaction.encode({
                    bodyBytes: scheduleCreateBodyBytes,
                }).finish();

            const scheduleCreatetransaction = {
                signedTransactionBytes: signedScheduledCreateTransaction,
            };

            const txlist = HieroProto.proto.TransactionList.encode({
                transactionList: [scheduleCreatetransaction],
            }).finish();

            const finalScheduledDecodedTx = Transaction.fromBytes(txlist);

            scheduledTransaction._setScheduledTransaction(
                finalScheduledDecodedTx,
            );
        }

        return Transaction._fromProtobufTransactions(
            scheduledTransaction,
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
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
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.schedule.createSchedule(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "scheduleCreate";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IScheduleCreateTransactionBody}
     */
    _makeTransactionData() {
        return {
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            payerAccountID:
                this._payerAccountId != null
                    ? this._payerAccountId._toProtobuf()
                    : null,
            scheduledTransactionBody:
                this._scheduledTransaction != null
                    ? this._scheduledTransaction._getScheduledTransactionBody()
                    : null,
            memo: this._scheduleMemo,
            waitForExpiry: this._waitForExpiry,
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
        return `ScheduleCreateTransaction:${timestamp.toString()}`;
    }

    /**
     * @param {?Timestamp} expirationTime
     * @returns {this}
     */
    setExpirationTime(expirationTime) {
        this._expirationTime = expirationTime;
        return this;
    }

    /**
     * @returns {?Timestamp}
     */
    get expirationTime() {
        this._requireNotFrozen();
        return this._expirationTime;
    }

    /**
     * @param {boolean} waitForExpiry
     * @returns {this}
     */
    setWaitForExpiry(waitForExpiry) {
        this._waitForExpiry = waitForExpiry;

        return this;
    }

    /**
     * @returns {?boolean}
     */
    get waitForExpiry() {
        this._requireNotFrozen();
        return this._waitForExpiry;
    }
}

TRANSACTION_REGISTRY.set(
    "scheduleCreate",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ScheduleCreateTransaction._fromProtobuf,
);

SCHEDULE_CREATE_TRANSACTION.push(() => new ScheduleCreateTransaction());
