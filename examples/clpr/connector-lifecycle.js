// SPDX-License-Identifier: Apache-2.0

/**
 * Connector commit, reveal and deregistration with clpr.enabled=true.
 * Prerequisites: HEDERA_NETWORK, a funded OPERATOR_ID/OPERATOR_KEY, an active
 * CLPR_CHANNEL_ID (64 hex characters without 0x), and a deployed verifier and
 * Connector contract. Channel setup requires real peer proof material for
 * completion and a treasury or system-admin key for privileged steps.
 *
 * Set CLPR_CONNECTOR_CONTRACT_ID to the deployed Connector's ContractId,
 * CLPR_OWNERSHIP_KEY and CLPR_CONNECTOR_ADMIN_KEY to private keys in DER hex,
 * and CLPR_LOCKED_STAKE_TINYBARS to a decimal amount meeting clpr.minLockedStake.
 * The payer is the explicit stake recipient and must sign deregistration along
 * with the Connector admin. A fresh salt gives each run a new Connector ID,
 * since completed commitments stay registered after deregistration.
 * Run from examples: node clpr/connector-lifecycle.js
 */
import {
    ClprRegisterConnectorTransaction,
    ClprCompleteConnectorTransaction,
    ClprDeregisterConnectorTransaction,
    Hbar,
    PrivateKey,
} from "@hiero-ledger/sdk";
import { randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { clientForName } from "../client.js";

dotenv.config();

/** Register, complete and deregister a Connector using public SDK builders. */
async function main() {
    for (const name of [
        "HEDERA_NETWORK",
        "OPERATOR_ID",
        "OPERATOR_KEY",
        "CLPR_OWNERSHIP_KEY",
        "CLPR_CONNECTOR_ADMIN_KEY",
        "CLPR_CONNECTOR_CONTRACT_ID",
        "CLPR_LOCKED_STAKE_TINYBARS",
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
    const salt = new Uint8Array(randomBytes(32));
    const payerKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const ownershipKey = PrivateKey.fromStringDer(
        process.env.CLPR_OWNERSHIP_KEY,
    );
    const adminKey = PrivateKey.fromStringDer(
        process.env.CLPR_CONNECTOR_ADMIN_KEY,
    );
    const lockedStake = Hbar.fromTinybars(
        process.env.CLPR_LOCKED_STAKE_TINYBARS,
    );
    const connectorId = ClprRegisterConnectorTransaction.computeConnectorId(
        channelId,
        ownershipKey.publicKey,
        salt,
    );
    const commitment =
        ClprRegisterConnectorTransaction.computeOwnershipCommitment(
            connectorId,
            ownershipKey.publicKey,
        );
    const client = clientForName(process.env.HEDERA_NETWORK);

    try {
        client.setOperator(process.env.OPERATOR_ID, payerKey);
        console.log("Connector ID:", Buffer.from(connectorId).toString("hex"));
        console.log("Salt:", Buffer.from(salt).toString("hex"));
        const registerReceipt = await (
            await new ClprRegisterConnectorTransaction()
                .setCommitment(commitment)
                .execute(client)
        ).getReceipt(client);
        console.log("Register Connector:", registerReceipt.status.toString());

        const completeReceipt = await (
            await new ClprCompleteConnectorTransaction()
                .setChannelId(channelId)
                .setConnectorId(connectorId)
                .setSalt(salt)
                .setConnectorContract(process.env.CLPR_CONNECTOR_CONTRACT_ID)
                .setAdminKey(adminKey.publicKey)
                .setLockedStake(lockedStake)
                .setOwnershipProof(ownershipKey)
                .execute(client)
        ).getReceipt(client);
        console.log("Complete Connector:", completeReceipt.status.toString());

        const deregister = new ClprDeregisterConnectorTransaction()
            .setChannelId(channelId)
            .setConnectorId(connectorId)
            .setStakeRecipient(process.env.OPERATOR_ID)
            .freezeWith(client);
        await deregister.sign(adminKey);
        await deregister.sign(payerKey);
        const deregisterReceipt = await (
            await deregister.execute(client)
        ).getReceipt(client);
        console.log(
            "Deregister Connector:",
            deregisterReceipt.status.toString(),
        );
    } finally {
        client.close();
    }
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
