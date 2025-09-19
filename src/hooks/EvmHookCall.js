class EvmHookCall {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.data]
     * @param {number} [props.gasLimit]
     */
    constructor(props = {}) {
        this.data = null;
        this.gasLimit = null;

        if (props.data != null) {
            this.setData(props.data);
        }

        if (props.gasLimit != null) {
            this.setGasLimit(props.gasLimit);
        }
    }

    /**
     *
     * @param {Uint8Array} data
     * @returns
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     *
     * @param {number} gasLimit
     * @returns
     */
    setGasLimit(gasLimit) {
        this.gasLimit = gasLimit;
        return this;
    }
}

export default EvmHookCall;
