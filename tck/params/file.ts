export interface FileCreateParams {
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface FileUpdateParams {
    readonly fileId: string;
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
    readonly commonTransactionParams: Record<string, any>;
}

export interface FileAppendParams {
    readonly fileId: string;
    readonly contents: string;
    readonly maxChunks: number;
    readonly chunkSize: number;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface FileDeleteParams {
    readonly fileId: string;
    readonly commonTransactionParams?: Record<string, any>;
}
