import { FileCreateTransaction, Timestamp } from "@hashgraph/sdk";
import Long from "long";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import { FileCreateParams } from "../params/file";

import { sdk } from "../sdk_data";
import { FileResponse } from "../response/file";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { getKeyFromString } from "../utils/key";

export const createFile = async ({
    keys,
    contents,
    expirationTime,
    memo,
    commonTransactionParams,
}: FileCreateParams): Promise<FileResponse> => {
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
        fileId: receipt.fileId.toString(),
        status: receipt.status.toString(),
    };
};
