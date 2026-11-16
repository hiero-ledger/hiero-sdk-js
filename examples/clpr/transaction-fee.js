// SPDX-License-Identifier: Apache-2.0

import { Hbar } from "@hiero-ledger/sdk";

/**
 * The lifecycle fee schedule is provisional; require the caller's spending cap.
 * @param {string | undefined} tinybars
 * @returns {Hbar}
 */
export function transactionFee(tinybars) {
    if (
        typeof tinybars !== "string" ||
        !/^\d+$/.test(tinybars) ||
        BigInt(tinybars) === 0n ||
        BigInt(tinybars) > 9223372036854775807n
    ) {
        throw new Error(
            "CLPR_MAX_TRANSACTION_FEE_TINYBARS must be a positive signed 64-bit tinybar amount.",
        );
    }
    return Hbar.fromTinybars(tinybars);
}
