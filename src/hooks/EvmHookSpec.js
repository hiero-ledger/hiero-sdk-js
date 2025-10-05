class EvmHookSpec {
    /**
     *
     * @param {object} props
     * @param {import("../contract/ContractId.js").default} [props.contractId]
     */
    constructor(props = {}) {
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
     * @returns {import("@hashgraph/proto").com.hedera.hapi.node.hooks.IEvmHookSpec}
     */
    toProtobuf() {
        return {
            contractId: this.contractId?._toProtobuf(),
        };
    }
}

export default EvmHookSpec;
