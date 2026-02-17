export interface FileResponse {
    readonly fileId?: string;
    readonly status: string;
}

export interface FileInfoQueryResponse {
    readonly fileId?: string;
    readonly size?: string;
    readonly expirationTime?: string;
    readonly isDeleted?: boolean;
    readonly keys?: string[];
    readonly memo?: string;
    readonly ledgerId?: string;
    readonly cost?: string;
}

export interface FileContentsResponse {
    readonly contents: string;
}
