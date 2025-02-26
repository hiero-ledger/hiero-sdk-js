// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "./AccountId.js";
import Timestamp from "../Timestamp.js";
import Duration from "../Duration.js";
import Long from "long";
import Key from "../Key.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ICryptoUpdateTransactionBody} HieroProto.proto.ICryptoUpdateTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 */

/**
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
     * @param {?boolean} [props.receiverSignatureRequired]
     * @param {AccountId} [props.proxyAccountId]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {Timestamp | Date} [props.expirationTime]
     * @param {?string} [props.accountMemo]
     * @param {Long | number} [props.maxAutomaticTokenAssociations]
     * @param {Key} [props.aliasKey]
     * @param {AccountId | string} [props.stakedAccountId]
     * @param {Long | number} [props.stakedNodeId]
     * @param {?boolean} [props.declineStakingReward]
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
         * @type {?boolean}
         */
        this._receiverSignatureRequired = null;

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

        /**
         * @private
         * @type {?Key}
         */
        this._aliasKey = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._stakedAccountId = null;

        /**
         * @private
         * @type {?Long}
         */
        this._stakedNodeId = null;

        /**
         * @private
         * @type {?boolean}
         */
        this._declineStakingReward = null;

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
            // eslint-disable-next-line deprecation/deprecation
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
                props.maxAutomaticTokenAssociations,
            );
        }

        if (props.stakedAccountId != null) {
            this.setStakedAccountId(props.stakedAccountId);
        }

        if (props.stakedNodeId != null) {
            this.setStakedNodeId(props.stakedNodeId);
        }

        if (props.declineStakingReward != null) {
            this.setDeclineStakingReward(props.declineStakingReward);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {AccountUpdateTransaction}
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
            /** @type {HieroProto.proto.ICryptoUpdateTransactionBody} */ (
                body.cryptoUpdateAccount
            );

        return Transaction._fromProtobufTransactions(
            new AccountUpdateTransaction({
                accountId:
                    update.accountIDToUpdate != null
                        ? AccountId._fromProtobuf(
                              /** @type {HieroProto.proto.IAccountID} */ (
                                  update.accountIDToUpdate
                              ),
                          )
                        : undefined,
                key:
                    update.key != null
                        ? Key._fromProtobufKey(update.key)
                        : undefined,
                receiverSignatureRequired:
                    update.receiverSigRequiredWrapper != null
                        ? Object.hasOwn(
                              update.receiverSigRequiredWrapper,
                              "value",
                          )
                            ? update.receiverSigRequiredWrapper.value
                            : undefined
                        : undefined,
                proxyAccountId:
                    update.proxyAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {HieroProto.proto.IAccountID} */ (
                                  update.proxyAccountID
                              ),
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
                        ? Object.hasOwn(update.memo, "value")
                            ? update.memo.value
                            : undefined
                        : undefined,
                maxAutomaticTokenAssociations:
                    update.maxAutomaticTokenAssociations != null &&
                    update.maxAutomaticTokenAssociations.value != null &&
                    Object.hasOwn(update.maxAutomaticTokenAssociations, "value")
                        ? Long.fromNumber(
                              update.maxAutomaticTokenAssociations.value,
                          )
                        : undefined,
                stakedAccountId:
                    update.stakedAccountId != null
                        ? AccountId._fromProtobuf(update.stakedAccountId)
                        : undefined,
                stakedNodeId:
                    update.stakedNodeId != null
                        ? update.stakedNodeId
                        : undefined,
                declineStakingReward:
                    update.declineReward != null
                        ? Object.hasOwn(update.declineReward, "value")
                            ? update.declineReward.value
                            : undefined
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
     * @returns {?boolean}
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
     * @deprecated
     * @returns {?AccountId}
     */
    get proxyAccountId() {
        return this._proxyAccountId;
    }

    /**
     * @deprecated
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
     * @deprecated - no longer supported
     * @returns {?Key}
     */
    get aliasKey() {
        return null;
    }

    /**
     * @deprecated - no longer supported
     * @param {Key} _
     * @returns {this}
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setAliasKey(_) {
        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get stakedAccountId() {
        return this._stakedAccountId;
    }

    /**
     * @param {AccountId | string} stakedAccountId
     * @returns {this}
     */
    setStakedAccountId(stakedAccountId) {
        this._requireNotFrozen();
        this._stakedAccountId =
            typeof stakedAccountId === "string"
                ? AccountId.fromString(stakedAccountId)
                : stakedAccountId;

        return this;
    }

    /**
     * @returns {this}
     */
    clearStakedAccountId() {
        this._requireNotFrozen();
        this._stakedAccountId = new AccountId(0, 0, 0);

        return this;
    }

    /**
     * @returns {?Long}
     */
    get stakedNodeId() {
        return this._stakedNodeId;
    }

    /**
     * @param {Long | number} stakedNodeId
     * @returns {this}
     */
    setStakedNodeId(stakedNodeId) {
        this._requireNotFrozen();
        this._stakedNodeId = Long.fromValue(stakedNodeId);

        return this;
    }

    /**
     * @returns {this}
     */
    clearStakedNodeId() {
        this._requireNotFrozen();
        this._stakedNodeId = Long.fromNumber(-1);

        return this;
    }

    /**
     * @returns {?boolean}
     */
    get declineStakingRewards() {
        return this._declineStakingReward;
    }

    /**
     * @param {boolean} declineStakingReward
     * @returns {this}
     */
    setDeclineStakingReward(declineStakingReward) {
        this._requireNotFrozen();
        this._declineStakingReward = declineStakingReward;

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
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.crypto.updateAccount(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoUpdateAccount";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ICryptoUpdateTransactionBody}
     */
    _makeTransactionData() {
        return {
            accountIDToUpdate:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            key: this._key != null ? this._key._toProtobufKey() : null,
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
            stakedAccountId:
                this.stakedAccountId != null
                    ? this.stakedAccountId._toProtobuf()
                    : null,
            stakedNodeId: this.stakedNodeId,
            declineReward:
                this.declineStakingRewards != null
                    ? { value: this.declineStakingRewards }
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
        return `AccountUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoUpdateAccount",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountUpdateTransaction._fromProtobuf,
);
