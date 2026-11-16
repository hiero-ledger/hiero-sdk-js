// SPDX-License-Identifier: Apache-2.0

import { Hbar } from "@hiero-ledger/sdk";

/**
 * Raises the client's default fee cap when CLPR_MAX_TRANSACTION_FEE_TINYBARS is
 * set. Leave it unset to keep the SDK default; set it only when the target
 * network's CLPR fee schedule needs a higher cap.
 * @param {import("@hiero-ledger/sdk").Client} client
 * @returns {void}
 */
export function applyMaxTransactionFee(client) {
    const tinybars = process.env.CLPR_MAX_TRANSACTION_FEE_TINYBARS;
    if (!tinybars) {
        return;
    }
    if (
        !/^\d+$/.test(tinybars) ||
        BigInt(tinybars) === 0n ||
        BigInt(tinybars) > 9223372036854775807n
    ) {
        throw new Error(
            "CLPR_MAX_TRANSACTION_FEE_TINYBARS must be a positive signed 64-bit tinybar amount.",
        );
    }
    client.setDefaultMaxTransactionFee(Hbar.fromTinybars(tinybars));
}
