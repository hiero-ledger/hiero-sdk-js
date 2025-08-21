// SPDX-License-Identifier: Apache-2.0

import AccountId from "../account/AccountId.js";
import ContractId from "./ContractId.js";
import FileId from "../file/FileId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import Duration from "../Duration.js";
import Timestamp from "../Timestamp.js";
import Key from "../Key.js";
import Long from "long";
import * as Proto from "@hashgraph/proto";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.IContractUpdateTransactionBody} HieroProto.proto.IContractUpdateTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 * @typedef {import("@hashgraph/proto").proto.IContractID} HieroProto.proto.IContractID
 * @typedef {import("@hashgraph/proto").proto.IFileID} HieroProto.proto.IFileID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Modify a smart contract.<br/>
 * Any change other than updating the expiration time requires that the
 * contract be modifiable (has a valid `adminKey`) and that the
 * transaction be signed by the `adminKey`
 * <p>
 * Fields _not set_ on the request SHALL NOT be modified.
 */
export default class ContractUpdateTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {ContractId | string} [props.contractId]
     * @param {FileId | string} [props.bytecodeFileId]
     * @param {Timestamp | Date} [props.expirationTime]
     * @param {Key} [props.adminKey]
     * @param {AccountId | string} [props.proxyAccountId]
     * @param {Duration | Long | number} [props.autoRenewPeriod]
     * @param {string} [props.contractMemo]
     * @param {number} [props.maxAutomaticTokenAssociations]
     * @param {AccountId | string} [props.stakedAccountId]
     * @param {Long | number} [props.stakedNodeId]
     * @param {boolean} [props.declineStakingReward]
     * @param {AccountId} [props.autoRenewAccountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?ContractId}
         */
        this._contractId = null;

        /**
         * @private
         * @type {?Timestamp}
         */
        this._expirationTime = null;

        /**
         * @private
         * @type {?Key}
         */
        this._adminKey = null;

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
         * @type {?FileId}
         */
        this._bytecodeFileId = null;

        /**
         * @private
         * @type {?string}
         */
        this._contractMemo = null;

        /**
         * @private
         * @type {?number}
         */
        this._maxAutomaticTokenAssociations = null;

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

        /**
         * @type {?AccountId}
         */
        this._autoRenewAccountId = null;

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }

        if (props.expirationTime != null) {
            this.setExpirationTime(props.expirationTime);
        }

        if (props.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }

        if (props.proxyAccountId != null) {
            // eslint-disable-next-line deprecation/deprecation
            this.setProxyAccountId(props.proxyAccountId);
        }

        if (props.autoRenewPeriod != null) {
            this.setAutoRenewPeriod(props.autoRenewPeriod);
        }

        if (props.bytecodeFileId != null) {
            this.setBytecodeFileId(props.bytecodeFileId);
        }

        if (props.contractMemo != null) {
            this.setContractMemo(props.contractMemo);
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

        if (props.autoRenewAccountId != null) {
            this.setAutoRenewAccountId(props.autoRenewAccountId);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {ContractUpdateTransaction}
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
            /** @type {HieroProto.proto.IContractUpdateTransactionBody} */ (
                body.contractUpdateInstance
            );

        let autoRenewPeriod = undefined;
        if (
            update.autoRenewPeriod != null &&
            update.autoRenewPeriod.seconds != null
        ) {
            autoRenewPeriod = update.autoRenewPeriod.seconds;
        }

        let contractMemo = undefined;
        if (
            update.memoWrapper != null &&
            Object.hasOwn(update.memoWrapper, "value") &&
            update.memoWrapper.value != null
        ) {
            contractMemo = update.memoWrapper.value;
        }

        let maxAutomaticTokenAssociations = undefined;
        if (
            update.maxAutomaticTokenAssociations != null &&
            update.maxAutomaticTokenAssociations.value != null
        ) {
            maxAutomaticTokenAssociations =
                update.maxAutomaticTokenAssociations.value;
        }

        return Transaction._fromProtobufTransactions(
            new ContractUpdateTransaction({
                contractId:
                    update.contractID != null
                        ? ContractId._fromProtobuf(
                              /** @type {HieroProto.proto.IContractID} */ (
                                  update.contractID
                              ),
                          )
                        : undefined,
                bytecodeFileId:
                    update.fileID != null
                        ? FileId._fromProtobuf(
                              /** @type {HieroProto.proto.IFileID} */ (
                                  update.fileID
                              ),
                          )
                        : undefined,
                expirationTime:
                    update.expirationTime != null
                        ? Timestamp._fromProtobuf(update.expirationTime)
                        : undefined,
                adminKey:
                    update.adminKey != null
                        ? Key._fromProtobufKey(update.adminKey)
                        : undefined,
                proxyAccountId:
                    update.proxyAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {HieroProto.proto.IAccountID} */ (
                                  update.proxyAccountID
                              ),
                          )
                        : undefined,
                autoRenewPeriod,
                contractMemo,
                maxAutomaticTokenAssociations,
                stakedAccountId:
                    update.stakedAccountId != null
                        ? AccountId._fromProtobuf(update.stakedAccountId)
                        : undefined,
                stakedNodeId:
                    update.stakedNodeId != null
                        ? update.stakedNodeId
                        : undefined,
                declineStakingReward:
                    update.declineReward != null &&
                    Boolean(update.declineReward) == true,
                autoRenewAccountId:
                    update.autoRenewAccountId != null
                        ? AccountId._fromProtobuf(update.autoRenewAccountId)
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
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * Sets the contract ID which is being deleted in this transaction.
     *
     * @param {ContractId | string} contractId
     * @returns {ContractUpdateTransaction}
     */
    setContractId(contractId) {
        this._requireNotFrozen();
        this._contractId =
            typeof contractId === "string"
                ? ContractId.fromString(contractId)
                : contractId.clone();

        return this;
    }

    /**
     * @returns {?Timestamp}
     */
    get expirationTime() {
        return this._expirationTime;
    }

    /**
     * Sets the contract ID which is being deleted in this transaction.
     *
     * @param {Timestamp | Date} expirationTime
     * @returns {ContractUpdateTransaction}
     */
    setExpirationTime(expirationTime) {
        this._requireNotFrozen();
        this._expirationTime =
            expirationTime instanceof Timestamp
                ? expirationTime
                : Timestamp.fromDate(expirationTime);

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
     * @returns {this}
     */
    setAdminKey(adminKey) {
        this._requireNotFrozen();
        this._adminKey = adminKey;

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
     * @param {AccountId | string} proxyAccountId
     * @returns {this}
     */
    setProxyAccountId(proxyAccountId) {
        this._requireNotFrozen();
        this._proxyAccountId =
            typeof proxyAccountId === "string"
                ? AccountId.fromString(proxyAccountId)
                : proxyAccountId.clone();

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
     * @returns {?FileId}
     */
    get bytecodeFileId() {
        return this._bytecodeFileId;
    }

    /**
     * @param {FileId | string} bytecodeFileId
     * @returns {this}
     */
    setBytecodeFileId(bytecodeFileId) {
        console.warn("Deprecated: there is no replacement");
        this._requireNotFrozen();
        this._bytecodeFileId =
            typeof bytecodeFileId === "string"
                ? FileId.fromString(bytecodeFileId)
                : bytecodeFileId.clone();

        return this;
    }

    /**
     * @returns {?string}
     */
    get contractMemo() {
        return this._contractMemo;
    }

    /**
     * @param {string} contractMemo
     * @returns {this}
     */
    setContractMemo(contractMemo) {
        this._requireNotFrozen();
        this._contractMemo = contractMemo;

        return this;
    }

    /**
     * @returns {this}
     */
    clearContractMemo() {
        this._requireNotFrozen();
        this._contractMemo = null;

        return this;
    }

    /**
     * @returns {number | null}
     */
    get maxAutomaticTokenAssociations() {
        return this._maxAutomaticTokenAssociations;
    }

    /**
     * @param {number} maxAutomaticTokenAssociations
     * @returns {this}
     */
    setMaxAutomaticTokenAssociations(maxAutomaticTokenAssociations) {
        this._requireNotFrozen();
        this._maxAutomaticTokenAssociations = maxAutomaticTokenAssociations;

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
     * @returns {?AccountId}
     */
    get autoRenewAccountId() {
        return this._autoRenewAccountId;
    }

    /**
     * If set to the sentinel <tt>0.0.0</tt> AccountID, this field removes the contract's auto-renew
     * account. Otherwise it updates the contract's auto-renew account to the referenced account.
     *
     * @param {string | AccountId} autoRenewAccountId
     * @returns {this}
     */
    setAutoRenewAccountId(autoRenewAccountId) {
        this._requireNotFrozen();
        this._autoRenewAccountId =
            typeof autoRenewAccountId === "string"
                ? AccountId.fromString(autoRenewAccountId)
                : autoRenewAccountId;

        return this;
    }

    /**
     * @returns {this}
     */
    clearAutoRenewAccountId() {
        this._autoRenewAccountId = new AccountId(0);
        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._contractId != null) {
            this._contractId.validateChecksum(client);
        }

        if (this._bytecodeFileId != null) {
            this._bytecodeFileId.validateChecksum(client);
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
        return channel.smartContract.updateContract(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "contractUpdateInstance";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.IContractUpdateTransactionBody}
     */
    _makeTransactionData() {
        return {
            contractID:
                this._contractId != null
                    ? this._contractId._toProtobuf()
                    : null,
            expirationTime:
                this._expirationTime != null
                    ? this._expirationTime._toProtobuf()
                    : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
            proxyAccountID:
                this._proxyAccountId != null
                    ? this._proxyAccountId._toProtobuf()
                    : null,
            autoRenewPeriod:
                this._autoRenewPeriod != null
                    ? this._autoRenewPeriod._toProtobuf()
                    : null,
            fileID: this._bytecodeFileId
                ? this._bytecodeFileId._toProtobuf()
                : null,
            memoWrapper:
                this._contractMemo != null
                    ? {
                          value: this._contractMemo,
                      }
                    : null,
            maxAutomaticTokenAssociations:
                this._maxAutomaticTokenAssociations != null
                    ? {
                          value: this._maxAutomaticTokenAssociations,
                      }
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
            autoRenewAccountId:
                this._autoRenewAccountId != null
                    ? this._autoRenewAccountId.toString() == "0.0.0"
                        ? Proto.proto.AccountID.create()
                        : this._autoRenewAccountId._toProtobuf()
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
        return `ContractUpdateTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "contractUpdateInstance",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ContractUpdateTransaction._fromProtobuf,
);
