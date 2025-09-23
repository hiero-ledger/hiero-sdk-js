/**
 * @namespace proto
 * @typedef {import("@hashgraph/proto").proto.IHookCall} HieroProto.proto.IHookCall
 */

import EvmHookCall from "../hooks/EvmHookCall.js";

class HookCall {
    /**
     *
     * @param {object} props
     * @param {Long} [props.hookId]
     * @param {import("../hooks/EvmHookCall.js").default} [props.call]
     */
    constructor(props = {}) {
        this.hookId = null;
        this.call = null;

        if (props.hookId != null) {
            this.setHookId(props.hookId);
        }

        if (props.call != null) {
            this.setCall(props.call);
        }
    }

    /**
     *
     * @param {Long} hookId
     * @returns
     */
    setHookId(hookId) {
        this.hookId = hookId;
        return this;
    }

    /**
     *
     * @param {import("../hooks/EvmHookCall.js").default} call
     * @returns
     */
    setCall(call) {
        this.call = call;
        return this;
    }

    /**
     * @internal
     * @param {HieroProto.proto.IHookCall} hookCall
     * @returns {HookCall}
     */
    static _fromProtobuf(hookCall) {
        return new HookCall({
            hookId: hookCall.hookId != null ? hookCall.hookId : undefined,
            call: hookCall.evmHookCall
                ? EvmHookCall._fromProtobuf(hookCall.evmHookCall)
                : undefined,
        });
    }

    _toProtobuf() {
        return {
            hookId: this.hookId,
            call: this.call,
        };
    }
}

export default HookCall;
