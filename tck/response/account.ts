export interface AccountResponse {
    readonly accountId?: string;
    readonly status: string;
}

export interface GetAccountBalanceResponse {
    readonly hbars: string;
    readonly tokenBalances: Record<string, string>;
    readonly tokenDecimals: Record<string, string>;
}
