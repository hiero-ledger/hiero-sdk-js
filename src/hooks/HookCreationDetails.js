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
         * @private
         * @type {number | null}
         */
        this._extensionPoint = null;

        /**
         * @private
         * @type {Long | null}
         */
        this._hookId = null;

        /**
         * @private
         * @type {import("./LambdaEvmHook.js").default | null}
         */
        this._hook = null;

        /**
         * @private
         * @type {import("../Key.js").default | null}
         */
        this._adminKey = null;

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
        this._extensionPoint = extensionPoint;
        return this;
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
     * @param {import("./LambdaEvmHook.js").default} hook
     * @returns {this}
     */
    setHook(hook) {
        this._hook = hook;
        return this;
    }

    /**
     *
     * @param {import("../Key.js").default} adminKey
     * @returns {this}
     */
    setKey(adminKey) {
        this._adminKey = adminKey;
        return this;
    }

    /**
     *
     * @returns {number | null}
     */
    get extensionPoint() {
        return this._extensionPoint;
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
     * @returns {import("./LambdaEvmHook.js").default | null}
     */
    get hook() {
        return this._hook;
    }

    /**
     *
     * @returns {import("../Key.js").default | null}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IHookCreationDetails}
     */
    _toProtobuf() {
        return {
            extensionPoint: this._extensionPoint,
            hookId: this._hookId,
            lambdaEvmHook: this._hook != null ? this._hook._toProtobuf() : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
        };
    }
}

export default HookCreationDetails;
