import HookId from "../hooks/HookId.js";
import { LambdaStorageUpdate } from "../hooks/LambdaStorageUpdate.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

class LambdaSStoreTransaction extends Transaction {
    /**
     *
     * @param {object} props
     * @param {import("../hooks/HookId.js").default} [props.hookId]
     * @param {import("../hooks/LambdaStorageUpdate.js").LambdaStorageUpdate[]} [props.storageUpdates]
     */
    constructor(props = {}) {
        super();

        /**
         * @private
         * @type {HookId | null}
         */
        this._hookId = null;

        /**
         * @private
         * @type {LambdaStorageUpdate[]}
         */
        this._storageUpdates = [];

        if (props.hookId != null) {
            this.setHookId(props.hookId);
        }

        if (props.storageUpdates != null) {
            this.setStorageUpdates(props.storageUpdates);
        }
    }

    /**
     * @returns {HookId | null}
     */
    get hookId() {
        return this._hookId;
    }

    /**
     *
     * @param {HookId} hookId
     * @returns {this}
     */
    setHookId(hookId) {
        this._requireNotFrozen();
        this._hookId = hookId;
        return this;
    }

    /**
     * @returns {LambdaStorageUpdate[] | []}
     */
    get storageUpdates() {
        return this._storageUpdates;
    }

    /**
     *
     * @param {LambdaStorageUpdate[]} storageUpdates
     * @returns {this}
     */
    setStorageUpdates(storageUpdates) {
        this._requireNotFrozen();
        this._storageUpdates = storageUpdates;
        return this;
    }

    /**
     * @param {LambdaStorageUpdate} storageUpdate
     * @returns {this}
     */
    addStorageUpdate(storageUpdate) {
        this._requireNotFrozen();
        this._storageUpdates.push(storageUpdate);
        return this;
    }

    /**
     * @override
     * @protected
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaSStoreTransactionBody} HieroProto.proto.ILambdaSStoreTransactionBody
     */
    _makeTransactionData() {
        return {
            hookId: this.hookId?._toProtobuf(),
            storageUpdates: this.storageUpdates?.map((update) =>
                update._toProtobuf(),
            ),
        };
    }

    /**
     * @override
     * @internal
     * @param {Channel} channel
     * @param {import("@hashgraph/proto").proto.ITransaction} request
     * @returns {Promise<import("@hashgraph/proto").proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.smartContract.lambdaSStore(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<import("@hashgraph/proto").proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "lambdaSstore";
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `LambdaSStoreTransaction:${timestamp.toString()}`;
    }

    /**
     * @internal
     * @param {import("@hashgraph/proto").proto.ITransaction[]} transactions
     * @param {import("@hashgraph/proto").proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {import("../account/AccountId.js").default[]} nodeIds
     * @param {import("@hashgraph/proto").proto.ITransactionBody[]} bodies
     * @returns {LambdaSStoreTransaction}
     */
    static _fromProtobuf(
        transactions,
        signedTransactions,
        transactionIds,
        nodeIds,
        bodies,
    ) {
        const body = bodies[0];
        const create =
            /** @type {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaSStoreTransactionBody} */ (
                body.lambdaSstore
            );

        return Transaction._fromProtobufTransactions(
            new LambdaSStoreTransaction({
                hookId:
                    create.hookId != null
                        ? HookId._fromProtobuf(create.hookId)
                        : undefined,
                storageUpdates:
                    create.storageUpdates != null
                        ? create.storageUpdates.map((update) =>
                              LambdaStorageUpdate._fromProtobuf(update),
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
}

TRANSACTION_REGISTRY.set(
    "lambdaSstore",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    LambdaSStoreTransaction._fromProtobuf,
);

export default LambdaSStoreTransaction;
