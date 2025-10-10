/**
 * Shared specifications for an EVM hook. May be used for any extension point.
 */
class EvmHookSpec {
    /**
     *
     * @param {object} props
     * @param {import("../contract/ContractId.js").default} [props.contractId]
     */
    constructor(props = {}) {
        /**
         * @private
         * @type {?import("../contract/ContractId.js").default}
         */
        this._contractId = null;

        if (props.contractId != null) {
            this.setContractId(props.contractId);
        }
    }

    /**
     *
     * @param {import("../contract/ContractId.js").default} contractId
     * @returns {EvmHookSpec}
     */
    setContractId(contractId) {
        this._contractId = contractId;
        return this;
    }

    /**
     *
     * @returns {import("../contract/ContractId.js").default | null}
     */
    get contractId() {
        return this._contractId;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IEvmHookSpec}
     */
    _toProtobuf() {
        return {
            contractId: this._contractId?._toProtobuf(),
        };
    }
}

export default EvmHookSpec;
