import Long from "long";

class HookCreationDetails {
    /**
     *
     * @param {object} props
     * @param {number} [props.extensionPoint]
     * @param {number} [props.hookId]
     * @param {import("./LambdaEvmHook.js").default} [props.hook]
     * @param {import("../Key.js").default} [props.key]
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {number | null}
         */
        this.extensionPoint = null;
        /**
         * @protected
         * @type {number | null}
         */
        this.hookId = null;
        /**
         * @protected
         * @type {import("./LambdaEvmHook.js").default | null}
         */
        this.hook = null;
        /**
         * @protected
         * @type {import("../Key.js").default | null}
         */
        this.key = null;

        if (props.extensionPoint != null) {
            this.setExtensionPoint(props.extensionPoint);
        }

        if (props.hookId != null) {
            this.setHookId(props.hookId);
        }

        if (props.hook != null) {
            this.setHook(props.hook);
        }

        if (props.key != null) {
            this.setKey(props.key);
        }
    }

    /**
     *
     * @param {number} extensionPoint
     * @returns {this}
     */
    setExtensionPoint(extensionPoint) {
        this.extensionPoint = extensionPoint;

        return this;
    }

    /**
     *
     * @param {number} hookId
     * @returns {this}
     */
    setHookId(hookId) {
        this.hookId = hookId;
        return this;
    }

    /**
     *
     * @param {import("./LambdaEvmHook.js").default} hook
     * @returns {this}
     */
    setHook(hook) {
        this.hook = hook;
        return this;
    }

    /**
     *
     * @param {import("../Key.js").default} key
     * @returns {this}
     */
    setKey(key) {
        this.key = key;
        return this;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IHookCreationDetails}
     */
    toProtobuf() {
        return {
            extensionPoint: this.extensionPoint,
            hookId: Long.fromInt(this.hookId ?? 0),
            lambdaEvmHook: this.hook != null ? this.hook.toProtobuf() : null,
            adminKey: this.key != null ? this.key._toProtobufKey() : null,
        };
    }
}

export default HookCreationDetails;
