import { FileUpdateTransaction, Timestamp } from "@hashgraph/sdk";
import Long from "long";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import { FileResponse } from "../response/file";
import { sdk } from "../sdk_data";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { getKeyFromString } from "../utils/key";

export const updateFile = async ({
    fileId,
    keys,
    contents,
    expirationTime,
    memo,
    commonTransactionParams,
}: any): Promise<FileResponse> => {
    const transaction = new FileUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (fileId != null) {
        transaction.setFileId(fileId);
    }

    if (keys != null) {
        transaction.setKeys(keys.map((key: string) => getKeyFromString(key)));
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(
            new Timestamp(Long.fromString(expirationTime), 0),
        );
    }

    if (memo != null) {
        transaction.setFileMemo(memo);
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

    return {
        status: receipt.status.toString(),
    };
};
