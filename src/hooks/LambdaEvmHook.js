class LambdaEvmHook {
    /**
     *
     * @param {object} [props]
     * @param {import("./EvmHookSpec.js").default} [props.spec]
     * @param {import("./LambdaStorageUpdate.js").default[]} [props.storageUpdates]
     */
    constructor(props = {}) {
        this.spec = null;
        this.storageUpdates =
            props.storageUpdates != null ? props.storageUpdates : [];

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
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaEvmHook}
     */
    toProtobuf() {
        return {
            spec: this.spec?.toProtobuf(),
            storageUpdates: this.storageUpdates.map((update) =>
                update._toProtobuf(),
            ),
        };
    }
}

export default LambdaEvmHook;
