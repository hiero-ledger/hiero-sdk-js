export interface ContractResponse {
    readonly contractId?: string;
    readonly status: string;
}

export interface ContractCallQueryResponse {
    readonly bytes?: string;
    readonly contractId?: string;
    readonly gasUsed?: string;
    readonly errorMessage?: string;
    // Return value types
    readonly string?: string;
    readonly bool?: boolean;
    readonly address?: string;
    readonly bytes32?: string;
    // Integer types
    readonly int8?: string;
    readonly uint8?: string;
    readonly int16?: string;
    readonly uint16?: string;
    readonly int24?: string;
    readonly uint24?: string;
    readonly int32?: string;
    readonly uint32?: string;
    readonly int40?: string;
    readonly uint40?: string;
    readonly int48?: string;
    readonly uint48?: string;
    readonly int56?: string;
    readonly uint56?: string;
    readonly int64?: string;
    readonly uint64?: string;
    readonly int256?: string;
    readonly uint256?: string;
}

export interface ContractByteCodeQueryResponse {
    readonly bytecode?: string;
    readonly contractId?: string;
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
