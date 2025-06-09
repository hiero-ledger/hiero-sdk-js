/**
 * @typedef {import("../account/AccountId").default} AccountId
 * @typedef {import("../transaction/TransactionId").default} TransactionId
 */

/**
 * Represents a transaction body that is ready for signing, associated with a specific node account and transaction identifier.
 * @property {AccountId} nodeAccountId - The account ID of the node.
 * @property {TransactionId} transactionId - The transactionId of the transaction, (when dealing with a chunked transaction, this is the transactionId of the chunk).
 * @property {Uint8Array} signableTransactionBodyBytes - The transaction body bytes ready for signing.
 */
export default class SignableNodeTransactionBodyBytes {
    /**
     * Creates a new instance of NodeSignableTransaction.
     *
     * @param {AccountId} nodeAccountId - The account ID of the node.
     * @param {TransactionId} transactionId - The transactionId of the transaction.
     * @param {Uint8Array} signableTransactionBodyBytes - The transaction body bytes ready for signing.
     */
    constructor(nodeAccountId, transactionId, signableTransactionBodyBytes) {
        /**
         * The node account identifier associated with the transaction.
         * @type {AccountId}
         */
        this.nodeAccountId = nodeAccountId;

        /**
         * The transactionId identifier.
         * Note: When dealing with a chunked transaction, this is the transactionId of the chunk.
         * @type {TransactionId}
         */
        this.transactionId = transactionId;

        /**
         * The bytes of the transaction body, ready to be signed.
         * @type {Uint8Array}
         */
        this.signableTransactionBodyBytes = signableTransactionBodyBytes;
    }
}
