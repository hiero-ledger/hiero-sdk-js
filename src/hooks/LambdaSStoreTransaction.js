import Transaction from "../transaction/Transaction.js";

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
     * @param {import("../hooks/LambdaStorageUpdate.js").default[]} [props.storageUpdates]
     */
    constructor(props) {
        super();
        this.hookId = props.hookId;
        this.storageUpdates = props.storageUpdates;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaSStoreTransactionBody} HieroProto.proto.ILambdaSStoreTransactionBody
     */
    _toProtobuf() {
        return {
            hookId: this.hookId != null ? this.hookId._toProtobuf() : undefined,
            storageUpdates:
                this.storageUpdates != null
                    ? this.storageUpdates.map((update) => update._toProtobuf())
                    : undefined,
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
}

export default LambdaSStoreTransaction;
