import { BaseParams } from "./base";

export interface TopicCreateParams extends BaseParams {
    readonly memo?: string;
    readonly adminKey?: string;
    readonly submitKey?: string;
    readonly autoRenewPeriod: string;
    readonly autoRenewAccountId?: string;
    readonly feeScheduleKey?: string;
    readonly feeExemptKeys?: string[];
    readonly customFees?: CustomFee[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface TopicUpdateParams extends BaseParams {
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
    readonly commonTransactionParams?: Record<string, any>;
}

export interface TopicDeleteParams extends BaseParams {
    readonly topicId: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface TopicSubmitMessageParams extends BaseParams {
    readonly topicId: string;
    readonly message: string;
    readonly maxChunks?: number;
    readonly chunkSize?: number;
    readonly customFeeLimits?: CustomFeeLimit[];
    readonly commonTransactionParams?: Record<string, any>;
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
