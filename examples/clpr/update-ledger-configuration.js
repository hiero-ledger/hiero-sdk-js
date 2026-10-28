// SPDX-License-Identifier: Apache-2.0

/**
 * Read, modify one throttle and write all seven limits with clpr.enabled=true.
 * Prerequisites: HEDERA_NETWORK and the funded treasury or system-admin key in
 * GENESIS_OPERATOR_ID/GENESIS_OPERATOR_KEY. CLPR workflows also need a deployed
 * verifier and Connector contract, plus real peer proof material for Channel
 * completion; this throttle update needs neither contracts nor proof files.
 *
 * Set CLPR_MAX_MESSAGES_PER_BUNDLE to the desired positive uint32 limit.
 * Run from examples: node clpr/update-ledger-configuration.js
 */
import {
    ClprGetLedgerConfigurationQuery,
    ClprThrottles,
    ClprUpdateLedgerConfigurationTransaction,
    PrivateKey,
} from "@hiero-ledger/sdk";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Change one throttle while preserving the other six queried limits. */
async function main() {
    for (const name of [
        "HEDERA_NETWORK",
        "GENESIS_OPERATOR_ID",
        "GENESIS_OPERATOR_KEY",
    ]) {
        if (!process.env[name]) {
            throw new Error(`Environment variable ${name} is required.`);
        }
    }
    const limit = process.env.CLPR_MAX_MESSAGES_PER_BUNDLE ?? "";
    if (!/^[1-9]\d*$/.test(limit)) {
        throw new Error(
            "CLPR_MAX_MESSAGES_PER_BUNDLE must be a positive integer.",
        );
    }
    const adminKey = PrivateKey.fromStringDer(process.env.GENESIS_OPERATOR_KEY);
    const client = clientForName(process.env.HEDERA_NETWORK);

    try {
        client.setOperator(process.env.GENESIS_OPERATOR_ID, adminKey);
        const info = await new ClprGetLedgerConfigurationQuery().execute(
            client,
        );
        const current = info.throttles;
        const throttles = ClprThrottles.of({
            maxMessagesPerBundle: Number(limit),
            maxMessagePayloadBytes: current.maxMessagePayloadBytes,
            maxGasPerMessage: current.maxGasPerMessage,
            maxQueueDepth: current.maxQueueDepth,
            maxSyncBytes: current.maxSyncBytes,
            maxLocalEndpoints: current.maxLocalEndpoints,
            maxPeerEndpoints: current.maxPeerEndpoints,
        });
        // Keep uint64 values as Longs; converting them to Number loses precision.
        const receipt = await (
            await new ClprUpdateLedgerConfigurationTransaction()
                .setThrottles(throttles)
                .execute(client)
        ).getReceipt(client);
        console.log("Update throttles:", receipt.status.toString());
        console.log(
            "maxMessagesPerBundle:",
            current.maxMessagesPerBundle,
            "->",
            throttles.maxMessagesPerBundle,
        );
    } finally {
        client.close();
    }
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
