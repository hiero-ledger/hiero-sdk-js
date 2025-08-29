export interface ScheduleCreateParams {
    readonly scheduledTransaction?: ScheduledTransaction;
    readonly memo?: string;
    readonly adminKey?: string;
    readonly payerAccountId?: string;
    readonly expirationTime?: string;
    readonly waitForExpiry?: boolean;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface ScheduledTransaction {
    readonly method: string;
    readonly params: any;
}
