class HookCall {
    /**
     *
     * @param {object} props
     * @param {number} [props.hookId]
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
     * @param {number} hookId
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
}

export default HookCall;
