/**
 * @namespace proto
 * @typedef {import("@hiero-ledger/proto").proto.IHookCall} HieroProto.proto.IHookCall
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
     * @param {import("../hooks/EvmHookCall.js").default} [props.evmHookCall]
     */
    constructor(props = {}) {
        if (props.hookId !== undefined) {
            this.setHookId(props.hookId);
        }

        if (props.evmHookCall !== undefined) {
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
     *
     * @returns {Long | undefined}
     */
    get hookId() {
        return this._hookId;
    }

    /**
     *
     * @returns {import("../hooks/EvmHookCall.js").default | undefined}
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
            hookId: hookCall.hookId ?? undefined,
            evmHookCall: hookCall.evmHookCall
                ? EvmHookCall._fromProtobuf(hookCall.evmHookCall)
                : undefined,
        });
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").proto.HookCall}}
     */
    _toProtobuf() {
        return {
            hookId: this._hookId,
            evmHookCall: this._evmHookCall?._toProtobuf(),
        };
    }
}

export default HookCall;
