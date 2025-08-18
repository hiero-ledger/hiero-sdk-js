export interface CreateContractParams {
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
    readonly commonTransactionParams?: Record<string, any>;
}

export interface UpdateContractParams {
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
    readonly commonTransactionParams?: Record<string, any>;
}

export interface DeleteContractParams {
    readonly contractId: string;
    readonly transferAccountId?: string;
    readonly transferContractId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
