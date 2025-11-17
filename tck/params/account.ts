import { AllowanceParams } from "./allowance";
import { BaseParams, BaseTransactionParams } from "./base";

export interface CreateAccountParams extends BaseTransactionParams {
    readonly key?: string;
    readonly initialBalance?: string;
    readonly receiverSignatureRequired?: boolean;
    readonly maxAutoTokenAssociations?: number;
    readonly stakedAccountId?: string;
    readonly stakedNodeId?: string;
    readonly declineStakingReward?: boolean;
    readonly memo?: string;
    readonly autoRenewPeriod?: string;
    readonly alias?: string;
}

export interface UpdateAccountParams extends BaseTransactionParams {
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
}

export interface DeleteAccountParams extends BaseTransactionParams {
    readonly deleteAccountId?: string;
    readonly transferAccountId?: string;
}

export interface AccountAllowanceApproveParams extends BaseTransactionParams {
    readonly allowances: AllowanceParams[];
}
export interface DeleteAllowanceParams extends BaseTransactionParams {
    readonly allowances: RemoveAllowancesParams[];
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

export interface GetAccountInfoParams extends BaseParams {
    readonly accountId?: string;
}
