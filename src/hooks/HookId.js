import HookEntityId from "./HookEntityId.js";

/**
 * Once a hook is created, its full id.
 * <p>
 * A composite of its creating entity's id and an arbitrary 64-bit hook id
 * (which need not be sequential).
 */
class HookId {
    /**
     *
     * @param {object} props
     * @param {HookEntityId} [props.entityId]
     * @param {Long} [props.hookId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?HookEntityId}
         */
        this._entityId = null;

        /**
         * @private
         * @type {?Long}
         */
        this._hookId = null;

        if (props.entityId != null) {
            this.setEntityId(props.entityId);
        }

        if (props.hookId != null) {
            this.setHookId(props.hookId);
        }
    }

    /**
     *
     * @param {HookEntityId} entityId
     * @returns {this}
     */
    setEntityId(entityId) {
        this._entityId = entityId;
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
     * @returns {HookEntityId | null}
     */
    get entityId() {
        return this._entityId;
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
     * @param {import("@hiero-ledger/proto").proto.IHookId} hookId
     * @returns {HookId}
     */
    static _fromProtobuf(hookId) {
        return new HookId({
            entityId:
                hookId.entityId != null
                    ? HookEntityId._fromProtobuf(hookId.entityId)
                    : undefined,
            hookId: hookId.hookId != null ? hookId.hookId : undefined,
        });
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").proto.IHookId}
     */
    _toProtobuf() {
        return {
            entityId:
                this._entityId != null ? this._entityId._toProtobuf() : null,
            hookId: this._hookId,
        };
    }
}

export default HookId;
