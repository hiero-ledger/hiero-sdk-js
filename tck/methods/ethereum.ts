import { EthereumTransaction, Hbar, FileId } from "@hiero-ledger/sdk";

import { sdk } from "../sdk_data";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import { EthereumTxParams } from "../params/ethereum";
import { EthereumResponse } from "../response/ethereum";
import { decode } from "../utils/hex";

export const createEthereumTransaction = async ({
    ethereumData,
    callDataFileId,
    maxGasAllowance,
    commonTransactionParams,
    sessionId,
}: EthereumTxParams): Promise<EthereumResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new EthereumTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (ethereumData != null) {
        transaction.setEthereumData(decode(ethereumData));
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
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
        contractId: receipt.contractId?.toString(),
    };
};
