import { BaseParams, BaseTransactionParams } from "./base";

export interface ScheduleCreateParams extends BaseTransactionParams {
    readonly scheduledTransaction?: ScheduledTransaction;
    readonly memo?: string;
    readonly adminKey?: string;
    readonly payerAccountId?: string;
    readonly expirationTime?: string;
    readonly waitForExpiry?: boolean;
}

export interface ScheduledTransaction {
    readonly method: string;
    readonly params: any;
}

export interface ScheduleSignParams extends BaseTransactionParams {
    readonly scheduleId?: string;
}

export interface ScheduleDeleteParams extends BaseTransactionParams {
    readonly scheduleId?: string;
}

export interface GetScheduleInfoParams extends BaseParams {
    readonly scheduleId?: string;
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
    readonly getCost?: boolean;
}
