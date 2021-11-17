import Hbar from "../Hbar.js";
import AccountId from "./AccountId.js";
import Transaction, {
    DEFAULT_AUTO_RENEW_PERIOD,
    DEFAULT_RECORD_THRESHOLD,
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import { keyFromProtobuf, keyToProtobuf } from "../cryptography/protobuf.js";
import Duration from "../Duration.js";
import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ICryptoCreateTransactionBody} proto.ICryptoCreateTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 */

/**
 * @typedef {import("bignumber.js").default} BigNumber
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Create a new Hedera™ crypto-currency account.
 */
export default class AccountCreateTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Key} [props.key]
     * @param {number | string | Long | BigNumber | Hbar} [props.initialBalance]
     * @param {boolean} [props.receiverSignatureRequired]
     * @param {AccountId} [props.proxyAccountId]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {string} [props.accountMemo]
     * @param {Long | number} [props.maxAutomaticTokenAssociations]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Key}
         */
        this._key = null;

        /**
         * @private
         * @type {?Hbar}
         */
        this._initialBalance = null;

        /**
         * @private
         * @type {Hbar}
         */
        this._sendRecordThreshold = DEFAULT_RECORD_THRESHOLD;

        /**
         * @private
         * @type {Hbar}
         */
        this._receiveRecordThreshold = DEFAULT_RECORD_THRESHOLD;

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
         * @type {Duration}
         */
        this._autoRenewPeriod = new Duration(DEFAULT_AUTO_RENEW_PERIOD);

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

        if (props.key != null) {
            this.setKey(props.key);
        }

        if (props.receiverSignatureRequired != null) {
            this.setReceiverSignatureRequired(props.receiverSignatureRequired);
        }

        if (props.initialBalance != null) {
            this.setInitialBalance(props.initialBalance);
        }

        if (props.proxyAccountId != null) {
            this.setProxyAccountId(props.proxyAccountId);
        }

        if (props.autoRenewPeriod != null) {
            this.setAutoRenewPeriod(props.autoRenewPeriod);
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
     * @returns {AccountCreateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const create = /** @type {proto.ICryptoCreateTransactionBody} */ (
            body.cryptoCreateAccount
        );

        return Transaction._fromProtobufTransactions(
            new AccountCreateTransaction({
                key:
                    create.key != null
                        ? keyFromProtobuf(create.key)
                        : undefined,
                initialBalance:
                    create.initialBalance != null
                        ? create.initialBalance
                        : undefined,
                receiverSignatureRequired:
                    create.receiverSigRequired != null
                        ? create.receiverSigRequired
                        : undefined,
                proxyAccountId:
                    create.proxyAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (
                                  create.proxyAccountID
                              )
                          )
                        : undefined,
                autoRenewPeriod:
                    create.autoRenewPeriod != null
                        ? create.autoRenewPeriod.seconds != null
                            ? create.autoRenewPeriod.seconds
                            : undefined
                        : undefined,
                accountMemo: create.memo != null ? create.memo : undefined,
                maxAutomaticTokenAssociations:
                    create.maxAutomaticTokenAssociations != null
                        ? create.maxAutomaticTokenAssociations
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
     * @returns {?Key}
     */
    get key() {
        return this._key;
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
    setKey(key) {
        this._requireNotFrozen();
        this._key = key;

        return this;
    }

    /**
     * @returns {?Hbar}
     */
    get initialBalance() {
        return this._initialBalance;
    }

    /**
     * Set the initial amount to transfer into this account.
     *
     * @param {number | string | Long | BigNumber | Hbar} initialBalance
     * @returns {this}
     */
    setInitialBalance(initialBalance) {
        this._requireNotFrozen();
        this._initialBalance =
            initialBalance instanceof Hbar
                ? initialBalance
                : new Hbar(initialBalance);

        return this;
    }

    /**
     * @returns {boolean}
     */
    get receiverSignatureRequired() {
        return this._receiverSignatureRequired;
    }

    /**
     * Set to true to require the key for this account to sign any transfer of
     * hbars to this account.
     *
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
     * Set the ID of the account to which this account is proxy staked.
     *
     * @param {AccountId} proxyAccountId
     * @returns {this}
     */
    setProxyAccountId(proxyAccountId) {
        this._requireNotFrozen();
        this._proxyAccountId = proxyAccountId;

        return this;
    }

    /**
     * @returns {Duration}
     */
    get autoRenewPeriod() {
        return this._autoRenewPeriod;
    }

    /**
     * Set the auto renew period for this account.
     *
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
        return channel.crypto.createAccount(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoCreateAccount";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ICryptoCreateTransactionBody}
     */
    _makeTransactionData() {
        return {
            key: this._key != null ? keyToProtobuf(this._key) : null,
            initialBalance:
                this._initialBalance != null
                    ? this._initialBalance.toTinybars()
                    : null,
            autoRenewPeriod: this._autoRenewPeriod._toProtobuf(),
            proxyAccountID:
                this._proxyAccountId != null
                    ? this._proxyAccountId._toProtobuf()
                    : null,
            receiveRecordThreshold: this._receiveRecordThreshold.toTinybars(),
            sendRecordThreshold: this._sendRecordThreshold.toTinybars(),
            receiverSigRequired: this._receiverSignatureRequired,
            memo: this._accountMemo,
            maxAutomaticTokenAssociations:
                this._maxAutomaticTokenAssociations != null
                    ? this._maxAutomaticTokenAssociations.toInt()
                    : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoCreateAccount",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountCreateTransaction._fromProtobuf
);
