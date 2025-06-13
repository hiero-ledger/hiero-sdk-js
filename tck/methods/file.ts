import { FileCreateTransaction, PrivateKey } from "@hashgraph/sdk";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import { sdk } from "../sdk_data";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { FileResponse } from "../response/file";
import { getKeyFromString } from "../utils/key";

export const createFile = async ({
    keys,
    contents,
    expirationTime,
    fileMemo,
    commonTransactionParams,
}: any): Promise<FileResponse> => {
    const transaction = new FileCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (keys.length > 0) {
        transaction.setKeys(
            keys.map((key: string) => PrivateKey.fromStringECDSA(key)),
        );
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(expirationTime);
    }

    if (fileMemo != null) {
        transaction.setFileMemo(fileMemo);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    const response = await transaction.execute(sdk.getClient());
    const receipt = await response.getReceipt(sdk.getClient());

    console.log("receipt", receipt.fileId.toString());

    return {
        fileId: receipt.fileId.toString(),
        status: receipt.status.toString(),
    };
};
