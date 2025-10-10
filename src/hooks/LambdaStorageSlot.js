class LambdaStorageSlot {
    /**
     *
     * @param {Uint8Array} key
     * @param {Uint8Array} value
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
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
        return new LambdaStorageSlot(
            lambdaStorageSlot.key != null
                ? lambdaStorageSlot.key
                : new Uint8Array(),
            lambdaStorageSlot.value != null
                ? lambdaStorageSlot.value
                : new Uint8Array(),
        );
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
