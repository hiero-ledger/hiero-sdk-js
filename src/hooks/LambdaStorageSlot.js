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
     * @returns
     */
    setKey(key) {
        this.key = key;
        return this;
    }

    /**
     *
     * @param {Uint8Array} value
     * @returns
     */
    setValue(value) {
        this.value = value;
        return this;
    }
}

export default LambdaStorageSlot;
