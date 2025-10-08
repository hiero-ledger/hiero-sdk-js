/**
 * Definition of a lambda EVM hook.
 */
class LambdaEvmHook {
    /**
     *
     * @param {object} [props]
     * @param {import("./EvmHookSpec.js").default} [props.spec]
     * @param {import("./LambdaStorageUpdate.js").default[]} [props.storageUpdates]
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {?import("./EvmHookSpec.js").default}
         */
        this.spec = null;

        /**
         * @protected
         * @type {import("./LambdaStorageUpdate.js").default[]}
         */
        this.storageUpdates = [];

        if (props.storageUpdates != null) {
            this.setStorageUpdates(props.storageUpdates);
        }

        if (props.spec != null) {
            this.setSpec(props.spec);
        }
    }

    /**
     *
     * @param {import("./LambdaStorageUpdate.js").default[]} storageUpdates
     * @returns {this}
     */
    setStorageUpdates(storageUpdates) {
        this.storageUpdates = storageUpdates;
        return this;
    }

    /**
     * @param {import("./EvmHookSpec.js").default} spec
     * @returns {this}
     */
    setSpec(spec) {
        this.spec = spec;
        return this;
    }

    /**
     *
     * @returns {import("./EvmHookSpec.js").default | null}
     */
    getSpec() {
        return this.spec;
    }

    /**
     *
     * @returns {import("./LambdaStorageUpdate.js").default[]}
     */
    getStorageUpdates() {
        return this.storageUpdates;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaEvmHook}
     */
    _toProtobuf() {
        return {
            spec: this.spec?._toProtobuf(),
            storageUpdates: this.storageUpdates.map((update) =>
                update._toProtobuf(),
            ),
        };
    }
}

export default LambdaEvmHook;
