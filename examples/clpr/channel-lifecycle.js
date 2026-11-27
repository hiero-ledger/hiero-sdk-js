// SPDX-License-Identifier: Apache-2.0

/**
 * Create a Channel on RC3 with clpr.enabled=true.
 * Use a funded OPERATOR_ID/OPERATOR_KEY and the agreed peer fixture. It supplies
 * CLPR_CHANNEL_ID, CLPR_CHANNEL_SALT and CLPR_PEER_VERIFIER as hex, the deployed
 * local verifier ContractId, and real peer config and endpoint manifest proofs.
 * The peer setup may also need a deployed Connector contract. The Channel is kept
 * unless CLPR_CLEANUP=true. Deleting it needs GENESIS_OPERATOR_ID/KEY for a
 * treasury or system admin account, or the configured CLPR admin.
 */
import { readFile } from "node:fs/promises";
import dotenv from "dotenv";
import {
    ClprCreateChannelTransaction,
    ClprDeleteChannelTransaction,
    PrivateKey,
} from "@hiero-ledger/sdk";
import { clientForName } from "../client.js";
import { applyMaxTransactionFee } from "./transaction-fee.js";

dotenv.config();

/** @param {string} name */
function setting(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Environment variable ${name} is required.`);
    return value;
}

/** @param {string} name */
function readHex(name) {
    const value = setting(name);
    if (!/^(?:[\da-f]{2})+$/i.test(value)) {
        throw new Error(`${name} must be hex without 0x.`);
    }
    return Buffer.from(value, "hex");
}

async function main() {
    const channelId = readHex("CLPR_CHANNEL_ID");
    const client = clientForName(setting("HEDERA_NETWORK"));
    try {
        applyMaxTransactionFee(client);
        // Validate the cleanup operator with this network before creating a Channel.
        const cleanupOperator =
            process.env.CLPR_CLEANUP === "true"
                ? client
                      .setOperator(
                          setting("GENESIS_OPERATOR_ID"),
                          setting("GENESIS_OPERATOR_KEY"),
                      )
                      .getOperator()
                : null;
        client.setOperator(
            setting("OPERATOR_ID"),
            PrivateKey.fromStringDer(setting("OPERATOR_KEY")),
        );
        const create = await new ClprCreateChannelTransaction()
            .setChannelId(channelId)
            .setSalt(readHex("CLPR_CHANNEL_SALT"))
            .setPeerVerifier(readHex("CLPR_PEER_VERIFIER"))
            .setVerifierContract(setting("CLPR_VERIFIER_CONTRACT_ID"))
            .setConfigProofBytes(
                await readFile(setting("CLPR_CONFIG_PROOF_FILE")),
            )
            .setEndpointManifestProofBytes(
                await readFile(setting("CLPR_MANIFEST_PROOF_FILE")),
            )
            .execute(client);
        console.log(
            "Create Channel:",
            (await create.getReceipt(client)).status.toString(),
        );

        // Deletion is opt-in, so a live run keeps the Channel for messaging.
        if (cleanupOperator == null) {
            console.log(
                "Keeping the Channel. Set CLPR_CLEANUP=true to delete it.",
            );
        } else {
            client.setOperatorWith(
                cleanupOperator.accountId,
                cleanupOperator.publicKey,
                cleanupOperator.transactionSigner,
            );
            const close = await new ClprDeleteChannelTransaction()
                .setChannelId(channelId)
                .execute(client);
            console.log(
                "Delete Channel:",
                (await close.getReceipt(client)).status.toString(),
            );
        }
    } finally {
        client.close();
    }
}

await main();
