import Long from "long";

/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.IEvmHookCall} HieroProto.proto.IEvmHookCall
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
         * @private
         * @type {?Uint8Array}
         */
        this._data = null;

        /**
         * @private
         * @type {?Long}
         */
        this._gasLimit = null;

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
        this._data = data;
        return this;
    }

    /**
     *
     * @param {Long} gasLimit
     * @returns {this}
     */
    setGasLimit(gasLimit) {
        this._gasLimit = gasLimit;
        return this;
    }

    /**
     *
     * @returns {Uint8Array | null}
     */
    get data() {
        return this._data;
    }

    /**
     *
     * @returns {Long | null}
     */
    get gasLimit() {
        return this._gasLimit;
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
     * @returns {import("@hiero-ledger/proto").proto.IEvmHookCall}
     */
    _toProtobuf() {
        return {
            data: this._data,
            gasLimit: this._gasLimit ? this._gasLimit : null,
        };
    }
}

export default EvmHookCall;
