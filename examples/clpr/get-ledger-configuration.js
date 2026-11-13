// SPDX-License-Identifier: Apache-2.0

/**
 * Paid ledger configuration query on a network with clpr.enabled=true.
 * Prerequisites: HEDERA_NETWORK, reachable node endpoints and a funded
 * OPERATOR_ID/OPERATOR_KEY. The client looks up the query cost and signs the
 * payment, subject to its normal maximum query payment.
 *
 * Configuration fields are live; configurationStateProof describes a signed
 * snapshot. An empty proof is a successful read; retry later if a proof is needed.
 * Run from examples: node clpr/get-ledger-configuration.js
 */
import { ClprGetLedgerConfigurationQuery, PrivateKey } from "@hiero-ledger/sdk";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Read the typed configuration and proof with a query payment. */
async function main() {
    for (const name of ["HEDERA_NETWORK", "OPERATOR_ID", "OPERATOR_KEY"]) {
        if (!process.env[name]) {
            throw new Error(`Environment variable ${name} is required.`);
        }
    }
    const client = clientForName(process.env.HEDERA_NETWORK);

    try {
        client.setOperator(
            process.env.OPERATOR_ID,
            PrivateKey.fromStringDer(process.env.OPERATOR_KEY),
        );
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
