import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import ContractId from "./ContractId.js";
import AccountId from "../account/AccountId.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").IContractDeleteTransactionBody} proto.IContractDeleteTransactionBody
 * @typedef {import("@exodus/hashgraph-proto").IContractID} proto.IContractID
 * @typedef {import("@exodus/hashgraph-proto").IAccountID} proto.IAccountID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

export default class ContractDeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {ContractId | string} [props.contractId]
     * @param {ContractId | string} [props.transferContractId]
     * @param {AccountId | string} [props.transferAccountId]
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
         * @type {?AccountId}
         */
        this._transferAccountId = null;

        /**
         * @private
         * @type {?ContractId}
         */
        this._transferContractId = null;

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }

        if (props.transferAccountId != null) {
            this.setTransferAccountId(props.transferAccountId);
        }

        if (props.transferContractId != null) {
            this.setTransferContractId(props.transferContractId);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {ContractDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const contractDelete =
            /** @type {proto.IContractDeleteTransactionBody} */ (
                body.contractDeleteInstance
            );

        return Transaction._fromProtobufTransactions(
            new ContractDeleteTransaction({
                contractId:
                    contractDelete.contractID != null
                        ? ContractId._fromProtobuf(
                              /** @type {proto.IContractID} */ (
                                  contractDelete.contractID
                              )
                          )
                        : undefined,
                transferAccountId:
                    contractDelete.transferAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {proto.IAccountID} */ (
                                  contractDelete.transferAccountID
                              )
                          )
                        : undefined,
                transferContractId:
                    contractDelete.transferContractID != null
                        ? ContractId._fromProtobuf(
                              /** @type {proto.IContractID} */ (
                                  contractDelete.transferContractID
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
     * @returns {?ContractId}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     * Sets the contract ID which is being deleted in this transaction.
     *
     * @param {ContractId | string} contractId
     * @returns {ContractDeleteTransaction}
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
     * @returns {?ContractId}
     */
    get transferContractId() {
        return this._transferContractId;
    }

    /**
     * Sets the contract ID which will receive all remaining hbars.
     *
     * @param {ContractId | string} transferContractId
     * @returns {ContractDeleteTransaction}
     */
    setTransferContractId(transferContractId) {
        this._requireNotFrozen();
        this._transferContractId =
            transferContractId instanceof ContractId
                ? transferContractId
                : ContractId.fromString(transferContractId);

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get transferAccountId() {
        return this._transferAccountId;
    }

    /**
     * Sets the account ID which will receive all remaining hbars.
     *
     * @param {AccountId | string} transferAccountId
     * @returns {ContractDeleteTransaction}
     */
    setTransferAccountId(transferAccountId) {
        this._requireNotFrozen();
        this._transferAccountId =
            transferAccountId instanceof AccountId
                ? transferAccountId
                : AccountId.fromString(transferAccountId);

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._contractId != null) {
            this._contractId.validateChecksum(client);
        }

        if (this._transferAccountId != null) {
            this._transferAccountId.validateChecksum(client);
        }

        if (this._transferContractId != null) {
            this._transferContractId.validateChecksum(client);
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
        return channel.smartContract.deleteContract(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "contractDeleteInstance";
    }

    /**
     * @override
     * @protected
     * @returns {proto.IContractDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            contractID:
                this._contractId != null
                    ? this._contractId._toProtobuf()
                    : null,
            transferAccountID: this._transferAccountId
                ? this._transferAccountId._toProtobuf()
                : null,
            transferContractID:
                this._transferContractId != null
                    ? this._transferContractId._toProtobuf()
                    : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "contractDeleteInstance",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    ContractDeleteTransaction._fromProtobuf
);
