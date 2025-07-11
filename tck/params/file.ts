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
