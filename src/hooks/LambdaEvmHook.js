import EvmHookSpec from "./EvmHookSpec";

class LambdaEvmHook extends EvmHookSpec {
    /**
     *
     * @param {object} props
     * @param {import("./EvmHookSpec.js").default} [props.spec]
     * @param {import("./LambdaStorageUpdate.js").default[]} [props.storageUpdates]
     */
    constructor(props = {}) {
        super({
            contractId:
                props.spec?.contractId != null
                    ? props.spec.contractId
                    : undefined,
        });

        this.storageUpdates =
            props.storageUpdates != null ? props.storageUpdates : [];

        if (props.storageUpdates != null) {
            this.setStorageUpdates(props.storageUpdates);
        }
    }

    /**
     *
     * @param {import("./LambdaStorageUpdate.js").default[]} storageUpdates
     * @returns
     */
    setStorageUpdates(storageUpdates) {
        this.storageUpdates = storageUpdates;
        return this;
    }
}

export default LambdaEvmHook;
