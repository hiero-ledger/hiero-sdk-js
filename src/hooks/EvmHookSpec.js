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

    toProtobuf() {
        return {
            contract_id:
                this.contractId != null ? this.contractId._toProtobuf() : null,
        };
    }
}

export default EvmHookSpec;
