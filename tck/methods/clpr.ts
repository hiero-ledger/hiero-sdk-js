import {
    ClprCreateChannelTransaction,
    ClprDeleteChannelTransaction,
    ClprSubmitBundleTransaction,
    ClprCreateConnectorTransaction,
    ClprDeleteConnectorTransaction,
    ClprUpdateLedgerConfigurationTransaction,
    ClprGetLedgerConfigurationQuery,
    ClprGetEndpointManifestQuery,
    MirrorNodeClprChannelQuery,
    MirrorNodeClprConnectorQuery,
    ClprThrottles,
    Hbar,
    PrivateKey,
    PublicKey,
    Transaction,
    Query,
} from "@hiero-ledger/sdk";
import Long from "long";
import { proto } from "@hiero-ledger/proto";

import { sdk } from "../sdk_data";
import { BaseTransactionParams } from "../params/base";
import { applyCommonTransactionParams } from "../params/common-tx-params";
import {
    CreateClprChannelParams,
    DeleteClprChannelParams,
    SubmitClprBundleParams,
    CreateClprConnectorParams,
    DeleteClprConnectorParams,
    UpdateClprLedgerConfigurationParams,
    GetClprLedgerConfigurationParams,
    GetClprEndpointManifestParams,
    GetMirrorNodeClprChannelParams,
    GetMirrorNodeClprConnectorParams,
} from "../params/clpr";
import {
    ClprTransactionResponse,
    ClprLedgerConfigurationResponse,
    ClprEndpointManifestResponse,
    MirrorNodeClprChannelResponse,
    MirrorNodeClprConnectorResponse,
} from "../response/clpr";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";
import { decode } from "../utils/hex";
import { getKeyFromString } from "../utils/key";
import { invalidParamError } from "../utils/invalid-param-error";

const applyQueryPayment = (
    query: Query<unknown>,
    params: GetClprLedgerConfigurationParams,
): void => {
    if (params.queryPayment != null) {
        query.setQueryPayment(Hbar.fromTinybars(params.queryPayment));
    }
    if (params.maxQueryPayment != null) {
        query.setMaxQueryPayment(Hbar.fromTinybars(params.maxQueryPayment));
    }
};

const encode = (bytes: Uint8Array | null): string | null =>
    bytes == null ? null : Buffer.from(bytes).toString("hex");

const parseKey = (value: string): ReturnType<typeof getKeyFromString> => {
    try {
        return getKeyFromString(value);
    } catch {
        return null;
    }
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

// Method names are provisional until hiero-sdk-tck #784 settles them.
export const createClprChannel = async (
    params: CreateClprChannelParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprCreateChannelTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.salt != null) {
        transaction.setSalt(decode(params.salt));
    }
    if (params.peerVerifier != null) {
        transaction.setPeerVerifier(decode(params.peerVerifier));
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
    return execute(transaction, params);
};

export const deleteClprChannel = async (
    params: DeleteClprChannelParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprDeleteChannelTransaction();
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
    if (params.expectedCachedManifestVersion != null) {
        transaction.setExpectedCachedManifestVersion(
            uint64(params.expectedCachedManifestVersion),
        );
    }
    return execute(transaction, params);
};

export const createClprConnector = async (
    params: CreateClprConnectorParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprCreateConnectorTransaction();
    if (params.channelId != null) {
        transaction.setChannelId(decode(params.channelId));
    }
    if (params.connectorId != null) {
        transaction.setConnectorId(decode(params.connectorId));
    }
    if (params.identityKey != null) {
        const key = parseKey(params.identityKey);
        if (!(key instanceof PublicKey)) {
            return invalidParamError(
                "identityKey must be an Ed25519 or ECDSA public key string",
            );
        }
        transaction.setIdentityKey(key);
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
    return execute(transaction, params);
};

export const deleteClprConnector = async (
    params: DeleteClprConnectorParams,
): Promise<ClprTransactionResponse> => {
    const transaction = new ClprDeleteConnectorTransaction();
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
    const query = new ClprGetLedgerConfigurationQuery().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );
    applyQueryPayment(query, params);
    const info = await query.execute(client);
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
    const query = new ClprGetEndpointManifestQuery()
        .setForManifestRecovery(params.forManifestRecovery === true)
        .setGrpcDeadline(DEFAULT_GRPC_DEADLINE);
    applyQueryPayment(query, params);
    const info = await query.execute(client);
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

export const getMirrorNodeClprChannel = async (
    params: GetMirrorNodeClprChannelParams,
): Promise<MirrorNodeClprChannelResponse> => {
    const query = new MirrorNodeClprChannelQuery();
    if (params.channelId != null) {
        query.setChannelId(decode(params.channelId));
    }
    const info = await query.execute(sdk.getClient(params.sessionId));
    return {
        channelId: encode(info.channelId),
        chainId: info.chainId,
        status: info.status.toString(),
        verifierContractId: info.verifierContractId?.toString() ?? null,
        verifierFingerprint:
            info.verifierFingerprint == null
                ? null
                : encode(info.verifierFingerprint),
        trustAnchorId:
            info.trustAnchorId == null ? null : encode(info.trustAnchorId),
        nextMessageId: info.nextMessageId.toString(),
        ackedMessageId: info.ackedMessageId.toString(),
        receivedMessageId: info.receivedMessageId.toString(),
        createdTimestamp: info.createdTimestamp.toString(),
        modifiedTimestamp: info.modifiedTimestamp.toString(),
    };
};

export const getMirrorNodeClprConnector = async (
    params: GetMirrorNodeClprConnectorParams,
): Promise<MirrorNodeClprConnectorResponse> => {
    const query = new MirrorNodeClprConnectorQuery();
    if (params.channelId != null) {
        query.setChannelId(decode(params.channelId));
    }
    if (params.connectorId != null) {
        query.setConnectorId(decode(params.connectorId));
    }
    const info = await query.execute(sdk.getClient(params.sessionId));
    return {
        connectorId: encode(info.connectorId),
        channelId: encode(info.channelId),
        connectorContractId: info.connectorContractId?.toString() ?? null,
        adminKey: {
            _type: "ProtobufEncoded",
            key: encode(
                proto.Key.encode(info.adminKey._toProtobufKey()).finish(),
            ),
        },
        lockedStake: info.lockedStake.toTinybars().toString(),
        inFlightMessageCount: info.inFlightMessageCount.toString(),
        slashCount: info.slashCount.toString(),
        createdTimestamp: info.createdTimestamp.toString(),
    };
};
