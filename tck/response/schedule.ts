export interface ScheduleResponse {
    readonly scheduleId?: string;
    readonly transactionId?: string;
    readonly status: string;
}

export interface ScheduleInfoQueryResponse {
    readonly scheduleId?: string;
    readonly creatorAccountId?: string;
    readonly payerAccountId?: string;
    readonly adminKey?: string;
    readonly signers?: string[];
    readonly scheduleMemo?: string;
    readonly expirationTime?: string;
    readonly executed?: string;
    readonly deleted?: string;
    readonly scheduledTransactionId?: string;
    readonly waitForExpiry?: boolean;
    readonly cost?: string;
}
