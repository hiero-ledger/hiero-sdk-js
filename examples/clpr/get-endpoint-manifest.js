// SPDX-License-Identifier: Apache-2.0

/**
 * Paid endpoint manifest query on a network with clpr.enabled=true.
 * Prerequisites: HEDERA_NETWORK, reachable node endpoints and a funded
 * OPERATOR_ID/OPERATOR_KEY. The client looks up the query cost and signs the
 * payment, subject to its normal maximum query payment.
 *
 * Keep the returned manifest and manifestStateProof paired when seeding a peer
 * cache. An empty proof is a successful read; retry later if a proof is needed.
 * Run from examples: node clpr/get-endpoint-manifest.js
 */
import { ClprGetEndpointManifestQuery, PrivateKey } from "@hiero-ledger/sdk";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Read the typed manifest and proof with a query payment. */
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
        const info = await new ClprGetEndpointManifestQuery().execute(client);
        console.log({
            version: info.version.toString(),
            serviceAddress: Buffer.from(info.serviceAddress).toString("hex"),
            endpoints: info.endpoints.map((endpoint) => ({
                ipAddress: endpoint.serviceEndpoint.ipAddress,
                port: endpoint.serviceEndpoint.port,
                tlsCertificate: Buffer.from(endpoint.tlsCertificate).toString(
                    "hex",
                ),
                accountId: Buffer.from(endpoint.accountId).toString("hex"),
            })),
            manifestStateProof: Buffer.from(info.manifestStateProof).toString(
                "hex",
            ),
        });
    } finally {
        client.close();
    }
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
