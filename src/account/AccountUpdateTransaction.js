import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import AccountId from "./AccountId.js";
import Timestamp from "../Timestamp.js";
import Duration from "../Duration.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ICryptoUpdateTransactionBody} proto.ICryptoUpdateTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Change properties for the given account.
 */
export default class AccountUpdateTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {AccountId} [props.accountId]
     * @param {Key} [props.key]
     * @param {boolean} [props.receiverSignatureRequired]
     * @param {AccountId} [props.proxyAccountId]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {Timestamp | Date} [props.expirationTime]
     * @param {string} [props.accountMemo]
     * @param {Long | number} [props.maxAutomaticTokenAssociations]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?Key}
         */
        this._key = null;

        /**
         * @private
         * @type {boolean}
         */
        this._receiverSignatureRequired = false;

        /**
         * @private
         * @type {?AccountId}
         */
        this._proxyAccountId = null;

        /**
         * @private
         * @type {?Duration}
         */
        this._autoRenewPeriod = null;

        /**
         * @private
         * @type {?Timestamp}
         */
        this._expirationTime = null;

        /**
         * @private
         * @type {?string}
         */
        this._accountMemo = null;

        /**
         * @private
         * @type {?Long}
         */
        this._maxAutomaticTokenAssociations = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.key != null) {
            this.setKey(props.key);
        }

        if (props.receiverSignatureRequired != null) {
            this.setReceiverSignatureRequired(props.receiverSignatureRequired);
        }

        if (props.proxyAccountId != null) {
            this.setProxyAccountId(props.proxyAccountId);
        }

        if (props.autoRenewPeriod != null) {
            this.setAutoRenewPeriod(props.autoRenewPeriod);
        }

        if (props.expirationTime != null) {
            this.setExpirationTime(props.expirationTime);
        }

        if (props.accountMemo != null) {
            this.setAccountMemo(props.accountMemo);
        }

        if (props.maxAutomaticTokenAssociations != null) {
            this.setMaxAutomaticTokenAssociations(
                props.maxAutomaticTokenAssociations
            );
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {AccountUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const update = /** @type {proto.ICryptoUpdateTransactionBody} */ (
            body.cryptoUpdateAccount
        );

        return Transaction._fromProtobufTransactions(
            new AccountUpdateTransaction({
                accountId:
                    update.accountIDToUpdate != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (
                                  update.accountIDToUpdate
                              )
                          )
                        : undefined,
                key:
                    update.key != null
                        ? keyFromProtobuf(update.key)
                        : undefined,
                receiverSignatureRequired:
                    update.receiverSigRequired != null
                        ? update.receiverSigRequired
                        : undefined,
                proxyAccountId:
                    update.proxyAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (
                                  update.proxyAccountID
                              )
                          )
                        : undefined,
                autoRenewPeriod:
                    update.autoRenewPeriod != null
                        ? update.autoRenewPeriod.seconds != null
                            ? update.autoRenewPeriod.seconds
                            : undefined
                        : undefined,
                expirationTime:
                    update.expirationTime != null
                        ? Timestamp._fromProtobuf(update.expirationTime)
                        : undefined,
                accountMemo:
                    update.memo != null
                        ? update.memo.value != null
                            ? update.memo.value
                            : undefined
                        : undefined,
                maxAutomaticTokenAssociations:
                    update.maxAutomaticTokenAssociations != null &&
                    update.maxAutomaticTokenAssociations.value != null
                        ? Long.fromNumber(
                              update.maxAutomaticTokenAssociations.value
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
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Sets the account ID which is being updated in this transaction.
     *
     * @param {AccountId | string} accountId
     * @returns {AccountUpdateTransaction}
     */
    setAccountId(accountId) {
        this._requireNotFrozen();
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();

        return this;
    }

    /**
     * @returns {?Key}
     */
    get key() {
        return this._key;
    }

    /**
     * @param {Key} key
     * @returns {this}
     */
    setKey(key) {
        this._requireNotFrozen();
        this._key = key;

        return this;
    }

    /**
     * @returns {boolean}
     */
    get receiverSignatureRequired() {
        return this._receiverSignatureRequired;
    }

    /**
     * @param {boolean} receiverSignatureRequired
     * @returns {this}
     */
    setReceiverSignatureRequired(receiverSignatureRequired) {
        this._requireNotFrozen();
        this._receiverSignatureRequired = receiverSignatureRequired;

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get proxyAccountId() {
        return this._proxyAccountId;
    }

    /**
     * @param {AccountId} proxyAccountId
     * @returns {this}
     */
    setProxyAccountId(proxyAccountId) {
        this._requireNotFrozen();
        this._proxyAccountId = proxyAccountId;

        return this;
    }

    /**
     * @returns {?Duration}
     */
    get autoRenewPeriod() {
        return this._autoRenewPeriod;
    }

    /**
     * @param {Duration | Long | number} autoRenewPeriod
     * @returns {this}
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
     * @returns {?Timestamp}
     */
    get expirationTime() {
        return this._expirationTime;
    }

    /**
     * @param {Timestamp | Date} expirationTime
     * @returns {this}
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
     * @returns {?string}
     */
    get accountMemo() {
        return this._accountMemo;
    }

    /**
     * @param {string} memo
     * @returns {this}
     */
    setAccountMemo(memo) {
        this._requireNotFrozen();
        this._accountMemo = memo;

        return this;
    }

    /**
     * @returns {this}
     */
    clearAccountMemo() {
        this._requireNotFrozen();
        this._accountMemo = null;

        return this;
    }

    /**
     * @returns {?Long}
     */
    get maxAutomaticTokenAssociations() {
        return this._maxAutomaticTokenAssociations;
    }

    /**
     * @param {Long | number} maxAutomaticTokenAssociations
     * @returns {this}
     */
    setMaxAutomaticTokenAssociations(maxAutomaticTokenAssociations) {
        this._requireNotFrozen();
        this._maxAutomaticTokenAssociations =
            typeof maxAutomaticTokenAssociations === "number"
                ? Long.fromNumber(maxAutomaticTokenAssociations)
                : maxAutomaticTokenAssociations;

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
        }

        if (this._proxyAccountId != null) {
            this._proxyAccountId.validateChecksum(client);
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
        return channel.crypto.updateAccount(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoUpdateAccount";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ICryptoUpdateTransactionBody}
     */
    _makeTransactionData() {
        return {
            accountIDToUpdate:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            key: this._key != null ? keyToProtobuf(this._key) : null,
            expirationTime:
                this._expirationTime != null
                    ? this._expirationTime._toProtobuf()
                    : null,
            proxyAccountID:
                this._proxyAccountId != null
                    ? this._proxyAccountId._toProtobuf()
                    : null,
            autoRenewPeriod:
                this._autoRenewPeriod != null
                    ? this._autoRenewPeriod._toProtobuf()
                    : null,
            receiverSigRequiredWrapper:
                this._receiverSignatureRequired == null
                    ? null
                    : {
                          value: this._receiverSignatureRequired,
                      },
            memo:
                this._accountMemo != null
                    ? {
                          value: this._accountMemo,
                      }
                    : null,
            maxAutomaticTokenAssociations:
                this._maxAutomaticTokenAssociations != null
                    ? { value: this._maxAutomaticTokenAssociations.toInt() }
                    : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoUpdateAccount",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountUpdateTransaction._fromProtobuf
);
