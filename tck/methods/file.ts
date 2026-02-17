import {
    FileCreateTransaction,
    FileAppendTransaction,
    FileUpdateTransaction,
    FileDeleteTransaction,
    FileInfoQuery,
    Hbar,
    Timestamp,
    FileContentsQuery,
} from "@hiero-ledger/sdk";
import Long from "long";

import { applyCommonTransactionParams } from "../params/common-tx-params";
import {
    FileCreateParams,
    FileAppendParams,
    FileDeleteParams,
    GetFileInfoParams,
    GetFileContentsParams,
} from "../params/file";

import { sdk } from "../sdk_data";
import {
    FileInfoQueryResponse,
    FileResponse,
    FileContentsResponse,
} from "../response/file";

import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { mapFileInfoResponse } from "../utils/helpers/file";
import { getKeyFromString } from "../utils/key";

export const createFile = async ({
    keys,
    contents,
    expirationTime,
    memo,
    commonTransactionParams,
    sessionId,
}: FileCreateParams): Promise<FileResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new FileCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (keys?.length && keys.length > 0) {
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
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

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
    sessionId,
}: any): Promise<FileResponse> => {
    const client = sdk.getClient(sessionId);
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
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const appendFile = async ({
    fileId,
    contents,
    maxChunks,
    chunkSize,
    commonTransactionParams,
    sessionId,
}: FileAppendParams): Promise<FileResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new FileAppendTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (fileId != null) {
        transaction.setFileId(fileId);
    }

    if (contents != null) {
        transaction.setContents(contents);
    }

    if (maxChunks != null) {
        transaction.setMaxChunks(maxChunks);
    }

    if (chunkSize != null) {
        transaction.setChunkSize(chunkSize);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const deleteFile = async ({
    fileId,
    commonTransactionParams,
    sessionId,
}: FileDeleteParams): Promise<FileResponse> => {
    const client = sdk.getClient(sessionId);
    const transaction = new FileDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (fileId != null) {
        transaction.setFileId(fileId);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            client,
        );
    }

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const getFileInfo = async ({
    fileId,
    queryPayment,
    maxQueryPayment,
    getCost,
    sessionId,
}: GetFileInfoParams): Promise<FileInfoQueryResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new FileInfoQuery().setGrpcDeadline(DEFAULT_GRPC_DEADLINE);

    if (fileId != null) {
        query.setFileId(fileId);
    }

    if (queryPayment != null) {
        query.setQueryPayment(Hbar.fromTinybars(queryPayment));
    }

    if (maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(maxQueryPayment));
    }

    if (getCost) {
        const cost = await query.getCost(client);

        return {
            cost: cost.toTinybars().toString(),
        };
    }

    const response = await query.execute(client);

    return mapFileInfoResponse(response);
};

export const getFileContents = async ({
    fileId,
    queryPayment,
    maxQueryPayment,
    sessionId,
}: GetFileContentsParams): Promise<FileContentsResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new FileContentsQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (fileId != null) {
        query.setFileId(fileId);
    }

    if (queryPayment != null) {
        query.setQueryPayment(Hbar.fromTinybars(queryPayment));
    }

    if (maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(maxQueryPayment));
    }

    const response = await query.execute(client);

    // Convert Uint8Array to string
    // Using TextDecoder to properly handle all byte sequences
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const contents = decoder.decode(response);

    return {
        contents,
    };
};
