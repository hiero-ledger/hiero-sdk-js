import AccountId from "../account/AccountId.js";
import ContractId from "./ContractId.js";
import FileId from "../file/FileId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import { keyToProtobuf, keyFromProtobuf } from "../cryptography/protobuf.js";
import Duration from "../Duration.js";
import Timestamp from "../Timestamp.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IContractUpdateTransactionBody} proto.IContractUpdateTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 * @typedef {import("@exodus/hashgraph-proto").IContractID} proto.IContractID
 * @typedef {import("@exodus/hashgraph-proto").IFileID} proto.IFileID
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
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
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {ContractUpdateTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const update = /** @type {proto.IContractUpdateTransactionBody} */ (
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
        if (update.memoWrapper != null && update.memoWrapper.value != null) {
            contractMemo = update.memoWrapper.value;
        }

        return Transaction._fromProtobufTransactions(
            new ContractUpdateTransaction({
                contractId:
                    update.contractID != null
                        ? ContractId._fromProtobuf(
                              /** @type {proto.IContractID} */ (
                                  update.contractID
                              )
                          )
                        : undefined,
                bytecodeFileId:
                    update.fileID != null
                        ? FileId._fromProtobuf(
                              /** @type {proto.IFileID} */ (update.fileID)
                          )
                        : undefined,
                expirationTime:
                    update.expirationTime != null
                        ? Timestamp._fromProtobuf(update.expirationTime)
                        : undefined,
                adminKey:
                    update.adminKey != null
                        ? keyFromProtobuf(update.adminKey)
                        : undefined,
                proxyAccountId:
                    update.proxyAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (
                                  update.proxyAccountID
                              )
                          )
                        : undefined,
                autoRenewPeriod,
                contractMemo,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies
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
     * @returns {?AccountId}
     */
    get proxyAccountId() {
        return this._proxyAccountId;
    }

    /**
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
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.smartContract.updateContract(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "contractUpdateInstance";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IContractUpdateTransactionBody}
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
                this._adminKey != null ? keyToProtobuf(this._adminKey) : null,
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
        };
    }
}

TRANSACTION_REGISTRY.set(
    "contractUpdateInstance",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ContractUpdateTransaction._fromProtobuf
);
