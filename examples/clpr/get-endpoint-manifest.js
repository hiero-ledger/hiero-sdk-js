// SPDX-License-Identifier: Apache-2.0

/**
 * Free endpoint manifest query on a network with clpr.enabled=true.
 * Prerequisites: HEDERA_NETWORK and reachable node endpoints. No operator,
 * payment or key is needed for this query. Other CLPR workflows need the
 * treasury or system-admin key for privileged steps, a deployed verifier and
 * Connector contract, and real peer proof material for Channel completion.
 *
 * Keep the returned manifest and manifestStateProof paired when seeding a peer
 * cache. An empty proof is a successful read; retry later if a proof is needed.
 * Run from examples: node clpr/get-endpoint-manifest.js
 */
import { ClprGetEndpointManifestQuery } from "@hiero-ledger/sdk";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Read the typed manifest and proof without an operator. */
async function main() {
    const client = clientForName(process.env.HEDERA_NETWORK);

    try {
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
