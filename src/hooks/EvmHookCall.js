import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IEvmHookCall} HieroProto.proto.IEvmHookCall
 */

/**
 * Specifies details of a call to an EVM hook.
 */
class EvmHookCall {
    /**
     *
     * @param {object} props
     * @param {Uint8Array} [props.data]
     * @param {Long} [props.gasLimit]
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {?Uint8Array}
         */
        this.data = null;

        /**
         * @protected
         * @type {?Long}
         */
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
     * @param {Long} gasLimit
     * @returns {this}
     */
    setGasLimit(gasLimit) {
        this.gasLimit = gasLimit;
        return this;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    getData() {
        return this.data;
    }

    /**
     *
     * @returns {Long | null}
     */
    getGasLimit() {
        return this.gasLimit;
    }

    /**
     *
     * @param {HieroProto.proto.IEvmHookCall} evmHookCall
     * @returns {EvmHookCall}
     */
    static _fromProtobuf(evmHookCall) {
        return new EvmHookCall({
            data: evmHookCall.data ? evmHookCall.data : undefined,
            gasLimit: evmHookCall.gasLimit ? evmHookCall.gasLimit : undefined,
        });
    }

    /**
     *
     * @returns {import("@hashgraph/proto").proto.IEvmHookCall}
     */
    _toProtobuf() {
        return {
            data: this.data,
            gasLimit: this.gasLimit ? this.gasLimit : null,
        };
    }
}

export default EvmHookCall;
