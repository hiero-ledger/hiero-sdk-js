import {
    FileCreateTransaction,
    FileId,
    FileUpdateTransaction,
} from "@hashgraph/sdk";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import { sdk } from "../sdk_data";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { FileResponse } from "../response/file";
import { getKeyFromString } from "../utils/key";

export const createFile = async ({
    keys,
    contents,
    expirationTime,
    memo,
    commonTransactionParams,
}: any): Promise<FileResponse> => {
    const transaction = new FileCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (keys.length > 0) {
        transaction.setKeys(keys.map((key: string) => getKeyFromString(key)));
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(expirationTime);
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
        fileId: receipt.fileId.toString(),
        status: receipt.status.toString(),
    };
};

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
        transaction.setFileId(FileId.fromString(fileId));
    }

    if (keys.length > 0) {
        transaction.setKeys(keys.map((key: string) => getKeyFromString(key)));
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (expirationTime != null) {
        transaction.setExpirationTime(expirationTime);
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

    console.log(receipt.fileId);

    return {
        //TODO Maybe we don`t need this
        // fileId: receipt.fileId.toString(),
        status: receipt.status.toString(),
    };
};
