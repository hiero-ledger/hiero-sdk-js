export interface AccountResponse {
    readonly accountId?: string;
    readonly status: string;
}

type TokenId = string;
type TokenBalance = string;
type TokenDecimals = string;

export interface GetAccountBalanceResponse {
    readonly hbars: string;
    readonly tokenBalances: Record<TokenId, TokenBalance>;
    readonly tokenDecimals: Record<TokenId, TokenDecimals>;
}
