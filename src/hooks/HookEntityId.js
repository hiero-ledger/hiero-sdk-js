import AccountId from "../account/AccountId.js";

/**
 * The id of an entity using a hook.
 */
class HookEntityId {
    /**
     *
     * @param {object} props
     * @param {AccountId} [props.accountId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }
    }

    /**
     * @param {AccountId} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId = accountId;
        return this;
    }

    /**
     *
     * @returns {AccountId | null}
     */
    get accountId() {
        return this._accountId;
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").proto.IHookEntityId}
     */
    _toProtobuf() {
        return {
            accountId:
                this._accountId != null ? this._accountId._toProtobuf() : null,
        };
    }

    /**
     *
     * @param {import("@hiero-ledger/proto").proto.IHookEntityId} hookEntityId
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
