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
         * @private
         * @type {?import("./EvmHookSpec.js").default}
         */
        this._spec = null;

        /**
         * @private
         * @type {import("./LambdaStorageUpdate.js").default[]}
         */
        this._storageUpdates = [];

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
        this._storageUpdates = storageUpdates;
        return this;
    }

    /**
     * @param {import("./EvmHookSpec.js").default} spec
     * @returns {this}
     */
    setSpec(spec) {
        this._spec = spec;
        return this;
    }

    /**
     *
     * @returns {import("./EvmHookSpec.js").default | null}
     */
    get spec() {
        return this._spec;
    }

    /**
     *
     * @returns {import("./LambdaStorageUpdate.js").default[]}
     */
    get storageUpdates() {
        return this._storageUpdates;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaEvmHook}
     */
    _toProtobuf() {
        return {
            spec: this._spec?._toProtobuf(),
            storageUpdates: this._storageUpdates.map((update) =>
                update._toProtobuf(),
            ),
        };
    }
}

export default LambdaEvmHook;
