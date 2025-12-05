export interface ContractResponse {
    readonly contractId?: string;
    readonly status: string;
}

export interface ContractInfoQueryResponse {
    readonly contractId?: string;
    readonly accountId?: string;
    readonly contractAccountId?: string;
    readonly adminKey?: string;
    readonly expirationTime?: string;
    readonly autoRenewPeriod?: string;
    readonly autoRenewAccountId?: string;
    readonly storage?: string;
    readonly contractMemo?: string;
    readonly balance?: string;
    readonly isDeleted?: boolean;
    readonly maxAutomaticTokenAssociations?: string;
    readonly ledgerId?: string;
    readonly stakingInfo?: {
        readonly declineStakingReward?: boolean;
        readonly stakePeriodStart?: string;
        readonly pendingReward?: string;
        readonly stakedToMe?: string;
        readonly stakedAccountId?: string;
        readonly stakedNodeId?: string;
    };
}
