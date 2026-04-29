import {
    AccountId,
    Client,
    FeeEstimateMode,
    FeeEstimateQuery,
    Hbar,
    Logger,
    LogLevel,
    PrivateKey,
    TransferTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * HIP-1261 — Fee Estimation Query API
 *
 * Demonstrates three scenarios from the HIP-1261 design doc, run sequentially:
 *   1. Estimating fees for a TransferTransaction in STATE mode and printing
 *      the network / node / service breakdown.
 *   2. Comparing STATE vs INTRINSIC totals for the same transaction.
 *   3. Using the optional high-volume throttle setter (HIP-1313).
 */
async function main() {
    /**
     * Step 1: Create Client
     */
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK)
        .setOperator(operatorId, operatorKey)
        .setLogger(new Logger(LogLevel.Silent));

    try {
        // ---------------------------------------------------------------
        // Scenario 1: Estimate fees for a TransferTransaction in STATE
        // mode and print the network / node / service breakdown.
        // ---------------------------------------------------------------

        console.log("\n--- Scenario 1: STATE mode estimate (with breakdown) ---");

        // Step 1.1: Build the transaction. The query auto-freezes if needed,
        // so freezing here is optional.
        const transferForBreakdown = new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-1))
            .addHbarTransfer(operatorId, new Hbar(1));

        // Step 1.2: Estimate fees with STATE mode.
        const stateBreakdownEstimate = await new FeeEstimateQuery()
            .setMode(FeeEstimateMode.STATE)
            .setTransaction(transferForBreakdown)
            .execute(client);

        // Step 1.3: Display the fee breakdown. Each component is base + the
        // sum of its extras' subtotals.
        const nodeSubtotalScenario1 =
            stateBreakdownEstimate.nodeFee.base.toNumber() +
            stateBreakdownEstimate.nodeFee.extras.reduce(
                (sum, extra) => sum + extra.subtotal.toNumber(),
                0,
            );

        const serviceSubtotalScenario1 =
            stateBreakdownEstimate.serviceFee.base.toNumber() +
            stateBreakdownEstimate.serviceFee.extras.reduce(
                (sum, extra) => sum + extra.subtotal.toNumber(),
                0,
            );

        console.log({
            network: stateBreakdownEstimate.networkFee.subtotal.toString(),
            node: nodeSubtotalScenario1.toString(),
            service: serviceSubtotalScenario1.toString(),
            total: stateBreakdownEstimate.total.toString(),
        });

        // ---------------------------------------------------------------
        // Scenario 2: Compare INTRINSIC vs STATE estimates for the same
        // transaction. INTRINSIC ignores state-dependent costs and is
        // typically a lower bound; STATE includes them.
        // ---------------------------------------------------------------

        console.log("\n--- Scenario 2: INTRINSIC vs STATE comparison ---");

        // Step 2.1: Build the transaction (no signing required for INTRINSIC).
        const transferForComparison = new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-100))
            .addHbarTransfer(operatorId, new Hbar(100));

        // Step 2.2: Estimate with INTRINSIC mode (the default per HIP-1261).
        const intrinsicEstimate = await new FeeEstimateQuery()
            .setMode(FeeEstimateMode.INTRINSIC)
            .setTransaction(transferForComparison)
            .execute(client);

        // Step 2.3: Estimate the same transaction with STATE mode.
        const stateEstimate = await new FeeEstimateQuery()
            .setMode(FeeEstimateMode.STATE)
            .setTransaction(transferForComparison)
            .execute(client);

        // Step 2.4: Print both totals and the delta.
        const intrinsicTotal = intrinsicEstimate.total.toNumber();
        const stateTotal = stateEstimate.total.toNumber();

        console.log({
            intrinsic: intrinsicTotal.toString(),
            state: stateTotal.toString(),
            difference: (stateTotal - intrinsicTotal).toString(),
        });

        // ---------------------------------------------------------------
        // Scenario 3: Estimate fees with the optional high-volume throttle
        // setter (HIP-1261 + HIP-1313). The throttle is in basis points
        // (0–10000, where 10000 = 100%). The mirror node returns a
        // `highVolumeMultiplier` reflecting any high-volume pricing.
        // ---------------------------------------------------------------

        console.log("\n--- Scenario 3: High-volume throttle estimate ---");

        // Step 3.1: Build the transaction.
        const transferForThrottle = new TransferTransaction()
            .addHbarTransfer(operatorId, new Hbar(-1))
            .addHbarTransfer(operatorId, new Hbar(1));

        // Step 3.2: Set throttle to 5000 (= 50%) and execute.
        const throttledEstimate = await new FeeEstimateQuery()
            .setMode(FeeEstimateMode.STATE)
            .setHighVolumeThrottle(5000)
            .setTransaction(transferForThrottle)
            .execute(client);

        // Step 3.3: Print the high-volume multiplier and the total.
        console.log({
            highVolumeMultiplier:
                throttledEstimate.highVolumeMultiplier.toString(),
            total: throttledEstimate.total.toString(),
        });
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
