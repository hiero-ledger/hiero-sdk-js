import { BaseParams } from "./base";

/**
 * HIP-1261 fee estimation modes.
 * - STATE: estimate using the transaction plus the mirror node's latest known state.
 * - INTRINSIC: estimate from the payload alone (default per the spec).
 */
export type FeeEstimateModeName = "STATE" | "INTRINSIC";

/**
 * Transaction types supported by the TCK fee-estimate endpoint.
 * v1 covers the JS SDK PR #3478 scenarios plus a couple of common types.
 */
export type FeeEstimateTransactionType =
    | "AccountCreate"
    | "TransferCrypto"
    | "TokenCreate"
    | "TokenMint"
    | "TopicCreate"
    | "TopicMessageSubmit"
    | "ContractCreate"
    | "FileCreate"
    | "FileAppend";

export interface ExecuteFeeEstimateQueryParams extends BaseParams {
    readonly mode?: FeeEstimateModeName;
    readonly highVolumeThrottle?: number;
    readonly transactionType: FeeEstimateTransactionType;
    readonly transactionParams?: Record<string, any>;
}
