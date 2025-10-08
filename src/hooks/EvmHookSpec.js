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
         * @protected
         * @type {?import("../contract/ContractId.js").default}
         */
        this.contractId = null;

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
        this.contractId = contractId;
        return this;
    }

    /**
     *
     * @returns {import("../contract/ContractId.js").default | null}
     */
    getContractId() {
        return this.contractId;
    }

    /**
     *
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IEvmHookSpec}
     */
    _toProtobuf() {
        return {
            contractId: this.contractId?._toProtobuf(),
        };
    }
}

export default EvmHookSpec;
