import { BaseParams, BaseTransactionParams } from "./base";

export interface CreateContractParams extends BaseTransactionParams {
    readonly adminKey?: string;
    readonly gas?: string;
    readonly initialBalance?: string;
    readonly initcode?: string;
    readonly bytecodeFileId?: string;
    readonly stakedAccountId?: string;
    readonly stakedNodeId?: string;
    readonly declineStakingReward?: boolean;
    readonly autoRenewAccountId?: string;
    readonly autoRenewPeriod?: string;
    readonly automaticTokenAssociations?: boolean;
    readonly constructorParameters?: string;
    readonly memo?: string;
    readonly maxAutomaticTokenAssociations?: number;
}

export interface UpdateContractParams extends BaseTransactionParams {
    readonly contractId: string;
    readonly adminKey?: string;
    readonly stakedAccountId?: string;
    readonly stakedNodeId?: string;
    readonly declineStakingReward?: boolean;
    readonly autoRenewAccountId?: string;
    readonly autoRenewPeriod?: string;
    readonly memo?: string;
    readonly maxAutomaticTokenAssociations?: number;
    readonly expirationTime?: string;
}

export interface DeleteContractParams extends BaseTransactionParams {
    readonly contractId: string;
    readonly transferAccountId?: string;
    readonly transferContractId?: string;
    readonly permanentRemoval?: boolean;
}

export interface ExecuteContractParams extends BaseTransactionParams {
    readonly contractId: string;
    readonly gas?: string;
    readonly amount?: string;
    readonly functionParameters?: string;
}

export interface ContractCallQueryParams extends BaseParams {
    readonly contractId?: string;
    readonly gas?: string;
    readonly functionName?: string;
    readonly functionParameters?: string;
    readonly maxQueryPayment?: string;
    readonly senderAccountId?: string;
}
