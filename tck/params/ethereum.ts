import { BaseTransactionParams } from "./base";

export interface EthereumTxParams extends BaseTransactionParams {
    readonly ethereumData?: any;
    readonly callDataFileId?: string;
    readonly maxGasAllowance?: string;
}
