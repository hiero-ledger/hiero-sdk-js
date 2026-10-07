export interface AccountResponse {
    readonly accountId?: string;
    readonly status: string;
}

export interface TokenRelationshipInfo {
    readonly tokenId: string;
    readonly symbol: string | null;
    readonly balance: string;
    readonly isKycGranted: boolean | null;
    readonly isFrozen: boolean | null;
    readonly automaticAssociation: boolean | null;
}

export interface HbarAllowanceResponse {
    readonly ownerAccountId: string | null;
    readonly spenderAccountId: string | null;
    readonly amount: string | null;
}

export interface TokenAllowanceResponse {
    readonly tokenId: string;
    readonly ownerAccountId: string | null;
    readonly spenderAccountId: string | null;
    readonly amount: string | null;
}

export interface TokenNftAllowanceResponse {
    readonly tokenId: string;
    readonly ownerAccountId: string | null;
    readonly spenderAccountId: string | null;
    readonly serialNumbers: string[] | null;
    readonly allSerials: boolean | null;
    readonly delegatingSpender: string | null;
}

export interface StakingInfoResponse {
    readonly declineStakingReward: boolean;
    readonly stakePeriodStart: string | null;
    readonly pendingReward: string | null;
    readonly stakedToMe: string | null;
    readonly stakedAccountId: string | null;
    readonly stakedNodeId: string | null;
}

export interface GetAccountInfoResponse {
    readonly accountId: string;
    readonly contractAccountId: string | null;
    readonly isDeleted: boolean;
    readonly proxyAccountId: string | null;
    readonly proxyReceived: string;
    readonly key: string | null;
    readonly balance: string;
    readonly sendRecordThreshold: string;
    readonly receiveRecordThreshold: string;
    readonly isReceiverSignatureRequired: boolean;
    readonly expirationTime: string;
    readonly autoRenewPeriod: string;
    readonly tokenRelationships: Record<string, TokenRelationshipInfo>;
    readonly accountMemo: string;
    readonly ownedNfts: string;
    readonly maxAutomaticTokenAssociations: string;
    readonly aliasKey: string | null;
    readonly ledgerId: string | null;
    readonly hbarAllowances: HbarAllowanceResponse[];
    readonly tokenAllowances: TokenAllowanceResponse[];
    readonly nftAllowances: TokenNftAllowanceResponse[];
    readonly ethereumNonce: string | null;
    readonly stakingInfo: StakingInfoResponse | null;
}

export interface GetMirrorNodeAccountBalanceResponse {
    readonly hbars: string;
}

export interface GetMirrorNodeTokenBalanceResponse {
    readonly tokenId: string;
    readonly balance: string;
    readonly decimals: number;
}

export interface ExecuteDeprecatedAccountBalanceQueryResponse {
    readonly constructionWarning: string | null;
    readonly executionError: string | null;
}
