export interface ContractResponse {
    readonly contractId?: string;
    readonly status: string;
}

export interface ContractByteCodeQueryResponse {
    readonly bytecode?: string;
    readonly contractId?: string;
}
