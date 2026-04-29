// SPDX-License-Identifier: Apache-2.0

import Long from "long";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.ITransaction} ITransaction
 * @typedef {import("@hiero-ledger/proto").proto.ISignedTransaction} ISignedTransaction
 * @typedef {import("@hiero-ledger/proto").proto.TransactionBody} TransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionBody} ITransactionBody
 * @typedef {import("@hiero-ledger/proto").proto.ITransactionResponse} ITransactionResponse
 */

/**
 * @namespace com.hedera.hapi.node.addressbook
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.addressbook.IRegisteredNodeDeleteTransactionBody} IRegisteredNodeDeleteTransactionBody
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../account/AccountId.js").default} AccountId
 */

/**
 * Removes an existing registered node from the network address book.
 */
export default class RegisteredNodeDeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Long} [props.registeredNodeId]
     */
    constructor(props) {
        super();

        /**
         * @private
         * @type {?Long}
         */
        this._registeredNodeId =
            props?.registeredNodeId != null ? props.registeredNodeId : null;
    }

    /**
     * @internal
     * @param {ITransaction[]} transactions
     * @param {ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {ITransactionBody[]} bodies
     * @returns {RegisteredNodeDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const registeredNodeDelete =
            /** @type {IRegisteredNodeDeleteTransactionBody} */ (
                body.registeredNodeDelete
            );

        return Transaction._fromProtobufTransactions(
            new RegisteredNodeDeleteTransaction({
                registeredNodeId:
                    registeredNodeDelete.registeredNodeId != null
                        ? Long.fromValue(registeredNodeDelete.registeredNodeId)
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
     * @param {Long | number} registeredNodeId
     * @returns {RegisteredNodeDeleteTransaction}
     */
    setRegisteredNodeId(registeredNodeId) {
        this._requireNotFrozen();

        if (registeredNodeId == null) {
            throw new TypeError(
                "registeredNodeId must not be null or undefined.",
            );
        }

        const longRegisteredNodeId = Long.isLong(registeredNodeId)
            ? registeredNodeId
            : Long.fromValue(registeredNodeId);

        if (longRegisteredNodeId.toNumber() < 0) {
            throw new Error(
                "RegisteredNodeDeleteTransaction: 'registeredNodeId' must be positive.",
            );
        }

        this._registeredNodeId = longRegisteredNodeId;
        return this;
    }

    /**
     * @returns {?Long}
     */
    get registeredNodeId() {
        return this._registeredNodeId;
    }

    /**
     * @override
     * @param {?import("../client/Client.js").default<Channel, *>} client
     * @returns {this}
     */
    freezeWith(client) {
        if (this._registeredNodeId == null) {
            throw new Error(
                "RegisteredNodeDeleteTransaction: 'registeredNodeId' must be explicitly set before calling freeze().",
            );
        }

        return super.freezeWith(client);
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {ITransaction} request
     * @returns {Promise<ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.addressBook.deleteRegisteredNode(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "registeredNodeDelete";
    }

    /**
     * @override
     * @protected
     * @returns {IRegisteredNodeDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            registeredNodeId:
                this._registeredNodeId != null ? this._registeredNodeId : null,
        };
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `RegisteredNodeDeleteTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "registeredNodeDelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    RegisteredNodeDeleteTransaction._fromProtobuf,
);
