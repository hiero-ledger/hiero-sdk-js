import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import FileId from "../file/FileId.js";
import ContractId from "../contract/ContractId.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ISystemUndeleteTransactionBody} proto.ISystemUndeleteTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IContractID} proto.IContractID
 * @typedef {import("@exodus/hashgraph-proto").IFileID} proto.IFileID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

export default class SystemUndeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {FileId | string} [props.fileId]
     * @param {ContractId | string} [props.contractId]
     * @param {Timestamp} [props.expirationTime]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?FileId}
         */
        this._fileId = null;

        /**
         * @private
         * @type {?ContractId}
         */
        this._contractId = null;

        if (props.fileId != null) {
            this.setFileId(props.fileId);
        }

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {SystemUndeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const systemUndelete =
            /** @type {proto.ISystemUndeleteTransactionBody} */ (
                body.systemUndelete
            );

        return Transaction._fromProtobufTransactions(
            new SystemUndeleteTransaction({
                fileId:
                    systemUndelete.fileID != null
                        ? FileId._fromProtobuf(
                              /** @type {proto.IFileID} */ (
                                  systemUndelete.fileID
                              )
                          )
                        : undefined,
                contractId:
                    systemUndelete.contractID != null
                        ? ContractId._fromProtobuf(
                              /** @type {proto.IContractID} */ (
                                  systemUndelete.contractID
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
     * @returns {?FileId}
     */
    get fileId() {
        return this._fileId;
    }

    /**
     * @param {FileId | string} fileId
     * @returns {this}
     */
    setFileId(fileId) {
        this._requireNotFrozen();
        this._fileId =
            fileId instanceof FileId ? fileId : FileId.fromString(fileId);

        return this;
    }

    /**
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * @param {ContractId | string} contractId
     * @returns {this}
     */
    setContractId(contractId) {
        this._requireNotFrozen();
        this._contractId =
            contractId instanceof ContractId
                ? contractId
                : ContractId.fromString(contractId);

        return this;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {proto.ITransaction} request
     * @returns {Promise<proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        if (this._fileId != null) {
            return channel.file.systemUndelete(request);
        } else {
            return channel.smartContract.systemUndelete(request);
        }
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "systemUndelete";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ISystemUndeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            fileID: this._fileId != null ? this._fileId._toProtobuf() : null,
            contractID:
                this._contractId != null
                    ? this._contractId._toProtobuf()
                    : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "systemUndelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    SystemUndeleteTransaction._fromProtobuf
);
