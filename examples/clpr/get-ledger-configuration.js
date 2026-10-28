// SPDX-License-Identifier: Apache-2.0

/**
 * Free ledger configuration query on a network with clpr.enabled=true.
 * Prerequisites: HEDERA_NETWORK and reachable node endpoints. No operator,
 * payment or key is needed for this query. Other CLPR workflows need the
 * treasury or system-admin key for privileged steps, a deployed verifier and
 * Connector contract, and real peer proof material for Channel completion.
 *
 * Configuration fields are live; configurationStateProof describes a signed
 * snapshot. An empty proof is a successful read; retry later if a proof is needed.
 * Run from examples: node clpr/get-ledger-configuration.js
 */
import { ClprGetLedgerConfigurationQuery } from "@hiero-ledger/sdk";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Read the typed configuration and proof without an operator. */
async function main() {
    const client = clientForName(process.env.HEDERA_NETWORK);

    try {
        const info = await new ClprGetLedgerConfigurationQuery().execute(
            client,
        );
        const throttles = info.throttles;
        console.log({
            protocolVersion: info.protocolVersion,
            chainId: info.chainId,
            serviceAddress: Buffer.from(info.serviceAddress).toString("hex"),
            timestamp: info.timestamp.toString(),
            throttles: {
                maxMessagesPerBundle: throttles.maxMessagesPerBundle,
                maxMessagePayloadBytes: throttles.maxMessagePayloadBytes,
                maxGasPerMessage: throttles.maxGasPerMessage.toString(),
                maxQueueDepth: throttles.maxQueueDepth,
                maxSyncBytes: throttles.maxSyncBytes.toString(),
                maxLocalEndpoints: throttles.maxLocalEndpoints,
                maxPeerEndpoints: throttles.maxPeerEndpoints,
            },
            initialTrustAnchor: Buffer.from(info.initialTrustAnchor).toString(
                "hex",
            ),
            initialTrustAnchorId: Buffer.from(
                info.initialTrustAnchorId,
            ).toString("hex"),
            configurationStateProof: Buffer.from(
                info.configurationStateProof,
            ).toString("hex"),
        });
    } finally {
        client.close();
    }
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
