export interface TopicResponse {
    readonly topicId?: string;
    readonly status: string;
}

export interface TopicInfoQueryResponse {
    readonly topicId?: string;
    readonly topicMemo?: string;
    readonly runningHash?: string;
    readonly sequenceNumber?: string;
    readonly expirationTime?: string;
    readonly adminKey?: string;
    readonly submitKey?: string;
    readonly feeScheduleKey?: string;
    readonly feeExemptKeys?: string[];
    readonly autoRenewPeriod?: string;
    readonly autoRenewAccountId?: string;
    readonly customFees?: any[];
    readonly ledgerId?: string;
    readonly cost?: string;
}
