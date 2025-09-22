import * as HieroProto from "@hashgraph/proto";
import HookEntityId from "./HookEntityId";

export default class HookId {
    /**
     *
     * @param {object} props
     * @param {HookEntityId} [props.entityId]
     * @param {Long} [props.hookId]
     */
    constructor(props) {
        this.entityId = props.entityId;
        this.hookId = props.hookId;
    }
    /**
     *
     * @param {import("@hashgraph/proto").proto.IHookId} hookId
     * @returns
     */
    static _fromProtobuf(hookId) {
        return new HookId({
            entityId:
                hookId.entityId != null
                    ? HookEntityId.fromProtobuf(hookId.entityId)
                    : undefined,
            hookId: hookId.hookId != null ? hookId.hookId : undefined,
        });
    }

    /**
     *
     * @returns {HieroProto.proto.IHookId}
     */
    _toProtobuf() {
        return {
            entityId: this.entityId != null ? this.entityId.toProtobuf() : null,
            hookId: this.hookId,
        };
    }
}
