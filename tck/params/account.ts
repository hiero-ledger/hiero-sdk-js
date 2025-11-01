import { AllowanceParams } from "./allowance";
import { BaseParams } from "./base";

export interface CreateAccountParams extends BaseParams {
    readonly key?: string;
    readonly initialBalance?: string;
    readonly receiverSignatureRequired?: boolean;
    readonly maxAutoTokenAssociations?: number;
    readonly commonTransactionParams?: Record<string, any>;
    readonly stakedAccountId?: string;
    readonly stakedNodeId?: string;
    readonly declineStakingReward?: boolean;
    readonly memo?: string;
    readonly autoRenewPeriod?: string;
    readonly alias?: string;
}

export interface UpdateAccountParams extends BaseParams {
    readonly accountId?: string;
    readonly key?: string;
    readonly autoRenewPeriod?: string;
    readonly expirationTime?: string;
    readonly receiverSignatureRequired?: boolean;
    readonly memo?: string;
    readonly maxAutoTokenAssociations?: number;
    readonly stakedAccountId?: string;
    readonly stakedNodeId?: string;
    readonly declineStakingReward?: boolean;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface DeleteAccountParams extends BaseParams {
    readonly deleteAccountId?: string;
    readonly transferAccountId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface AccountAllowanceApproveParams extends BaseParams {
    readonly allowances: AllowanceParams[];
    readonly commonTransactionParams?: Record<string, any>;
}
export interface DeleteAllowanceParams extends BaseParams {
    readonly allowances: RemoveAllowancesParams[];
    readonly commonTransactionParams?: Record<string, any>;
}

export interface RemoveAllowancesParams {
    readonly tokenId: string;
    readonly ownerAccountId: string;
    readonly serialNumbers?: string[];
}

export interface GetAccountBalanceParams extends BaseParams {
    readonly accountId?: string;
    readonly contractId?: string;
}
