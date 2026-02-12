import { Client, AccountId } from "@hiero-ledger/sdk";

import { sdk } from "../sdk_data";
import { SdkResponse } from "../response/sdk";
import { SdkSetupParams } from "../params/sdk";

/**
 * Setup parameters with sessionId for reset operation
 */
interface ResetParams {
    readonly sessionId?: string;
}

/**
 * Parameters for updating the operator on an existing client
 */
interface SetOperatorParams {
    readonly operatorAccountId: string;
    readonly operatorPrivateKey: string;
    readonly sessionId?: string;
}

export default {
    /**
     * Sets up a Hedera client for a test session.
     * Supports concurrent test execution by creating isolated client instances per session.
     *
     * @param params - Setup parameters including optional sessionId
     * @returns Response indicating success or failure
     */
    setup: ({
        operatorAccountId,
        operatorPrivateKey,
        nodeIp,
        nodeAccountId,
        mirrorNetworkIp,
        sessionId,
    }: SdkSetupParams): SdkResponse => {
        if (!operatorAccountId || !operatorPrivateKey) {
            throw new Error(
                "Operator credentials missing: operatorAccountId/operatorPrivateKey",
            );
        }

        // Reuse existing client for this session (do not mutate operator here)
        if (sessionId && sdk.hasClient(sessionId)) {
            return {
                message: `Client already set up for session: ${sessionId}`,
                status: "SUCCESS",
            };
        }

        let client: Client;

        if (nodeIp && nodeAccountId && mirrorNetworkIp) {
            const node = { [nodeIp]: AccountId.fromString(nodeAccountId) };
            client = Client.forNetwork(node);
            // Set mirror network for custom network configuration
            client.setMirrorNetwork([mirrorNetworkIp]);
        } else {
            client = Client.forTestnet();
            // Explicitly set mirror network to ensure it's configured for AddressBookQuery
            // This matches the pattern used in integration tests
            client.setMirrorNetwork("testnet");
        }

        client.setOperator(operatorAccountId, operatorPrivateKey);
        client.setRequestTimeout(30000);

        sdk.setClient(client, sessionId);

        const sessionInfo = sessionId ? ` for session: ${sessionId}` : "";

        return {
            message: `Successfully setup client${sessionInfo}. Active sessions: ${sdk.getActiveSessionCount()}`,
            status: "SUCCESS",
        };
    },

    /**
     * Updates the operator on an existing client for a session.
     * Use this to switch payers within the same session without recreating the client.
     */
    setOperator: ({
        operatorAccountId,
        operatorPrivateKey,
        sessionId,
    }: SetOperatorParams): SdkResponse => {
        if (!operatorAccountId || !operatorPrivateKey) {
            throw new Error(
                "Operator credentials missing: operatorAccountId/operatorPrivateKey",
            );
        }
        const client = sdk.getClient(sessionId);
        client.setOperator(operatorAccountId, operatorPrivateKey);

        return {
            message: `Operator updated ${
                sessionId ? `for session: ${sessionId}` : "for default client"
            }`,
            status: "SUCCESS",
        };
    },

    /**
     * Resets (closes and removes) a Hedera client for a test session.
     * Supports concurrent test execution by cleaning up session-specific clients.
     *
     * @param params - Reset parameters including optional sessionId
     * @returns Response indicating success or failure
     */
    reset: ({ sessionId }: ResetParams = {}): SdkResponse => {
        sdk.removeClient(sessionId);

        const sessionInfo = sessionId ? ` for session: ${sessionId}` : "";
        return {
            message: `Successfully reset client${sessionInfo}. Active sessions: ${sdk.getActiveSessionCount()}`,
            status: "SUCCESS",
        };
    },
};
