// SPDX-License-Identifier: Apache-2.0

/**
 * Create a Connector on RC3 with clpr.enabled=true, and delete it only when
 * CLPR_CLEANUP=true.
 * Use a funded OPERATOR_ID/OPERATOR_KEY, a Channel already verified with real
 * peer proofs, and a deployed local Connector contract. The Channel's verifier
 * and any treasury/system-admin operations are part of Channel setup.
 * The identity key signs creation. The admin key and stake recipient sign deletion.
 */
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import {
    ClprCreateConnectorTransaction,
    ClprDeleteConnectorTransaction,
    Hbar,
    PrivateKey,
} from "@hiero-ledger/sdk";
import { clientForName } from "../client.js";
import { applyMaxTransactionFee } from "./transaction-fee.js";

dotenv.config();

function setting(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Environment variable ${name} is required.`);
    return value;
}

async function main() {
    const channel = setting("CLPR_CHANNEL_ID");
    if (!/^[\da-f]{64}$/i.test(channel)) {
        throw new Error(
            "CLPR_CHANNEL_ID must be 64 hex characters without 0x.",
        );
    }
    const channelId = Buffer.from(channel, "hex");
    const salt = randomBytes(32);
    const payerId = setting("OPERATOR_ID");
    const payer = PrivateKey.fromStringDer(setting("OPERATOR_KEY"));
    const identity = PrivateKey.fromStringDer(setting("CLPR_OWNERSHIP_KEY"));
    const admin = PrivateKey.fromStringDer(setting("CLPR_CONNECTOR_ADMIN_KEY"));
    const connectorId = ClprCreateConnectorTransaction.computeConnectorId(
        identity.publicKey,
        salt,
    );
    const client = clientForName(setting("HEDERA_NETWORK"));
    try {
        applyMaxTransactionFee(client);
        client.setOperator(payerId, payer);
        console.log("Connector ID:", Buffer.from(connectorId).toString("hex"));
        const create = new ClprCreateConnectorTransaction()
            .setChannelId(channelId)
            .setConnectorId(connectorId)
            .setIdentityKey(identity.publicKey)
            .setSalt(salt)
            .setConnectorContract(setting("CLPR_CONNECTOR_CONTRACT_ID"))
            .setAdminKey(admin.publicKey)
            .setLockedStake(
                Hbar.fromTinybars(setting("CLPR_LOCKED_STAKE_TINYBARS")),
            )
            .freezeWith(client);
        await create.sign(identity);
        const created = await create.execute(client);
        console.log(
            "Create Connector:",
            (await created.getReceipt(client)).status.toString(),
        );

        // Deletion is opt-in, so a live run keeps the Connector for messaging.
        if (process.env.CLPR_CLEANUP !== "true") {
            console.log(
                "Keeping the Connector. Set CLPR_CLEANUP=true to delete it.",
            );
            return;
        }
        const remove = new ClprDeleteConnectorTransaction()
            .setChannelId(channelId)
            .setConnectorId(connectorId)
            .setStakeRecipient(payerId)
            .freezeWith(client);
        await remove.sign(admin);
        await remove.sign(payer);
        const removed = await remove.execute(client);
        console.log(
            "Delete Connector:",
            (await removed.getReceipt(client)).status.toString(),
        );
    } finally {
        client.close();
    }
}

await main();
