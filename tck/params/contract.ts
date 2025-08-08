export interface CreateContractParams {
    readonly adminKey?: string;
    readonly gas?: string;
    readonly initialBalance?: string;
    readonly initcode?: string;
    readonly bytecodeFileId?: string;
    readonly stakedId?: string;
    readonly declineStakingReward?: boolean;
    readonly autoRenewAccountId?: string;
    readonly autoRenewPeriod?: string;
    readonly automaticTokenAssociations?: boolean;
    readonly constructorParameters?: string;
    readonly memo?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
