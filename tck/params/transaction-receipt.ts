import { BaseParams } from "./base";

export interface GetTransactionReceiptParams extends BaseParams {
    readonly transactionId?: string;
    readonly includeDuplicates?: boolean;
    readonly includeChildren?: boolean;
    readonly validateStatus?: boolean;
}
