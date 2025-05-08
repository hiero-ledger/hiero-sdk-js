/**
 * @typedef {import("../account/AccountId").default} AccountId
 * @typedef {import("../transaction/TransactionId").default} TransactionId
 */

/**
 * Represents a transaction body that is ready for signing, associated with a specific node account.
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
         * The node account identifier associated with the transaction.
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
