// SPDX-License-Identifier: Apache-2.0

import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hashgraph/proto").proto.ITransaction} ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} ITransactionResponse
 */

/**
 * @namespace com.hedera.hapi.node.addressbook
 * @typedef {import("@hashgraph/proto").com.hedera.hapi.node.addressbook.INodeDeleteTransactionBody} INodeDeleteTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * A transaction to delete a consensus node in the network.
 */
export default class NodeDeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Long} [props.nodeId]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Long}
         * @description Consensus node identifier in the network state. It's required.
         */
        this._nodeId = props?.nodeId != null ? props.nodeId : null;
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {NodeDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const nodeDelete = /** @type {INodeDeleteTransactionBody} */ (
            body.nodeDelete
        );

        return Transaction._fromProtobufTransactions(
            new NodeDeleteTransaction({
                nodeId:
                    nodeDelete.nodeId != null ? nodeDelete.nodeId : undefined,
            }),
            transactions,
            signedTransactions,
            transactionIds,
            nodeIds,
            bodies,
        );
    }

    /**
     * @param {Long} nodeId
     * @description Set consensus node identifier.
     * @returns {NodeDeleteTransaction}
     */
    setNodeId(nodeId) {
        this._nodeId = nodeId;

        return this;
    }

    /**
     * @description Get consensus node identifier.
     * @returns {?Long}
     */
    get nodeId() {
        return this._nodeId;
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.addressBook.deleteNode(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "nodeDelete";
    }

    /**
     * @override
     * @protected
     * @returns {INodeDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            nodeId: this._nodeId != null ? this._nodeId : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `NodeDeleteTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "nodeDelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    NodeDeleteTransaction._fromProtobuf,
);
