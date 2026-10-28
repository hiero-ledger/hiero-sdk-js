// SPDX-License-Identifier: Apache-2.0

/**
 * CLPR_ENABLED selects expectations for the single configured network:
 * unset skips every test, true runs enabled-service checks, and false checks
 * CLPR_NOT_ENABLED. HEDERA_NETWORK (or CONFIG_FILE), OPERATOR_ID and
 * OPERATOR_KEY must configure a funded, non-admin payer for enabled checks.
 * Enable clpr.enabled on the consensus node for CLPR_ENABLED=true.
 * These checks need no verifier, Connector contract or cross-ledger proofs:
 * only the commit phase is exercised. Run live modes outside offline CI.
 */
import {
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
    TransactionReceipt,
} from "../../src/exports.js";
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

describe.skipIf(!configured)("CLPR", function () {
    let env;

    beforeAll(async function () {
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
        "registers a Channel commitment and returns a receipt",
        async function () {
            const channelId = crypto.getRandomValues(new Uint8Array(32));
            const key = PrivateKey.generateED25519();
            const commitment =
                ClprRegisterChannelTransaction.computeOwnershipCommitment(
                    channelId,
                    key.publicKey,
                );
            const response = await new ClprRegisterChannelTransaction()
                .setOwnershipCommitment(commitment)
                .execute(env.client);
            const receipt = await response.getReceipt(env.client);

            expect(receipt).toBeInstanceOf(TransactionReceipt);
            expect(receipt.status).toBe(Status.Success);
        },
    );

    it.runIf(mode === "true")(
        "registers a Connector commitment and returns a receipt",
        async function () {
            const key = PrivateKey.generateED25519();
            const connectorId =
                ClprRegisterConnectorTransaction.computeConnectorId(
                    crypto.getRandomValues(new Uint8Array(32)),
                    key.publicKey,
                    crypto.getRandomValues(new Uint8Array(32)),
                );
            const commitment =
                ClprRegisterConnectorTransaction.computeOwnershipCommitment(
                    connectorId,
                    key.publicKey,
                );
            const response = await new ClprRegisterConnectorTransaction()
                .setCommitment(commitment)
                .execute(env.client);
            const receipt = await response.getReceipt(env.client);

            expect(receipt).toBeInstanceOf(TransactionReceipt);
            expect(receipt.status).toBe(Status.Success);
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
