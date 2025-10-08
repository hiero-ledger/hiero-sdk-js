import HookEntityId from "./HookEntityId";

/**
 * Once a hook is created, its full id.
 * <p>
 * A composite of its creating entity's id and an arbitrary 64-bit hook id
 * (which need not be sequential).
 */
export default class HookId {
    /**
     *
     * @param {object} props
     * @param {HookEntityId} [props.entityId]
     * @param {Long} [props.hookId]
     */
    constructor(props = {}) {
        /**
         * @protected
         * @type {?HookEntityId}
         */
        this.entityId = null;
        if (props.entityId != null) {
            this.setEntityId(props.entityId);
        }

        /**
         * @protected
         * @type {?Long}
         */
        this.hookId = null;
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
        this.entityId = entityId;
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
     * @returns {HookEntityId | null}
     */
    getEntityId() {
        return this.entityId;
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
     * @param {import("@hashgraph/proto").proto.IHookId} hookId
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
     * @returns {import("@hashgraph/proto").proto.IHookId}
     */
    _toProtobuf() {
        return {
            entityId:
                this.entityId != null ? this.entityId._toProtobuf() : null,
            hookId: this.hookId,
        };
    }
}
