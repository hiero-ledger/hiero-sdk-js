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
