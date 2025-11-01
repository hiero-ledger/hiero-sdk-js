import { BaseParams } from "./base";

export interface ScheduleCreateParams extends BaseParams {
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

export interface ScheduleSignParams extends BaseParams {
    readonly scheduleId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface ScheduleDeleteParams extends BaseParams {
    readonly scheduleId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
