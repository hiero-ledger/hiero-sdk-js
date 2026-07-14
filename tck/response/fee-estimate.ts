/**
 * Response types for the HIP-1261 fee estimation endpoint.
 *
 * All tinycent values are stringified Long values to preserve precision,
 * matching the existing TCK convention for balances/supplies.
 */

export interface FeeExtraResponse {
    readonly name: string;
    readonly included: number;
    readonly count: number;
    readonly charged: number;
    readonly feePerUnit: string;
    readonly subtotal: string;
}

export interface FeeEstimateComponentResponse {
    readonly base: string;
    readonly extras: FeeExtraResponse[];
}

export interface NetworkFeeResponse {
    readonly multiplier: number;
    readonly subtotal: string;
}

export interface FeeEstimateQueryResponse {
    readonly highVolumeMultiplier: string;
    readonly networkFee: NetworkFeeResponse;
    readonly nodeFee: FeeEstimateComponentResponse;
    readonly serviceFee: FeeEstimateComponentResponse;
    readonly total: string;
}
