export interface ExchangeRateResponse {
    readonly hbars: number;
    readonly cents: number;
    readonly expirationTime: string | null;
}

export interface TransactionReceiptResponse {
    readonly status: string;
    readonly accountId: string | null;
    readonly fileId: string | null;
    readonly contractId: string | null;
    readonly topicId: string | null;
    readonly tokenId: string | null;
    readonly scheduleId: string | null;
    readonly exchangeRate: ExchangeRateResponse | null;
    readonly topicSequenceNumber: string | null;
    readonly topicRunningHash: string | null;
    readonly totalSupply: string | null;
    readonly scheduledTransactionId: string | null;
    readonly serials: string[];
    readonly duplicates: TransactionReceiptResponse[];
    readonly children: TransactionReceiptResponse[];
    readonly nodeId: string | null;
}
