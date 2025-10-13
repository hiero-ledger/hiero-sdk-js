import { EthereumTransaction, Hbar, FileId } from "@hashgraph/sdk";

import { sdk } from "../sdk_data";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { EthereumTxParams } from "../params/ethereum";
import { EthereumResponse } from "../response/ethereum";

interface CommonTransactionParams {
    readonly transactionId?: string;
    readonly maxTransactionFee?: number;
    readonly validTransactionDuration?: number;
    readonly memo?: string;
    readonly regenerateTransactionId?: boolean;
    readonly signers?: string[];
}

export const createEthereumTransaction = async ({
    ethereumData,
    callDataFileId,
    maxGasAllowance,
    commonTransactionParams,
}: EthereumTxParams): Promise<EthereumResponse> => {
    const transaction = new EthereumTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (ethereumData != null) {
        transaction.setEthereumData(Buffer.from(ethereumData.data));
    }

    if (callDataFileId != null) {
        transaction.setCallDataFileId(FileId.fromString(callDataFileId));
    }

    if (maxGasAllowance != null) {
        transaction.setMaxGasAllowanceHbar(Hbar.fromTinybars(maxGasAllowance));
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
        contractId: receipt.contractId?.toString(),
    };
};
