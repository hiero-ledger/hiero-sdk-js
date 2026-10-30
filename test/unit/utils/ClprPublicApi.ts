// SPDX-License-Identifier: Apache-2.0

import Long from "long";

import {
    ClprRegisterChannelTransaction,
    ClprCompleteChannelTransaction,
    ClprCloseChannelTransaction,
    ClprSubmitBundleTransaction,
    ClprRegisterConnectorTransaction,
    ClprCompleteConnectorTransaction,
    ClprDeregisterConnectorTransaction,
    ClprUpdateLedgerConfigurationTransaction,
    ClprGetLedgerConfigurationQuery,
    ClprGetEndpointManifestQuery,
    ClprThrottles,
    ClprLedgerConfigurationInfo,
    ClprEndpointManifestInfo,
    ClprEndpoint,
    ClprServiceEndpoint,
    ClprSignatureScheme,
    Client,
    PrivateKey,
    Transaction,
} from "../../../src/index.js";

export const clprPublicApi = {
    ClprRegisterChannelTransaction,
    ClprCompleteChannelTransaction,
    ClprCloseChannelTransaction,
    ClprSubmitBundleTransaction,
    ClprRegisterConnectorTransaction,
    ClprCompleteConnectorTransaction,
    ClprDeregisterConnectorTransaction,
    ClprUpdateLedgerConfigurationTransaction,
    ClprGetLedgerConfigurationQuery,
    ClprGetEndpointManifestQuery,
    ClprThrottles,
    ClprLedgerConfigurationInfo,
    ClprEndpointManifestInfo,
    ClprEndpoint,
    ClprServiceEndpoint,
    ClprSignatureScheme,
};

// Reject untyped exports as well as missing names.
type IsAny<T> = 0 extends 1 & T ? true : false;
type TypedExports = {
    [Name in keyof typeof clprPublicApi]: IsAny<
        (typeof clprPublicApi)[Name]
    > extends true
        ? never
        : (typeof clprPublicApi)[Name];
};
export const typedExports: TypedExports = clprPublicApi;

export function useClpr(client: Client, key: PrivateKey): Transaction[] {
    const channelId = new Uint8Array(32);
    const salt = new Uint8Array(32);
    const connectorId: Uint8Array =
        ClprRegisterConnectorTransaction.computeConnectorId(
            channelId,
            key.publicKey,
            salt,
        );
    const throttles: ClprThrottles = ClprThrottles.of({
        maxMessagesPerBundle: 1,
        maxMessagePayloadBytes: 1,
        maxGasPerMessage: Long.UONE,
        maxQueueDepth: 1,
        maxSyncBytes: Long.fromString("65537", true),
        maxLocalEndpoints: 0,
        maxPeerEndpoints: 0,
    });
    const ledger: Promise<ClprLedgerConfigurationInfo> =
        new ClprGetLedgerConfigurationQuery().execute(client);
    const manifest: Promise<ClprEndpointManifestInfo> =
        new ClprGetEndpointManifestQuery().execute(client);
    void ledger.then((info) => {
        const limits: ClprThrottles = info.throttles;
        return limits;
    });
    void manifest.then((info) => {
        const endpoint: ClprEndpoint | undefined = info.endpoints[0];
        const service: ClprServiceEndpoint | undefined =
            endpoint?.serviceEndpoint;
        const port: number | undefined = service?.port;
        return port;
    });
    const completion = new ClprCompleteConnectorTransaction()
        .setChannelId(channelId)
        .setConnectorId(connectorId)
        .setSalt(salt)
        .setAdminKey(key.publicKey)
        .setOwnershipProof(key);
    const scheme: ClprSignatureScheme | null = completion.signatureScheme;
    void scheme;

    // @ts-expect-error Channel IDs require bytes.
    new ClprCloseChannelTransaction().setChannelId("invalid");
    // @ts-expect-error Throttles require the typed model.
    new ClprUpdateLedgerConfigurationTransaction().setThrottles({});
    // @ts-expect-error Endpoint ports are numeric.
    const invalidPort: string = (null as unknown as ClprServiceEndpoint).port;
    void invalidPort;

    return [
        new ClprRegisterChannelTransaction().setOwnershipCommitment(
            ClprRegisterChannelTransaction.computeOwnershipCommitment(
                channelId,
                key.publicKey,
            ),
        ),
        new ClprCompleteChannelTransaction()
            .setChannelId(channelId)
            .setOwnershipProof(key),
        new ClprCloseChannelTransaction().setChannelId(channelId),
        new ClprSubmitBundleTransaction()
            .setChannelId(channelId)
            .setBundlePayload(new Uint8Array()),
        new ClprRegisterConnectorTransaction().setCommitment(
            ClprRegisterConnectorTransaction.computeOwnershipCommitment(
                connectorId,
                key.publicKey,
            ),
        ),
        completion,
        new ClprDeregisterConnectorTransaction()
            .setChannelId(channelId)
            .setConnectorId(connectorId)
            .setStakeRecipient("0.0.2"),
        new ClprUpdateLedgerConfigurationTransaction().setThrottles(throttles),
    ];
}
