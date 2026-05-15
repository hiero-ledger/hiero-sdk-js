// SPDX-License-Identifier: Apache-2.0

/**
 * The mode of fee estimation per HIP-1261.
 *
 * - STATE: estimate using the transaction plus the mirror node's latest known
 *   state (alias mappings, token associations, custom fees, hooks, etc.).
 *   Produces the most realistic preview.
 * - INTRINSIC: estimate from the payload alone (bytes, signatures, declared keys,
 *   gas), ignoring any state-dependent costs. Default per the spec.
 */
const FeeEstimateMode = Object.freeze({
    STATE: 0,
    INTRINSIC: 1,
});

export default FeeEstimateMode;
