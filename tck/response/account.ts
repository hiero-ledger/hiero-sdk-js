export interface AccountResponse {
    readonly accountId?: string;
    readonly status: string;
}

export interface LiveHashResponse {
    readonly accountId: string;
    readonly hash: string;
    readonly keys: string[];
    readonly duration: string;
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
    readonly liveHashes: LiveHashResponse[];
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

type TokenId = string;
type TokenBalance = string;
type TokenDecimals = string;

export interface GetAccountBalanceResponse {
    readonly hbars: string;
    readonly tokenBalances: Record<TokenId, TokenBalance>;
    readonly tokenDecimals: Record<TokenId, TokenDecimals>;
}
