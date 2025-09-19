class LambdaSStoreTransaction {
    /**
     *
     * @param {object} props
     * @param {number} [props.hookId]
     * @param {import("../hooks/LambdaStorageUpdate.js").default[]} [props.storageUpdates]
     */
    constructor(props) {
        this.hookId = props.hookId;
        this.storageUpdates = props.storageUpdates;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").proto.iLambdaSStoreTransaction} HieroProto.proto.ILambdaSStoreTransactionBody
     */
    toProto() {
        return {
            hook_id: this.hookId,
            storage_updates: this.storageUpdates,
        };
    }
}
