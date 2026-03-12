export interface ContractResponse {
    readonly contractId?: string;
    readonly status: string;
}

export interface ContractCallQueryResponse {
    readonly contractId?: string;
    readonly evmAddress?: string;
    readonly errorMessage?: string;
    readonly gasUsed?: string;
    readonly gas?: string;
    readonly hbarAmount?: string;
    readonly senderAccountId?: string;
    readonly signerNonce?: string;
    readonly rawResult?: string;
}

export interface ContractByteCodeQueryResponse {
    readonly bytecode?: string;
    readonly contractId?: string;
}

export interface ContractInfoQueryResponse {
    readonly cost?: string;
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
