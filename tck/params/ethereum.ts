export interface EthereumTxParams {
    readonly ethereumData?: any;
    readonly callDataFileId?: string;
    readonly maxGasAllowance?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
