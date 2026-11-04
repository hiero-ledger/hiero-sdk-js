// SPDX-License-Identifier: Apache-2.0
// @ts-check

/**
 * CLPR_ENABLED selects expectations for the single configured network:
 * unset skips every test, true runs enabled-service checks, and false checks
 * CLPR_NOT_ENABLED. HEDERA_NETWORK (or CONFIG_FILE), OPERATOR_ID and
 * OPERATOR_KEY must configure a funded, non-admin payer for enabled checks.
 * Enable clpr.enabled on the consensus node for CLPR_ENABLED=true.
 * Enabled mode also needs GENESIS_OPERATOR_ID/GENESIS_OPERATOR_KEY, the deployed
 * CLPR_VERIFIER_CONTRACT_ID and CLPR_CONNECTOR_CONTRACT_ID, and the lifecycle
 * fixtures documented in env.example: CLPR_CHANNEL_ID, CLPR_OWNERSHIP_KEY,
 * CLPR_CONFIG_PROOF_FILE, CLPR_MANIFEST_PROOF_FILE, CLPR_CONNECTOR_ADMIN_KEY,
 * and CLPR_LOCKED_STAKE_TINYBARS. Proof files must contain real peer-ledger
 * snapshots accepted by the verifier. Synthetic proofs cannot prove this lifecycle.
 * Run live modes outside offline CI. TCK #784 owns other real-proof scenarios.
 */
import {
    BatchTransaction,
    ClprCompleteChannelTransaction,
    ClprCompleteConnectorTransaction,
    ClprDeregisterConnectorTransaction,
    Hbar,
    ClprCloseChannelTransaction,
    ClprEndpoint,
    ClprEndpointManifestInfo,
    ClprGetEndpointManifestQuery,
    ClprGetLedgerConfigurationQuery,
    ClprLedgerConfigurationInfo,
    ClprRegisterChannelTransaction,
    ClprRegisterConnectorTransaction,
    ClprServiceEndpoint,
    ClprThrottles,
    ClprUpdateLedgerConfigurationTransaction,
    PrivateKey,
    Status,
} from "../../src/exports.js";
import * as hex from "../../src/encoding/hex.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

const mode =
    typeof process === "undefined" ? undefined : process.env?.CLPR_ENABLED;
const configured = mode === "true" || mode === "false";

if (!configured) {
    const reason =
        "Skipping CLPR integration tests: set CLPR_ENABLED=true for an enabled network or CLPR_ENABLED=false for a disabled network.";
    if (typeof process !== "undefined" && process.stdout?.write != null) {
        process.stdout.write(`${reason}\n`);
    } else {
        console.log(reason);
    }
}

/**
 * @param {string} name
 * @returns {string}
 */
function requiredSetting(name) {
    const value =
        typeof process === "undefined" ? undefined : process.env[name];
    if (!value) {
        throw new Error(`CLPR enabled lifecycle requires ${name}.`);
    }
    return value;
}

/** Load real lifecycle fixtures only after explicit opt-in. */
async function loadFixtures() {
    const channelHex = requiredSetting("CLPR_CHANNEL_ID");
    if (!/^[\da-f]{64}$/i.test(channelHex)) {
        throw new Error(
            "CLPR_CHANNEL_ID must be 64 hex characters without 0x.",
        );
    }
    const { readFile } = await import("node:fs/promises");
    const [configProof, manifestProof] = await Promise.all([
        readFile(requiredSetting("CLPR_CONFIG_PROOF_FILE")),
        readFile(requiredSetting("CLPR_MANIFEST_PROOF_FILE")),
    ]);
    return {
        channelId: new Uint8Array(hex.decode(channelHex)),
        ownershipKey: PrivateKey.fromStringDer(
            requiredSetting("CLPR_OWNERSHIP_KEY"),
        ),
        adminKey: PrivateKey.fromStringDer(
            requiredSetting("CLPR_CONNECTOR_ADMIN_KEY"),
        ),
        verifierContract: requiredSetting("CLPR_VERIFIER_CONTRACT_ID"),
        connectorContract: requiredSetting("CLPR_CONNECTOR_CONTRACT_ID"),
        lockedStake: Hbar.fromTinybars(
            requiredSetting("CLPR_LOCKED_STAKE_TINYBARS"),
        ),
        configProof: new Uint8Array(configProof),
        manifestProof: new Uint8Array(manifestProof),
    };
}

describe.skipIf(!configured)("CLPR", function () {
    /** @type {Awaited<ReturnType<typeof IntegrationTestEnv.new>>} */
    let env;
    /** @type {Awaited<ReturnType<typeof loadFixtures>>} */
    let fixtures;

    beforeAll(async function () {
        if (mode === "true") {
            fixtures = await loadFixtures();
            requiredSetting("GENESIS_OPERATOR_ID");
            requiredSetting("GENESIS_OPERATOR_KEY");
        }
        env = await IntegrationTestEnv.new();
        if (mode === "true") {
            expect(
                ["0.0.2", "0.0.50"],
                "OPERATOR_ID must be a non-admin payer",
            ).not.toContain(env.operatorId.toString());
        }
    });

    afterAll(async function () {
        if (env != null) {
            await env.close();
        }
    });

    it.runIf(mode === "true")(
        "returns typed ledger configuration",
        async function () {
            const info = await new ClprGetLedgerConfigurationQuery().execute(
                env.client,
            );

            expect(info).toBeInstanceOf(ClprLedgerConfigurationInfo);
            expect(info.throttles).toBeInstanceOf(ClprThrottles);
            expect(info.configurationStateProof).toBeInstanceOf(Uint8Array);
        },
    );

    it.runIf(mode === "true")(
        "returns a typed endpoint manifest",
        async function () {
            const info = await new ClprGetEndpointManifestQuery().execute(
                env.client,
            );

            expect(info).toBeInstanceOf(ClprEndpointManifestInfo);
            expect(info.manifestStateProof).toBeInstanceOf(Uint8Array);
            for (const endpoint of info.endpoints) {
                expect(endpoint).toBeInstanceOf(ClprEndpoint);
                expect(endpoint.serviceEndpoint).toBeInstanceOf(
                    ClprServiceEndpoint,
                );
            }
        },
    );

    it.runIf(mode === "true")(
        "Channel lifecycle: register, complete, close; Connector lifecycle: register, complete, deregister",
        async function () {
            const { channelId, ownershipKey, adminKey } = fixtures;
            const commitment =
                ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    channelId,
                    ownershipKey.publicKey,
                );
            const register = await new ClprRegisterChannelTransaction()
                .setOwnershipCommitment(commitment)
                .execute(env.client);
            expect((await register.getReceipt(env.client)).status).toBe(
                Status.Success,
            );

            const complete = await new ClprCompleteChannelTransaction()
                .setChannelId(channelId)
                .setVerifierContract(fixtures.verifierContract)
                .setConfigProofBytes(fixtures.configProof)
                .setEndpointManifestProofBytes(fixtures.manifestProof)
                .setOwnershipProof(ownershipKey)
                .execute(env.client);
            expect((await complete.getReceipt(env.client)).status).toBe(
                Status.Success,
            );

            // Use the active Channel before closing it. A fresh salt avoids old commitments.
            const salt = crypto.getRandomValues(new Uint8Array(32));
            const connectorId =
                ClprRegisterConnectorTransaction.computeConnectorId(
                    channelId,
                    ownershipKey.publicKey,
                    salt,
                );
            const connectorCommitment =
                ClprRegisterConnectorTransaction.computeOwnershipCommitment(
                    connectorId,
                    ownershipKey.publicKey,
                );
            const registerConnector =
                await new ClprRegisterConnectorTransaction()
                    .setCommitment(connectorCommitment)
                    .execute(env.client);
            expect(
                (await registerConnector.getReceipt(env.client)).status,
            ).toBe(Status.Success);

            const completeConnector =
                await new ClprCompleteConnectorTransaction()
                    .setChannelId(channelId)
                    .setConnectorId(connectorId)
                    .setSalt(salt)
                    .setConnectorContract(fixtures.connectorContract)
                    .setAdminKey(adminKey.publicKey)
                    .setLockedStake(fixtures.lockedStake)
                    .setOwnershipProof(ownershipKey)
                    .execute(env.client);
            expect(
                (await completeConnector.getReceipt(env.client)).status,
            ).toBe(Status.Success);

            const deregister = new ClprDeregisterConnectorTransaction()
                .setChannelId(channelId)
                .setConnectorId(connectorId)
                .setStakeRecipient(env.operatorId)
                .freezeWith(env.client);
            await deregister.sign(adminKey);
            await deregister.sign(env.operatorKey);
            const deregisterResponse = await deregister.execute(env.client);
            expect(
                (await deregisterResponse.getReceipt(env.client)).status,
            ).toBe(Status.Success);

            try {
                env.client.setOperator(
                    env.genesisOperatorId,
                    env.genesisOperatorKey,
                );
                const close = await new ClprCloseChannelTransaction()
                    .setChannelId(channelId)
                    .execute(env.client);
                expect((await close.getReceipt(env.client)).status).toBe(
                    Status.Success,
                );
                // A successful close starts queue draining; it does not assert CLOSED state.
            } finally {
                env.client.setOperator(env.operatorId, env.operatorKey);
            }
        },
    );

    it.runIf(mode === "true")(
        "rejects a CLPR transaction in an atomic batch by default",
        async function () {
            const commitment =
                ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    crypto.getRandomValues(new Uint8Array(32)),
                    PrivateKey.generateED25519().publicKey,
                );
            const inner = await new ClprRegisterChannelTransaction()
                .setOwnershipCommitment(commitment)
                .batchify(env.client, env.operatorKey.publicKey);
            await expect(
                new BatchTransaction()
                    .addInnerTransaction(inner)
                    .execute(env.client)
                    .then((response) => response.getReceipt(env.client)),
            ).rejects.toMatchObject({
                status: Status.BatchTransactionInBlacklist,
            });
        },
    );

    it.runIf(mode === "true")(
        "rejects a configuration update by a non-admin with AUTHORIZATION_FAILED",
        async function () {
            const info = await new ClprGetLedgerConfigurationQuery().execute(
                env.client,
            );
            const current = info.throttles;
            const throttles = ClprThrottles.of({
                maxMessagesPerBundle: current.maxMessagesPerBundle,
                maxMessagePayloadBytes: current.maxMessagePayloadBytes,
                maxGasPerMessage: current.maxGasPerMessage,
                maxQueueDepth: current.maxQueueDepth,
                maxSyncBytes: current.maxSyncBytes,
                maxLocalEndpoints: current.maxLocalEndpoints,
                maxPeerEndpoints: current.maxPeerEndpoints,
            });

            await expect(
                new ClprUpdateLedgerConfigurationTransaction()
                    .setThrottles(throttles)
                    .execute(env.client)
                    .then((response) => response.getReceipt(env.client)),
            ).rejects.toMatchObject({ status: Status.AuthorizationFailed });
        },
    );

    it.runIf(mode === "true")(
        "rejects closing a Channel by a non-admin with AUTHORIZATION_FAILED",
        async function () {
            const channelId = crypto.getRandomValues(new Uint8Array(32));
            const key = PrivateKey.generateED25519();
            const commitment =
                ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    channelId,
                    key.publicKey,
                );
            await (
                await new ClprRegisterChannelTransaction()
                    .setOwnershipCommitment(commitment)
                    .execute(env.client)
            ).getReceipt(env.client);

            await expect(
                new ClprCloseChannelTransaction()
                    .setChannelId(channelId)
                    .setOwnershipCommitment(commitment)
                    .execute(env.client)
                    .then((response) => response.getReceipt(env.client)),
            ).rejects.toMatchObject({ status: Status.AuthorizationFailed });
        },
    );

    it.runIf(mode === "false")(
        "rejects a free query with CLPR_NOT_ENABLED",
        async function () {
            await expect(
                new ClprGetLedgerConfigurationQuery().execute(env.client),
            ).rejects.toMatchObject({ status: Status.ClprNotEnabled });
        },
    );

    it.runIf(mode === "false")(
        "rejects registration with CLPR_NOT_ENABLED",
        async function () {
            const channelId = crypto.getRandomValues(new Uint8Array(32));
            const key = PrivateKey.generateED25519();
            const commitment =
                ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    channelId,
                    key.publicKey,
                );

            await expect(
                new ClprRegisterChannelTransaction()
                    .setOwnershipCommitment(commitment)
                    .execute(env.client)
                    .then((response) => response.getReceipt(env.client)),
            ).rejects.toMatchObject({ status: Status.ClprNotEnabled });
        },
    );
});
