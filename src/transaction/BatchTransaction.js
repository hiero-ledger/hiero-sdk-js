import FreezeTransaction from "../system/FreezeTransaction.js";
import Transaction, { TRANSACTION_REGISTRY } from "./Transaction.js";
import { proto } from "@hashgraph/proto";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../account/AccountId.js").default} AccountId
 * @typedef {import("../Key.js").default} Key
 */

/**
 * @description Execute multiple transactions in a single consensus event. This allows for atomic execution of multiple
 * transactions, where they either all succeed or all fail together.
 * <p>
 * Requirements:
 * <ul>
 *     <li>All inner transactions must be frozen before being added to the batch</li>
 *     <li>All inner transactions must have a batch key set</li>
 *     <li>All inner transactions must be signed as required for each individual transaction</li>
 *     <li>The BatchTransaction must be signed by all batch keys of the inner transactions</li>
 *     <li>Certain transaction types (FreezeTransaction, BatchTransaction) are not allowed in a batch</li>
 * </ul>
 * <p>
 * Important notes:
 * <ul>
 *     <li>Fees are assessed for each inner transaction separately</li>
 *     <li>The maximum number of inner transactions in a batch is limited to 25</li>
 *     <li>Inner transactions cannot be scheduled transactions</li>
 * </ul>
 *
 */
export default class BatchTransaction extends Transaction {
    /**
     * @param {object} [options]
     * @param {Transaction[] | null} [options.transactions]
     */
    constructor(options) {
        super();
        this._batchTransactions = options?.transactions || [];
    }

    /**
     * Set the list of transactions to be executed as part of this BatchTransaction.
     * <p>
     * Requirements for each inner transaction:
     * <ul>
     *     <li>Must be frozen (use {@link Transaction#freeze()} or {@link Transaction#freezeWith(Client)})</li>
     *     <li>Must have a batch key set (use {@link Transaction#setBatchKey(Key)}} or {@link Transaction#batchify(Client, Key)})</li>
     *     <li>Must not be a blacklisted transaction type</li>
     * </ul>
     * <p>
     * Note: This method creates a defensive copy of the provided list.
     *
     * @param {Transaction[]} txs
     * @returns {BatchTransaction}
     */
    setInnerTransactions(txs) {
        txs.forEach((tx) => this._validateTransaction(tx));
        this._batchTransactions = txs;
        return this;
    }

    /**
     * Append a transaction to the list of transactions this BatchTransaction will execute.
     * <p>
     * Requirements for the inner transaction:
     * <ul>
     *     <li>Must be frozen (use {@link Transaction#freeze()} or {@link Transaction#freezeWith(Client)})</li>
     *     <li>Must have a batch key set (use {@link Transaction#setBatchKey(Key)}} or {@link Transaction#batchify(Client, Key)})</li>
     *     <li>Must not be a blacklisted transaction type</li>
     * </ul>
     *
     * @param {Transaction} tx
     * @returns {BatchTransaction}
     */
    addInnerTransaction(tx) {
        this._validateTransaction(tx);
        this._requireNotFrozen();
        this._batchTransactions.push(tx);
        return this;
    }

    /**
     * Get the list of transactions this BatchTransaction is currently configured to execute.
     * <p>
     * Note: This returns the actual list of transactions. Modifications to this list will affect
     * the batch transaction if it is not frozen.
     *
     * @returns {Transaction[]}
     */
    get innerTransactions() {
        return this._batchTransactions;
    }

    /**
     * Get the list of transaction IDs of each inner transaction of this BatchTransaction.
     * <p>
     * This method is particularly useful after execution to:
     * <ul>
     *     <li>Track individual transaction results</li>
     *     <li>Query receipts for specific inner transactions</li>
     *     <li>Monitor the status of each transaction in the batch</li>
     * </ul>
     * <p>
     * <b>NOTE:</b> Transaction IDs will only be meaningful after the batch transaction has been
     * executed or the IDs have been explicitly set on the inner transactions.
     *
     * @returns {(TransactionId | null)[]}
     */
    get innerTransactionIds() {
        if (!Array.isArray(this._batchTransactions)) {
            return [];
        }

        return this._batchTransactions.map((tx) => tx.transactionId);
    }

    /**
     *
     * @returns {proto.AtomicBatchTransactionBody}
     */
    _makeTransactionData() {
        if (!Array.isArray(this._batchTransactions)) {
            return {
                transactions: [],
            };
        }

        const signedTransactionBytes = this._batchTransactions.map((tx) =>
            proto.SignedTransaction.encode(
                tx._signedTransactions.get(0),
            ).finish(),
        );
        return {
            transactions: signedTransactionBytes,
        };
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {BatchTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const atomicBatchTxBytes = body.atomicBatch?.transactions;

        const atomicBatchSignedTransactions = atomicBatchTxBytes?.map((tx) =>
            proto.SignedTransaction.decode(tx),
        );

        const atomicBatchTxs = atomicBatchSignedTransactions?.map((tx) => {
            const txBody = proto.TransactionBody.decode(tx.bodyBytes);
            const txType = txBody.data;
            if (!txType) {
                throw new Error("Transaction type not found");
            }

            const fromProtobuf = TRANSACTION_REGISTRY.get(txType);
            if (!fromProtobuf) {
                throw new Error("fromProtobuf not found");
            }
            /* Inner transactions only have one signed transactios therefore
            the other properties are empty that are needed from the 
            Transaction._fromProtobufTransactions method
            */

            /**
             * @type {proto.ITransaction[]}
             */
            const innerTransactions = [];
            /**
             * @type {proto.ISignedTransaction[]}
             */
            const signedInnerTransactions = [tx];
            /**
             * @type {TransactionId[]}
             */
            const innerTransactionIds = [];

            /**
             * Node account IDs is empty for inner transactions
             * @type {AccountId[]}
             */
            const nodeAccountIds = [];

            /**
             * @type {HieroProto.proto.TransactionBody[]}
             */
            const bodies = [txBody];

            return fromProtobuf(
                innerTransactions,
                signedInnerTransactions,
                innerTransactionIds,
                nodeAccountIds,
                bodies,
            );
        });

        return Transaction._fromProtobufTransactions(
            new BatchTransaction({
                transactions: atomicBatchTxs,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * This method returns a key for the `data` field in a transaction body.
     * Each transaction overwrite this to make sure when we build the transaction body
     * we set the right data field.
     *
     * @abstract
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "atomicBatch";
    }

    /**
     * @description Get the log ID for the BatchTransaction.
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `AtomicBatch:${timestamp.toString()}`;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {HieroProto.proto.ITransaction} request
     * @returns {Promise<HieroProto.proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.util.atomicBatch(request);
    }

    /**
     * @description Validate the transaction
     * @param {Transaction} tx
     * @throws {Error} If the transaction is a batch or freeze transaction
     */
    _validateTransaction(tx) {
        if (tx instanceof BatchTransaction || tx instanceof FreezeTransaction) {
            throw new Error(
                "Transaction is not allowed to be added to a batch",
            );
        }
        if (!tx.isFrozen()) {
            throw new Error(
                "Transaction must be frozen before being added to a batch",
            );
        }
        if (!tx.batchKey) {
            throw new Error("Transaction must have a batch key");
        }
    }
}

TRANSACTION_REGISTRY.set(
    "atomicBatch",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    BatchTransaction._fromProtobuf,
);
