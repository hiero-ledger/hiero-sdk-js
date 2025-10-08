import AccountId from "../account/AccountId.js";

class HookEntityId {
    /**
     *
     * @param {object} props
     * @param {AccountId} [props.accountId]
     */
    constructor(props = {}) {
        this.accountId = null;
        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     *
     * @returns {AccountId | null}
     */
    getAccountId() {
        return this.accountId;
    }

    /**
     * @param {AccountId} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this.accountId = accountId;
        return this;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").proto.IHookEntityId}
     */
    _toProtobuf() {
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
    static _fromProtobuf(hookEntityId) {
        return new HookEntityId({
            accountId:
                hookEntityId.accountId != null
                    ? AccountId._fromProtobuf(hookEntityId.accountId)
                    : undefined,
        });
    }
}

export default HookEntityId;
