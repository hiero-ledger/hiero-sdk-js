// SPDX-License-Identifier: Apache-2.0

import AccountId from "./AccountId.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.ITransaction} HieroProto.proto.ITransaction
 * @typedef {import("@hashgraph/proto").proto.ISignedTransaction} HieroProto.proto.ISignedTransaction
 * @typedef {import("@hashgraph/proto").proto.TransactionBody} HieroProto.proto.TransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionBody} HieroProto.proto.ITransactionBody
 * @typedef {import("@hashgraph/proto").proto.ITransactionResponse} HieroProto.proto.ITransactionResponse
 * @typedef {import("@hashgraph/proto").proto.ICryptoDeleteTransactionBody} HieroProto.proto.ICryptoDeleteTransactionBody
 * @typedef {import("@hashgraph/proto").proto.IAccountID} HieroProto.proto.IAccountID
 */

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

/**
 * Marks an account as deleted, moving all its current hbars to another account.
 *
 * It will remain in the ledger, marked as deleted, until it expires.
 * Transfers into it a deleted account fail. But a deleted account can still have its
 * expiration extended in the normal way.
 */
export default class AccountDeleteTransaction extends Transaction {
    /**
     * @param {object} props
     * @param {AccountId} [props.accountId]
     * @param {AccountId} [props.transferAccountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._transferAccountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.transferAccountId != null) {
            this.setTransferAccountId(props.transferAccountId);
        }
    }

    /**
     * @internal
     * @param {HieroProto.proto.ITransaction[]} transactions
     * @param {HieroProto.proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {HieroProto.proto.ITransactionBody[]} bodies
     * @returns {AccountDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const accountDelete =
            /** @type {HieroProto.proto.ICryptoDeleteTransactionBody} */ (
                body.cryptoDelete
            );

        return Transaction._fromProtobufTransactions(
            new AccountDeleteTransaction({
                accountId:
                    accountDelete.deleteAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {HieroProto.proto.IAccountID} */ (
                                  accountDelete.deleteAccountID
                              ),
                          )
                        : undefined,
                transferAccountId:
                    accountDelete.transferAccountID != null
                        ? AccountId._fromProtobuf(
                              /** @type {HieroProto.proto.IAccountID} */ (
                                  accountDelete.transferAccountID
                              ),
                          )
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
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * Set the account ID which is being deleted in this transaction.
     *
     * @param {AccountId | string} accountId
     * @returns {AccountDeleteTransaction}
     */
    setAccountId(accountId) {
        this._requireNotFrozen();
        this._accountId =
            typeof accountId === "string"
                ? AccountId.fromString(accountId)
                : accountId.clone();

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get transferAccountId() {
        return this._transferAccountId;
    }

    /**
     * Set the account ID which will receive all remaining hbars.
     *
     * @param {AccountId | string} transferAccountId
     * @returns {AccountDeleteTransaction}
     */
    setTransferAccountId(transferAccountId) {
        this._requireNotFrozen();
        this._transferAccountId =
            typeof transferAccountId === "string"
                ? AccountId.fromString(transferAccountId)
                : transferAccountId.clone();

        return this;
    }

    /**
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
        }

        if (this._transferAccountId != null) {
            this._transferAccountId.validateChecksum(client);
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
        return channel.crypto.cryptoDelete(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<HieroProto.proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoDelete";
    }

    /**
     * @override
     * @protected
     * @returns {HieroProto.proto.ICryptoDeleteTransactionBody}
     */
    _makeTransactionData() {
        return {
            deleteAccountID:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            transferAccountID:
                this._transferAccountId != null
                    ? this._transferAccountId._toProtobuf()
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
        return `AccountDeleteTransaction:${timestamp.toString()}`;
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoDelete",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    AccountDeleteTransaction._fromProtobuf,
);
