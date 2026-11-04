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
    Hbar,
    PrivateKey,
    Transaction,
} from "@hiero-ledger/sdk";
import Long from "long";

import { sdk } from "../sdk_data";
import { BaseTransactionParams } from "../params/base";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import {
    RegisterClprChannelParams,
    CompleteClprChannelParams,
    CloseClprChannelParams,
    SubmitClprBundleParams,
    RegisterClprConnectorParams,
    CompleteClprConnectorParams,
    DeregisterClprConnectorParams,
    UpdateClprLedgerConfigurationParams,
    GetClprLedgerConfigurationParams,
    GetClprEndpointManifestParams,
} from "../params/clpr";
import {
    ClprTransactionResponse,
    ClprCompletionResponse,
    ClprLedgerConfigurationResponse,
    ClprEndpointManifestResponse,
} from "../response/clpr";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { decode } from "../utils/hex";
import { getKeyFromString } from "../utils/key";
import { invalidParamError } from "../utils/invalid-param-error";

const encode = (bytes: Uint8Array | null): string | null =>
    bytes == null ? null : Buffer.from(bytes).toString("hex");

const parseKey = (value: string): ReturnType<typeof getKeyFromString> => {
    try {
        return getKeyFromString(value);
    } catch {
        return null;
    }
};

const ownershipPrivateKey = (value?: string): PrivateKey => {
    if (value == null) {
        return invalidParamError(
            "ownershipPrivateKey must be a private key string",
        );
    }
    const key = parseKey(value);
    if (!(key instanceof PrivateKey)) {
        return invalidParamError(
            "ownershipPrivateKey must be a private key string",
        );
    }
    return key;
};

const uint64 = (value: string): Long => {
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        return invalidParamError("uint64 must be an unsigned decimal string");
    }
    const parsed = Long.fromString(value, true);
    if (parsed.toString() !== value.replace(/^0+(?=\d)/, "")) {
        return invalidParamError("uint64 must fit in 64 unsigned bits");
    }
    return parsed;
};

const execute = async (
    transaction: Transaction,
    params: BaseTransactionParams,
): Promise<ClprTransactionResponse> => {
    const client = sdk.getClient(params.sessionId);
    transaction.setGrpcDeadline(DEFAULT_GRPC_DEADLINE);
    if (params.commonTransactionParams != null) {
        applyCommonTransactionParams(
            params.commonTransactionParams,
            transaction,
            client,
        );
    }
    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);
    return { status: receipt.status.toString() };
};

const complete = async (
    transaction:
        | ClprCompleteChannelTransaction
        | ClprCompleteConnectorTransaction,
    params: BaseTransactionParams,
): Promise<ClprCompletionResponse> => ({
    ...(await execute(transaction, params)),
    publicKey: encode(transaction.publicKey),
    signature: encode(transaction.signature),
    signatureScheme: transaction.signatureScheme?.toString() ?? null,
});

// Method names are provisional until hiero-sdk-tck #784 settles them.
export const registerClprChannel = async (
    params: RegisterClprChannelParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprRegisterChannelTransaction();
    if (params.ownershipCommitment != null) {
        transaction.setOwnershipCommitment(decode(params.ownershipCommitment));
    }
    return execute(transaction, params);
};

export const completeClprChannel = async (
    params: CompleteClprChannelParams,
): Promise<ClprCompletionResponse> => {
    const transaction = new ClprCompleteChannelTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.verifierContract != null) {
        transaction.setVerifierContract(params.verifierContract);
    }
    if (params.configProofBytes != null) {
        transaction.setConfigProofBytes(decode(params.configProofBytes));
    }
    if (params.endpointManifestProofBytes != null) {
        transaction.setEndpointManifestProofBytes(
            decode(params.endpointManifestProofBytes),
        );
    }
    transaction.setOwnershipProof(
        ownershipPrivateKey(params.ownershipPrivateKey),
    );
    return complete(transaction, params);
};

export const closeClprChannel = async (
    params: CloseClprChannelParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprCloseChannelTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.ownershipCommitment != null) {
        transaction.setOwnershipCommitment(decode(params.ownershipCommitment));
    }
    return execute(transaction, params);
};

export const submitClprBundle = async (
    params: SubmitClprBundleParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprSubmitBundleTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.bundlePayload != null) {
        transaction.setBundlePayload(decode(params.bundlePayload));
    }
    return execute(transaction, params);
};

export const registerClprConnector = async (
    params: RegisterClprConnectorParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprRegisterConnectorTransaction();
    if (params.commitment != null) {
        transaction.setCommitment(decode(params.commitment));
    }
    return execute(transaction, params);
};

export const completeClprConnector = async (
    params: CompleteClprConnectorParams,
): Promise<ClprCompletionResponse> => {
    const transaction = new ClprCompleteConnectorTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.connectorId != null) {
        transaction.setConnectorId(decode(params.connectorId));
    }
    if (params.salt != null) {
        transaction.setSalt(decode(params.salt));
    }
    if (params.connectorContract != null) {
        transaction.setConnectorContract(params.connectorContract);
    }
    if (params.adminKey != null) {
        const key = parseKey(params.adminKey);
        if (key == null) {
            return invalidParamError("adminKey must be an SDK key string");
        }
        transaction.setAdminKey(
            key instanceof PrivateKey ? key.publicKey : key,
        );
    }
    if (params.lockedStake != null) {
        const stake = uint64(params.lockedStake);
        try {
            transaction.setLockedStake(Hbar.fromTinybars(stake.toString()));
        } catch {
            return invalidParamError(
                "lockedStake must be a valid tinybar amount",
            );
        }
    }
    transaction.setOwnershipProof(
        ownershipPrivateKey(params.ownershipPrivateKey),
    );
    return complete(transaction, params);
};

export const deregisterClprConnector = async (
    params: DeregisterClprConnectorParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprDeregisterConnectorTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.connectorId != null) {
        transaction.setConnectorId(decode(params.connectorId));
    }
    if (params.stakeRecipient != null) {
        transaction.setStakeRecipient(params.stakeRecipient);
    }
    return execute(transaction, params);
};

export const updateClprLedgerConfiguration = async (
    params: UpdateClprLedgerConfigurationParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprUpdateLedgerConfigurationTransaction();
    if (params.throttles != null) {
        const limits = params.throttles;
        transaction.setThrottles(
            ClprThrottles.of({
                maxMessagesPerBundle: limits.maxMessagesPerBundle,
                maxMessagePayloadBytes: limits.maxMessagePayloadBytes,
                maxGasPerMessage: uint64(limits.maxGasPerMessage),
                maxQueueDepth: limits.maxQueueDepth,
                maxSyncBytes: uint64(limits.maxSyncBytes),
                maxLocalEndpoints: limits.maxLocalEndpoints,
                maxPeerEndpoints: limits.maxPeerEndpoints,
            }),
        );
    }
    return execute(transaction, params);
};

export const getClprLedgerConfiguration = async (
    params: GetClprLedgerConfigurationParams,
): Promise<ClprLedgerConfigurationResponse> => {
    const client = sdk.getClient(params.sessionId);
    const info = await new ClprGetLedgerConfigurationQuery()
        .setGrpcDeadline(DEFAULT_GRPC_DEADLINE)
        .execute(client);
    const limits = info.throttles;
    return {
        protocolVersion: info.protocolVersion,
        chainId: info.chainId,
        serviceAddress: encode(info.serviceAddress),
        timestamp: info.timestamp.toString(),
        throttles: {
            maxMessagesPerBundle: limits.maxMessagesPerBundle,
            maxMessagePayloadBytes: limits.maxMessagePayloadBytes,
            maxGasPerMessage: limits.maxGasPerMessage.toString(),
            maxQueueDepth: limits.maxQueueDepth,
            maxSyncBytes: limits.maxSyncBytes.toString(),
            maxLocalEndpoints: limits.maxLocalEndpoints,
            maxPeerEndpoints: limits.maxPeerEndpoints,
        },
        initialTrustAnchor: encode(info.initialTrustAnchor),
        initialTrustAnchorId: encode(info.initialTrustAnchorId),
        configurationStateProof: encode(info.configurationStateProof),
    };
};

export const getClprEndpointManifest = async (
    params: GetClprEndpointManifestParams,
): Promise<ClprEndpointManifestResponse> => {
    const client = sdk.getClient(params.sessionId);
    const info = await new ClprGetEndpointManifestQuery()
        .setGrpcDeadline(DEFAULT_GRPC_DEADLINE)
        .execute(client);
    return {
        version: info.version.toString(),
        serviceAddress: encode(info.serviceAddress),
        endpoints: info.endpoints.map((endpoint) => ({
            serviceEndpoint: {
                ipAddress: endpoint.serviceEndpoint.ipAddress,
                port: endpoint.serviceEndpoint.port,
            },
            tlsCertificate: encode(endpoint.tlsCertificate),
            accountId: encode(endpoint.accountId),
        })),
        manifestStateProof: encode(info.manifestStateProof),
    };
};
