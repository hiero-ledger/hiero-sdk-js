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
     * @param {Transaction[]} txs
     * @returns {BatchTransaction}
     */
    setInnerTransactions(txs) {
        txs.forEach((tx) => this._validateTransaction(tx));
        this._batchTransactions = txs;
        return this;
    }

    /**
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
     * @returns {Transaction[]}
     */
    get innerTransactions() {
        return this._batchTransactions;
    }

    /**
     * @returns {(TransactionId | null)[]}
     */
    get innerTransactionIds() {
        return this._batchTransactions.map((tx) => tx.transactionId);
    }

    /**
     *
     * @returns {proto.AtomicBatchTransactionBody}
     */
    _makeTransactionData() {
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

        const atomicBatchSignedBytes = atomicBatchTxBytes?.map((tx) =>
            proto.SignedTransaction.decode(tx),
        );

        const atomicBatchTxs = atomicBatchSignedBytes?.map((tx) => {
            const txBody = proto.TransactionBody.decode(tx.bodyBytes);
            const txType = txBody.data;
            if (!txType) {
                throw new Error("Transaction type not found");
            }

            const fromProtobuf = TRANSACTION_REGISTRY.get(txType);
            if (!fromProtobuf) {
                throw new Error("fromProtobuf not found");
            }

            return fromProtobuf([], [tx], [], [], [txBody]);
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
     * @param {Transaction} tx
     * @throws {Error} If the transaction is a batch or freeze transaction
     */
    _validateTransaction(tx) {
        if (tx instanceof BatchTransaction || tx instanceof FreezeTransaction) {
            throw new Error(
                "Transaction is not allowed to be added to a batch",
            );
        }
    }
}

TRANSACTION_REGISTRY.set(
    "atomicBatch",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    BatchTransaction._fromProtobuf,
);
