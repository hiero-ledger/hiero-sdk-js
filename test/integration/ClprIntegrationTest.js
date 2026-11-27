// SPDX-License-Identifier: Apache-2.0
// @ts-check

/**
 * CLPR_ENABLED selects expectations for the single configured network:
 * unset skips every test, true runs enabled-service checks, and false checks
 * CLPR_NOT_ENABLED. HEDERA_NETWORK (or CONFIG_FILE), OPERATOR_ID and
 * OPERATOR_KEY must configure a funded, non-admin payer for enabled checks.
 * Enable clpr.enabled on the consensus node for CLPR_ENABLED=true.
 * Enabled mode also needs the deployed CLPR_VERIFIER_CONTRACT_ID and
 * CLPR_CONNECTOR_CONTRACT_ID, and the lifecycle fixtures documented in
 * env.example: CLPR_CHANNEL_ID, CLPR_CHANNEL_SALT, CLPR_PEER_VERIFIER,
 * CLPR_OWNERSHIP_KEY, CLPR_CONFIG_PROOF_FILE, CLPR_MANIFEST_PROOF_FILE,
 * CLPR_CONNECTOR_ADMIN_KEY and CLPR_LOCKED_STAKE_TINYBARS.
 * CLPR_MAX_TRANSACTION_FEE_TINYBARS is optional. Proof files must contain real
 * peer-ledger snapshots accepted by the verifier. Synthetic proofs cannot prove
 * this lifecycle. The lifecycle case deletes the Connector and closes the
 * Channel, so it also needs GENESIS_OPERATOR_ID/GENESIS_OPERATOR_KEY. Do not
 * run it against fixtures meant for a live messaging test.
 * Run live modes outside offline CI. TCK #784 owns other real-proof scenarios.
 */
import {
    BatchTransaction,
    ClprCreateChannelTransaction,
    ClprCreateConnectorTransaction,
    ClprDeleteConnectorTransaction,
    Hbar,
    ClprDeleteChannelTransaction,
    ClprEndpoint,
    ClprEndpointManifestInfo,
    ClprGetEndpointManifestQuery,
    ClprGetLedgerConfigurationQuery,
    ClprLedgerConfigurationInfo,
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
        channelSalt: new Uint8Array(
            hex.decode(requiredSetting("CLPR_CHANNEL_SALT")),
        ),
        peerVerifier: new Uint8Array(
            hex.decode(requiredSetting("CLPR_PEER_VERIFIER")),
        ),
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
        maxTransactionFee: process.env.CLPR_MAX_TRANSACTION_FEE_TINYBARS
            ? Hbar.fromTinybars(process.env.CLPR_MAX_TRANSACTION_FEE_TINYBARS)
            : null,
        configProof: new Uint8Array(configProof),
        manifestProof: new Uint8Array(manifestProof),
    };
}

/**
 * @param {Awaited<ReturnType<typeof loadFixtures>>} fixtures
 */
function createChannel(fixtures) {
    return new ClprCreateChannelTransaction()
        .setChannelId(fixtures.channelId)
        .setSalt(fixtures.channelSalt)
        .setPeerVerifier(fixtures.peerVerifier)
        .setVerifierContract(fixtures.verifierContract)
        .setConfigProofBytes(fixtures.configProof)
        .setEndpointManifestProofBytes(fixtures.manifestProof);
}

describe.skipIf(!configured)("CLPR", function () {
    /** @type {Awaited<ReturnType<typeof IntegrationTestEnv.new>>} */
    let env;
    /** @type {Awaited<ReturnType<typeof loadFixtures>>} */
    let fixtures;

    beforeAll(async function () {
        if (mode === "true") {
            fixtures = await loadFixtures();
        }
        env = await IntegrationTestEnv.new();
        if (mode === "true") {
            if (fixtures.maxTransactionFee != null) {
                env.client.setDefaultMaxTransactionFee(
                    fixtures.maxTransactionFee,
                );
            }
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
        "creates and deletes a Channel and Connector with RC3",
        async function () {
            // Check before creating anything, so a missing key cannot strand state.
            requiredSetting("GENESIS_OPERATOR_ID");
            requiredSetting("GENESIS_OPERATOR_KEY");
            const { channelId, ownershipKey, adminKey } = fixtures;
            const channel = await createChannel(fixtures).execute(env.client);
            expect((await channel.getReceipt(env.client)).status).toBe(
                Status.Success,
            );

            const salt = crypto.getRandomValues(new Uint8Array(32));
            const connectorId =
                ClprCreateConnectorTransaction.computeConnectorId(
                    ownershipKey.publicKey,
                    salt,
                );
            const connector = new ClprCreateConnectorTransaction()
                .setChannelId(channelId)
                .setConnectorId(connectorId)
                .setIdentityKey(ownershipKey.publicKey)
                .setSalt(salt)
                .setConnectorContract(fixtures.connectorContract)
                .setAdminKey(adminKey.publicKey)
                .setLockedStake(fixtures.lockedStake)
                .freezeWith(env.client);
            await connector.sign(ownershipKey);
            const created = await connector.execute(env.client);
            expect((await created.getReceipt(env.client)).status).toBe(
                Status.Success,
            );

            const deregister = new ClprDeleteConnectorTransaction()
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
                const close = await new ClprDeleteChannelTransaction()
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
            const inner = await createChannel(fixtures).batchify(
                env.client,
                env.operatorKey.publicKey,
            );
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
            await expect(
                new ClprDeleteChannelTransaction()
                    .setChannelId(fixtures.channelId)
                    .execute(env.client)
                    .then((response) => response.getReceipt(env.client)),
            ).rejects.toMatchObject({ status: Status.AuthorizationFailed });
        },
    );

    it.runIf(mode === "false")(
        "rejects a proof query with CLPR_NOT_ENABLED",
        async function () {
            await expect(
                new ClprGetLedgerConfigurationQuery().execute(env.client),
            ).rejects.toMatchObject({ status: Status.ClprNotEnabled });
        },
    );

    it.runIf(mode === "false")(
        "rejects Channel creation with CLPR_NOT_ENABLED",
        async function () {
            await expect(
                new ClprCreateChannelTransaction({
                    channelId: new Uint8Array(32),
                    salt: new Uint8Array(32),
                    verifierContract: "0.0.1",
                    configProofBytes: Uint8Array.of(1),
                })
                    .execute(env.client)
                    .then((response) => response.getReceipt(env.client)),
            ).rejects.toMatchObject({ status: Status.ClprNotEnabled });
        },
    );
});
