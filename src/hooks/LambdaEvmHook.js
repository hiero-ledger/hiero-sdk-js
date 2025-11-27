/**
 * Definition of a lambda EVM hook.
 */
class LambdaEvmHook {
    /**
     *
     * @param {object} [props]
     * @param {import("./../contract/ContractId").default} [props.contractId]
     * @param {import("./LambdaStorageUpdate.js").LambdaStorageUpdate[]} [props.storageUpdates]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?import("./../contract/ContractId.js").default}
         */
        this._contractId = null;

        /**
         * @private
         * @type {import("./LambdaStorageUpdate.js").LambdaStorageUpdate[]}
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
     * @param {import("./LambdaStorageUpdate.js").LambdaStorageUpdate[]} storageUpdates
     * @returns {this}
     */
    setStorageUpdates(storageUpdates) {
        this._storageUpdates = storageUpdates;
        return this;
    }

    /**
     *
     * @returns {import("./LambdaStorageUpdate.js").LambdaStorageUpdate[]}
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
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaEvmHook}
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

export default LambdaEvmHook;
