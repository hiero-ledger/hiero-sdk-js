/**
 * Definition of an EVM hook extending shared specifications for an EVM hook.
 */
class EvmHook {
    /**
     *
     * @param {object} [props]
     * @param {import("./../contract/ContractId").default} [props.contractId]
     * @param {import("./EvmHookStorageUpdate.js").EvmHookStorageUpdate[]} [props.storageUpdates]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?import("./../contract/ContractId.js").default}
         */
        this._contractId = null;

        /**
         * @private
         * @type {import("./EvmHookStorageUpdate.js").EvmHookStorageUpdate[]}
         */
        this._storageUpdates = [];

        if (props.storageUpdates != null) {
            this.setStorageUpdates(props.storageUpdates);
        }

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     * @param {import("./../contract/ContractId.js").default} contractId
     * @returns {this}
     */
    setContractId(contractId) {
        this._contractId = contractId;
        return this;
    }

    /**
     * @param {import("./EvmHookStorageUpdate.js").EvmHookStorageUpdate[]} storageUpdates
     * @returns {this}
     */
    setStorageUpdates(storageUpdates) {
        this._storageUpdates = storageUpdates;
        return this;
    }

    /**
     *
     * @returns {import("./EvmHookStorageUpdate.js").EvmHookStorageUpdate[]}
     */
    get storageUpdates() {
        return this._storageUpdates;
    }

    /**
     *
     * @returns {import("./../contract/ContractId.js").default | null}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IEvmHook}
     */
    _toProtobuf() {
        return {
            spec: {
                contractId: this._contractId?._toProtobuf(),
            },
            storageUpdates: this._storageUpdates.map((update) =>
                update._toProtobuf(),
            ),
        };
    }
}

export default EvmHook;
