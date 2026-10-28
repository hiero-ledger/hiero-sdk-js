// SPDX-License-Identifier: Apache-2.0

/**
 * Channel commit, reveal and graceful close on a network with clpr.enabled=true.
 * Prerequisites: a funded OPERATOR_ID/OPERATOR_KEY, HEDERA_NETWORK, and the
 * treasury or system-admin key in GENESIS_OPERATOR_ID/GENESIS_OPERATOR_KEY for
 * closing. Deploy a verifier and a Connector contract for the CLPR workflows.
 * Channel completion needs real peer-ledger proof material accepted by that
 * verifier, not placeholder bytes.
 *
 * Set CLPR_CHANNEL_ID to 64 hex characters without 0x, CLPR_OWNERSHIP_KEY to
 * the ownership private key in DER hex, and CLPR_VERIFIER_CONTRACT_ID to the
 * deployed verifier's ContractId. CLPR_CONFIG_PROOF_FILE and
 * CLPR_MANIFEST_PROOF_FILE name binary configuration and endpoint manifest
 * proof files from the peer ledger. Keep the ownership key private.
 * Run from examples: node clpr/channel-lifecycle.js
 */
import {
    ClprRegisterChannelTransaction,
    ClprCompleteChannelTransaction,
    ClprCloseChannelTransaction,
    PrivateKey,
} from "@hiero-ledger/sdk";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Run the Channel lifecycle with real peer proof files. */
async function main() {
    for (const name of [
        "HEDERA_NETWORK",
        "OPERATOR_ID",
        "OPERATOR_KEY",
        "GENESIS_OPERATOR_ID",
        "GENESIS_OPERATOR_KEY",
        "CLPR_OWNERSHIP_KEY",
        "CLPR_VERIFIER_CONTRACT_ID",
        "CLPR_CONFIG_PROOF_FILE",
        "CLPR_MANIFEST_PROOF_FILE",
    ]) {
        if (!process.env[name]) {
            throw new Error(`Environment variable ${name} is required.`);
        }
    }
    const channelIdHex = process.env.CLPR_CHANNEL_ID ?? "";
    if (!/^[\da-f]{64}$/i.test(channelIdHex)) {
        throw new Error(
            "CLPR_CHANNEL_ID must be 64 hex characters without 0x.",
        );
    }
    const channelId = new Uint8Array(Buffer.from(channelIdHex, "hex"));
    const payerKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const adminKey = PrivateKey.fromStringDer(process.env.GENESIS_OPERATOR_KEY);
    const ownershipKey = PrivateKey.fromStringDer(
        process.env.CLPR_OWNERSHIP_KEY,
    );
    const configProof = new Uint8Array(
        readFileSync(process.env.CLPR_CONFIG_PROOF_FILE),
    );
    const manifestProof = new Uint8Array(
        readFileSync(process.env.CLPR_MANIFEST_PROOF_FILE),
    );
    const commitment =
        ClprRegisterChannelTransaction.computeOwnershipCommitment(
            channelId,
            ownershipKey.publicKey,
        );
    const client = clientForName(process.env.HEDERA_NETWORK);

    try {
        client.setOperator(process.env.OPERATOR_ID, payerKey);
        const registerReceipt = await (
            await new ClprRegisterChannelTransaction()
                .setOwnershipCommitment(commitment)
                .execute(client)
        ).getReceipt(client);
        console.log("Register Channel:", registerReceipt.status.toString());

        const completeReceipt = await (
            await new ClprCompleteChannelTransaction()
                .setChannelId(channelId)
                .setVerifierContract(process.env.CLPR_VERIFIER_CONTRACT_ID)
                .setConfigProofBytes(configProof)
                .setEndpointManifestProofBytes(manifestProof)
                .setOwnershipProof(ownershipKey)
                .execute(client)
        ).getReceipt(client);
        console.log("Complete Channel:", completeReceipt.status.toString());

        client.setOperator(process.env.GENESIS_OPERATOR_ID, adminKey);
        const closeReceipt = await (
            await new ClprCloseChannelTransaction()
                .setChannelId(channelId)
                .execute(client)
        ).getReceipt(client);
        console.log("Close Channel:", closeReceipt.status.toString());
        // Closing starts queue draining; the receipt does not mean CLOSED yet.
    } finally {
        client.close();
    }
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
