/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IHookCall} HieroProto.proto.IHookCall
 */

import EvmHookCall from "../hooks/EvmHookCall.js";

/**
 *
 * Specifies a call to a hook from within a transaction.
 * <p>
 * Often the hook's entity is implied by the nature of the call site. For example, when using an account allowance hook
 * inside a crypto transfer, the hook's entity is necessarily the account whose authorization is required.
 * <p>
 * For future extension points where the hook owner is not forced by the context, we include the option to fully
 * specify the hook id for the call.
 */
class HookCall {
    /**
     *
     * @param {object} props
     * @param {Long} [props.hookId]
     * @param {import("../hooks/HookId.js").default} [props.fullHookId]
     * @param {import("../hooks/EvmHookCall.js").default} [props.evmHookCall]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?Long}
         */
        this._hookId = null;

        /**
         * @private
         * @type {?import("../hooks/HookId.js").default}
         */
        this._fullHookId = null;

        /**
         * @private
         * @type {?import("../hooks/EvmHookCall.js").default}
         */
        this._evmHookCall = null;

        if (props.hookId != null) {
            this.setHookId(props.hookId);
        }

        if (props.fullHookId != null) {
            this.setFullHookId(props.fullHookId);
        }

        if (props.evmHookCall != null) {
            this.setCall(props.evmHookCall);
        }
    }

    /**
     *
     * @param {Long} hookId
     * @returns {this}
     */
    setHookId(hookId) {
        this._hookId = hookId;
        // clear fullHookId when setting hookId
        this._fullHookId = null;
        return this;
    }

    /**
     *
     * @param {import("../hooks/EvmHookCall.js").default} evmHookCall
     * @returns {this}
     */
    setCall(evmHookCall) {
        this._evmHookCall = evmHookCall;
        return this;
    }

    /**
     * @param {import("../hooks/HookId.js").default} fullHookId
     * @returns {this}
     */
    setFullHookId(fullHookId) {
        this._fullHookId = fullHookId;
        // clear hookId when setting fullHookId
        this._hookId = null;
        return this;
    }

    /**
     *
     * @returns {Long | null}
     */
    get hookId() {
        return this._hookId;
    }

    /**
     *
     * @returns {import("../hooks/HookId.js").default | null}
     */
    get fullHookId() {
        return this._fullHookId;
    }

    /**
     *
     * @returns {import("../hooks/EvmHookCall.js").default | null}
     */
    get evmHookCall() {
        return this._evmHookCall;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IHookCall} hookCall
     * @returns {HookCall}
     */
    static _fromProtobuf(hookCall) {
        return new HookCall({
            hookId: hookCall.hookId != null ? hookCall.hookId : undefined,
            evmHookCall: hookCall.evmHookCall
                ? EvmHookCall._fromProtobuf(hookCall.evmHookCall)
                : undefined,
        });
    }

    /**
     *
     * @returns {import("@hashgraph/proto").proto.HookCall}}
     */
    _toProtobuf() {
        return {
            hookId: this._hookId,
            evmHookCall: this._evmHookCall?._toProtobuf(),
            fullHookId: this._fullHookId?._toProtobuf(),
        };
    }
}

export default HookCall;
