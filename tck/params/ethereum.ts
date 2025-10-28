import { BaseParams } from "./base";

export interface EthereumTxParams extends BaseParams {
    readonly ethereumData?: any;
    readonly callDataFileId?: string;
    readonly maxGasAllowance?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
