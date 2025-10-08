class LambdaStorageSlot {
    /**
     * @param {object} props
     * @param {Uint8Array} [props.key]
     * @param {Uint8Array} [props.value]
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {?Uint8Array}
         */
        this.key = null;

        /**
         * @protected
         * @type {?Uint8Array}
         */
        this.value = null;

        if (props.key != null) {
            this.setKey(props.key);
        }

        if (props.value != null) {
            this.setValue(props.value);
        }
    }

    /**
     *
     * @param {Uint8Array} key
     * @returns {this}
     */
    setKey(key) {
        this.key = key;
        return this;
    }

    /**
     *
     * @param {Uint8Array} value
     * @returns {this}
     */
    setValue(value) {
        this.value = value;
        return this;
    }

    /**
     *
     * @param {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageSlot} lambdaStorageSlot
     * @returns {LambdaStorageSlot}
     */
    static _fromProtobuf(lambdaStorageSlot) {
        const key =
            lambdaStorageSlot.key != null
                ? lambdaStorageSlot.key
                : new Uint8Array();
        const value =
            lambdaStorageSlot.value != null
                ? lambdaStorageSlot.value
                : new Uint8Array();
        return new LambdaStorageSlot({ key, value });
    }

    /**
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.ILambdaStorageSlot}
     */
    _toProtobuf() {
        return {
            key: this.key,
            value: this.value,
        };
    }
}

export default LambdaStorageSlot;
