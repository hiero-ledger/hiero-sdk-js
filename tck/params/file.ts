import { BaseParams } from "./base";

export interface FileCreateParams extends BaseParams {
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface FileUpdateParams extends BaseParams {
    readonly fileId: string;
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
    readonly commonTransactionParams: Record<string, any>;
}

export interface FileAppendParams extends BaseParams {
    readonly fileId: string;
    readonly contents: string;
    readonly maxChunks: number;
    readonly chunkSize: number;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface FileDeleteParams extends BaseParams {
    readonly fileId: string;
    readonly commonTransactionParams?: Record<string, any>;
}
