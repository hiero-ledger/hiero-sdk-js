import HookId from "../hooks/HookId.js";
import { EvmHookStorageUpdate } from "../hooks/EvmHookStorageUpdate.js";
import Transaction, {
    TRANSACTION_REGISTRY,
} from "../transaction/Transaction.js";

/**
 * @typedef {import("../channel/Channel.js").default} Channel
 * @typedef {import("../client/Client.js").default<*, *>} Client
 * @typedef {import("../Timestamp.js").default} Timestamp
 * @typedef {import("../transaction/TransactionId.js").default} TransactionId
 */

class HookStoreTransaction extends Transaction {
    /**
     *
     * @param {object} props
     * @param {import("../hooks/HookId.js").default} [props.hookId]
     * @param {import("../hooks/EvmHookStorageUpdate.js").EvmHookStorageUpdate[]} [props.storageUpdates]
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
         * @type {EvmHookStorageUpdate[]}
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
     * @returns {EvmHookStorageUpdate[] | []}
     */
    get storageUpdates() {
        return this._storageUpdates;
    }

    /**
     *
     * @param {EvmHookStorageUpdate[]} storageUpdates
     * @returns {this}
     */
    setStorageUpdates(storageUpdates) {
        this._requireNotFrozen();
        this._storageUpdates = storageUpdates;
        return this;
    }

    /**
     * @param {EvmHookStorageUpdate} storageUpdate
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
     * @returns {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IHookStoreTransactionBody} HieroProto.proto.IHookStoreTransactionBody
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
     * @param {import("@hiero-ledger/proto").proto.ITransaction} request
     * @returns {Promise<import("@hiero-ledger/proto").proto.ITransactionResponse>}
     */
    _execute(channel, request) {
        return channel.smartContract.hookStore(request);
    }

    /**
     * @override
     * @protected
     * @returns {NonNullable<import("@hiero-ledger/proto").proto.TransactionBody["data"]>}
     */
    _getTransactionDataCase() {
        return "hookStore";
    }

    /**
     * @returns {string}
     */
    _getLogId() {
        const timestamp = /** @type {import("../Timestamp.js").default} */ (
            this._transactionIds.current.validStart
        );
        return `HookStoreTransaction:${timestamp.toString()}`;
    }

    /**
     * @internal
     * @param {import("@hiero-ledger/proto").proto.ITransaction[]} transactions
     * @param {import("@hiero-ledger/proto").proto.ISignedTransaction[]} signedTransactions
     * @param {TransactionId[]} transactionIds
     * @param {import("../account/AccountId.js").default[]} nodeIds
     * @param {import("@hiero-ledger/proto").proto.ITransactionBody[]} bodies
     * @returns {HookStoreTransaction}
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
            /** @type {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IHookStoreTransactionBody} */ (
                body.hookStore
            );

        return Transaction._fromProtobufTransactions(
            new HookStoreTransaction({
                hookId:
                    create.hookId != null
                        ? HookId._fromProtobuf(create.hookId)
                        : undefined,
                storageUpdates:
                    create.storageUpdates != null
                        ? create.storageUpdates.map((update) =>
                              EvmHookStorageUpdate._fromProtobuf(update),
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
    "hookStore",
    // eslint-disable-next-line @typescript-eslint/unbound-method
    HookStoreTransaction._fromProtobuf,
);

export default HookStoreTransaction;
