export interface AccountResponse {
    readonly accountId?: string;
    readonly status: string;
}

export interface GetAccountBalanceResponse {
    readonly balance: string;
}
