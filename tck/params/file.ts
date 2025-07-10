export interface FileCreateParams {
    readonly keys: string[];
    readonly contents: string;
    readonly expirationTime: string;
    readonly memo: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface FileAppendParams {
    readonly fileId: string;
    readonly contents: string;
    readonly maxChunks: number;
    readonly chunkSize: number;
    readonly chunkInterval: number;
    readonly commonTransactionParams?: Record<string, any>;
}
