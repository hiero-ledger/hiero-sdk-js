import { BaseParams, BaseTransactionParams } from "./base";

export interface TopicCreateParams extends BaseTransactionParams {
    readonly memo?: string;
    readonly adminKey?: string;
    readonly submitKey?: string;
    readonly autoRenewPeriod: string;
    readonly autoRenewAccountId?: string;
    readonly feeScheduleKey?: string;
    readonly feeExemptKeys?: string[];
    readonly customFees?: CustomFee[];
}

export interface TopicUpdateParams extends BaseTransactionParams {
    readonly topicId: string;
    readonly memo?: string;
    readonly adminKey?: string;
    readonly submitKey?: string;
    readonly autoRenewPeriod: string;
    readonly autoRenewAccountId?: string;
    readonly expirationTime?: string;
    readonly feeScheduleKey?: string;
    readonly feeExemptKeys?: string[];
    readonly customFees?: CustomFee[];
}

export interface TopicDeleteParams extends BaseTransactionParams {
    readonly topicId: string;
}

export interface TopicSubmitMessageParams extends BaseTransactionParams {
    readonly topicId: string;
    readonly message: string;
    readonly maxChunks?: number;
    readonly chunkSize?: number;
    readonly customFeeLimits?: CustomFeeLimit[];
}

export interface CustomFee {
    readonly feeCollectorAccountId: string;
    readonly feeCollectorsExempt: boolean;
    readonly fixedFee: FixedFee;
}

export interface CustomFeeLimit {
    readonly payerId: string;
    readonly fixedFees: FixedFee[];
}

export interface FixedFee {
    readonly amount: string;
    readonly denominatingTokenId?: string;
}

export interface GetTopicInfoParams extends BaseParams {
    readonly topicId?: string;
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
    readonly getCost?: boolean;
}
