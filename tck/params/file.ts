import { BaseParams, BaseTransactionParams } from "./base";

export interface FileCreateParams extends BaseTransactionParams {
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
}

export interface FileUpdateParams extends BaseTransactionParams {
    readonly fileId: string;
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
}

export interface FileAppendParams extends BaseTransactionParams {
    readonly fileId: string;
    readonly contents: string;
    readonly maxChunks: number;
    readonly chunkSize: number;
}

export interface FileDeleteParams extends BaseTransactionParams {
    readonly fileId: string;
}

export interface GetFileInfoParams extends BaseParams {
    readonly fileId?: string;
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
    readonly getCost?: boolean;
}

export interface GetFileContentsParams extends BaseParams {
    readonly fileId: string;
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
}
