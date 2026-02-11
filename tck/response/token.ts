export interface TokenResponse {
    readonly tokenId?: string;
    readonly status: string;
}

export interface TokenMintResponse {
    readonly tokenId?: string;
    readonly newTotalSupply?: string;
    readonly serialNumbers?: string[];
    readonly status: string;
}

export interface TokenBurnResponse {
    readonly tokenId?: string;
    readonly newTotalSupply?: string;
    readonly status: string;
}

export interface TokenInfoQueryResponse {
    readonly tokenId?: string;
    readonly name?: string;
    readonly symbol?: string;
    readonly decimals?: number;
    readonly totalSupply?: string;
    readonly treasuryAccountId?: string;
    readonly adminKey?: string;
    readonly kycKey?: string;
    readonly freezeKey?: string;
    readonly pauseKey?: string;
    readonly wipeKey?: string;
    readonly supplyKey?: string;
    readonly feeScheduleKey?: string;
    readonly metadataKey?: string;
    readonly defaultFreezeStatus?: boolean | null;
    readonly defaultKycStatus?: boolean | null;
    readonly pauseStatus?: string;
    readonly isDeleted?: boolean;
    readonly autoRenewAccountId?: string;
    readonly autoRenewPeriod?: string;
    readonly expirationTime?: string;
    readonly tokenMemo?: string;
    readonly customFees?: any[];
    readonly tokenType?: string;
    readonly supplyType?: string;
    readonly maxSupply?: string;
    readonly metadata?: string;
    readonly ledgerId?: string;
    readonly cost?: string;
}

export interface TokenNftInfoQueryResponse {
    readonly nftId?: string;
    readonly accountId?: string;
    readonly creationTime?: string;
    readonly metadata?: string;
    readonly ledgerId?: string;
    readonly spenderId?: string | null;
    readonly cost?: string;
}
