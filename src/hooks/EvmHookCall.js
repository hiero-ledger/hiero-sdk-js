/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IEvmHookCall} HieroProto.proto.IEvmHookCall
 */

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
     * @returns {this}
     */
    setData(data) {
        this.data = data;
        return this;
    }

    /**
     *
     * @param {number} gasLimit
     * @returns {this}
     */
    setGasLimit(gasLimit) {
        this.gasLimit = gasLimit;
        return this;
    }

    /**
     *
     * @param {HieroProto.proto.IEvmHookCall} evmHookCall
     * @returns {EvmHookCall}
     */
    static _fromProtobuf(evmHookCall) {
        return new EvmHookCall({
            data: evmHookCall.data ? evmHookCall.data : undefined,
            gasLimit: evmHookCall.gasLimit
                ? evmHookCall.gasLimit.toNumber()
                : undefined,
        });
    }

    _toProtobuf() {
        return {
            data: this.data,
            gasLimit: this.gasLimit,
        };
    }
}

export default EvmHookCall;
