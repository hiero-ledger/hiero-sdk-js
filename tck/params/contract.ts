export interface CreateContractParams {
    readonly adminKey?: string;
    readonly gas?: string;
    readonly initialBalance?: string;
    readonly bytecode?: string;
    readonly bytecodeFileId?: string;
    readonly stakedId?: string;
    readonly declineReward?: boolean;
    readonly autoRenewAccountId?: string;
    readonly autoRenewPeriod?: string;
    readonly automaticTokenAssociations?: boolean;
    readonly constructorParameters?: string;
    readonly memo?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
