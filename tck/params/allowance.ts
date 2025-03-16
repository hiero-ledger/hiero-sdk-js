export interface AllowanceParams {
    readonly ownerAccountId: string;
    readonly spenderAccountId: string;
    readonly hbar: HbarAllowanceParams;
    readonly token?: TokenAllowanceParams;
    readonly nft?: NftAllowanceParams;
}

export interface HbarAllowanceParams {
    readonly amount: string;
}

export interface TokenAllowanceParams {
    readonly tokenId: string;
    readonly amount: string;
}

export interface NftAllowanceParams {
    readonly tokenId: string;
    readonly serialNumbers?: string[];
    readonly approvedForAll?: boolean;
    readonly delegateSpenderAccountId?: string;
}
