import AccountId from "../account/AccountId.js";

class HookEntityId {
    /**
     *
     * @param {object} props
     * @param {AccountId} [props.accountId]
     */
    constructor(props) {
        this.accountId = props.accountId;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").proto.IHookEntityId}
     */
    toProtobuf() {
        return {
            accountId:
                this.accountId != null ? this.accountId._toProtobuf() : null,
        };
    }

    /**
     *
     * @param {import("@hashgraph/proto").proto.IHookEntityId} hookEntityId
     * @returns {HookEntityId}
     */
    static fromProtobuf(hookEntityId) {
        return new HookEntityId({
            accountId:
                hookEntityId.accountId != null
                    ? AccountId._fromProtobuf(hookEntityId.accountId)
                    : undefined,
        });
    }
}

export default HookEntityId;
