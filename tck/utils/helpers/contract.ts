import { ContractFunctionResult } from "@hiero-ledger/sdk";
import { ContractCallQueryResponse } from "../../response/contract";

/**
 * Builds a ContractCallQueryResponse from a ContractFunctionResult.
 */
export const buildContractCallQueryResponse = (
    result: ContractFunctionResult,
): ContractCallQueryResponse => {
    return {
        contractId: result.contractId?.toString(),
        evmAddress: result.evmAddress
            ? Buffer.from(result.evmAddress).toString("hex")
            : undefined,
        errorMessage: result.errorMessage || undefined,
        gasUsed: result.gasUsed?.toString(),
        gas: result.gas?.toString(),
        hbarAmount: result.amount?.toString(),
        senderAccountId: result.senderAccountId?.toString(),
        signerNonce: result.signerNonce?.toString(),
        rawResult: Buffer.from(result.asBytes()).toString("hex"),
    };
};
