import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";
import AccountId from "./AccountId.js";

/**
 * @namespace proto
 * @typedef {import("@exodus/hashgraph-proto").ITransaction} proto.ITransaction
 * @typedef {import("@exodus/hashgraph-proto").ISignedTransaction} proto.ISignedTransaction
 * @typedef {import("@exodus/hashgraph-proto").TransactionBody} proto.TransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionBody} proto.ITransactionBody
 * @typedef {import("@exodus/hashgraph-proto").ITransactionResponse} proto.ITransactionResponse
 * @typedef {import("@exodus/hashgraph-proto").ICryptoDeleteLiveHashTransactionBody} proto.ICryptoDeleteLiveHashTransactionBody
 */

/**
 * @typedef {import("@exodus/hashgraph-cryptography").Key} Key
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

export default class LiveHashDeleteTransaction extends Transaction {
    /**
     * @param {object} [props]
     * @param {Uint8Array} [props.hash]
     * @param {AccountId | string} [props.accountId]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {?Uint8Array}
         */
        this._hash = null;

        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        if (props.hash != null) {
            this.setHash(props.hash);
        }

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     * @internal
     * @param {proto.ITransaction[]} transactions
     * @param {proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {AccountId[]} nodeIds
     * @param {proto.ITransactionBody[]} bodies
     * @returns {LiveHashDeleteTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies
    ) {
        const body = bodies[0];
        const hashes =
            /** @type {proto.ICryptoDeleteLiveHashTransactionBody} */ (
                body.cryptoDeleteLiveHash
            );

        return Transaction._fromProtobufTransactions(
            new LiveHashDeleteTransaction({
                hash:
                    hashes.liveHashToDelete != null
                        ? hashes.liveHashToDelete
                        : undefined,
                accountId:
                    hashes.accountOfLiveHash != null
                        ? AccountId._fromProtobuf(hashes.accountOfLiveHash)
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
     * @returns {?Uint8Array}
     */
    get hash() {
        return this._hash;
    }

    /**
     * @param {Uint8Array} hash
     * @returns {LiveHashDeleteTransaction}
     */
    setHash(hash) {
        this._requireNotFrozen();
        this._hash = hash;

        return this;
    }

    /**
     * @returns {?AccountId}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     * @param {AccountId | string} accountId
     * @returns {LiveHashDeleteTransaction}
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
     * @param {Client} client
     */
    _validateChecksums(client) {
        if (this._accountId != null) {
            this._accountId.validateChecksum(client);
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
        return channel.crypto.deleteLiveHash(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "cryptoDeleteLiveHash";
    }

    /**
     * @override
     * @protected
     * @returns {proto.ICryptoDeleteLiveHashTransactionBody}
     */
    _makeTransactionData() {
        return {
            liveHashToDelete: this._hash,
            accountOfLiveHash:
                this._accountId != null ? this._accountId._toProtobuf() : null,
        };
    }
}

TRANSACTION_REGISTRY.set(
    "cryptoDeleteLiveHash",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    LiveHashDeleteTransaction._fromProtobuf
);
