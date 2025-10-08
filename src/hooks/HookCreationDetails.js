import Long from "long";

/**
 * The details of a hook's creation.
 */
class HookCreationDetails {
    /**
     *
     * @param {object} props
     * @param {number} [props.extensionPoint]
     * @param {Long} [props.hookId]
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
         * @type {Long | null}
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
        this.adminKey = null;

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
     * @param {Long} hookId
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
     * @param {import("../Key.js").default} adminKey
     * @returns {this}
     */
    setKey(adminKey) {
        this.adminKey = adminKey;
        return this;
    }

    /**
     *
     * @returns {number | null}
     */
    getExtensionPoint() {
        return this.extensionPoint;
    }

    /**
     *
     * @returns {Long | null}
     */
    getHookId() {
        return this.hookId;
    }

    /**
     *
     * @returns {import("./LambdaEvmHook.js").default | null}
     */
    getHook() {
        return this.hook;
    }

    /**
     *
     * @returns {import("../Key.js").default | null}
     */
    getKey() {
        return this.adminKey;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IHookCreationDetails}
     */
    _toProtobuf() {
        return {
            extensionPoint: this.extensionPoint,
            hookId: this.hookId,
            lambdaEvmHook: this.hook != null ? this.hook._toProtobuf() : null,
            adminKey:
                this.adminKey != null ? this.adminKey._toProtobufKey() : null,
        };
    }
}

export default HookCreationDetails;
