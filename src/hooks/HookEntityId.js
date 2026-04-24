import AccountId from "../account/AccountId.js";
import ContractId from "../contract/ContractId.js";

/**
 * The id of an entity using a hook.
 */
class HookEntityId {
    /**
     *
     * @param {object} props
     * @param {AccountId} [props.accountId]
     * @param {ContractId} [props.contractId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?AccountId}
         */
        this._accountId = null;

        /**
         * @private
         * @type {?ContractId}
         */
        this._contractId = null;

        if (props.accountId != null) {
            this.setAccountId(props.accountId);
        }

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     * @param {AccountId} accountId
     * @returns {this}
     */
    setAccountId(accountId) {
        this._accountId = accountId;
        this._contractId = null;
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
     * @param {ContractId} contractId
     * @returns {this}
     */
    setContractId(contractId) {
        this._contractId = contractId;
        this._accountId = null;
        return this;
    }

    /**
     *
     * @returns {ContractId | null}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     *
     * @returns {import("@hiero-ledger/proto").proto.IHookEntityId}
     */
    _toProtobuf() {
        return {
            accountId:
                this._accountId != null ? this._accountId._toProtobuf() : null,
            contractId:
                this._contractId != null
                    ? this._contractId._toProtobuf()
                    : null,
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
            contractId:
                hookEntityId.contractId != null
                    ? ContractId._fromProtobuf(hookEntityId.contractId)
                    : undefined,
        });
    }
}

export default HookEntityId;
