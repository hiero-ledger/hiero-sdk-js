import Long from "long";
/**
 * @typedef {import("./EvmHook.js").default} EvmHook
 * @typedef {import("../Key.js").default} Key
 * @typedef {import("./HookExtensionPoint.js").default} HookExtensionPoint
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.HookExtensionPoint} HookExtensionPointProto
 * @typedef {import("@hiero-ledger/proto").com.hedera.hapi.node.hooks.IHookCreationDetails} HookCreationDetailsProto
 */

/**
 * The details of a hook's creation.
 */
class HookCreationDetails {
    /**
     *
     * @param {object} props
     * @param {HookExtensionPoint} [props.extensionPoint]
     * @param {Long | number} [props.hookId]
     * @param {EvmHook} [props.evmHook]
     * @param {Key} [props.adminKey]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {HookExtensionPoint | null}
         */
        this._extensionPoint = null;

        /**
         * @private
         * @type {Long | null}
         */
        this._hookId = null;

        /**
         * @private
         * @type {EvmHook | null}
         */
        this._evmHook = null;

        /**
         * @private
         * @type {Key | null}
         */
        this._adminKey = null;

        if (props.extensionPoint != null) {
            this.setExtensionPoint(props.extensionPoint);
        }

        if (props.hookId != null) {
            this.setHookId(props.hookId);
        }

        if (props.evmHook != null) {
            this.setEvmHook(props.evmHook);
        }

        if (props.adminKey != null) {
            this.setAdminKey(props.adminKey);
        }
    }

    /**
     *
     * @param {HookExtensionPoint} extensionPoint
     * @returns {this}
     */
    setExtensionPoint(extensionPoint) {
        this._extensionPoint = extensionPoint;
        return this;
    }

    /**
     *
     * @param {Long | number} hookId
     * @returns {this}
     */
    setHookId(hookId) {
        this._hookId =
            hookId instanceof Long ? hookId : Long.fromNumber(hookId);
        return this;
    }

    /**
     *
     * @param {EvmHook} evmHook
     * @returns {this}
     */
    setEvmHook(evmHook) {
        this._evmHook = evmHook;
        return this;
    }

    /**
     *
     * @param {Key} adminKey
     * @returns {this}
     */
    setAdminKey(adminKey) {
        this._adminKey = adminKey;
        return this;
    }

    /**
     *
     * @returns {HookExtensionPoint | null}
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
     * @returns {EvmHook | null}
     */
    get evmHook() {
        return this._evmHook;
    }

    /**
     *
     * @returns {Key | null}
     */
    get adminKey() {
        return this._adminKey;
    }

    /**
     *
     * @returns {HookCreationDetailsProto}
     */
    _toProtobuf() {
        if (this._extensionPoint == null) {
            throw new Error(
                "extensionPoint is required for HookCreationDetails",
            );
        }

        return {
            extensionPoint: /** @type {HookExtensionPointProto} */ (
                this._extensionPoint
            ),
            hookId: this._hookId,
            evmHook: this._evmHook != null ? this._evmHook._toProtobuf() : null,
            adminKey:
                this._adminKey != null ? this._adminKey._toProtobufKey() : null,
        };
    }
}

export default HookCreationDetails;
