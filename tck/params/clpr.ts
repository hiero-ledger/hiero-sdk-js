import { BaseParams, BaseTransactionParams } from "./base";

/** Hex bytes have no 0x prefix. An empty byte string is "". */
export interface CreateClprChannelParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly salt?: string;
    readonly peerVerifier?: string;
    readonly verifierContract?: string;
    readonly configProofBytes?: string;
    readonly endpointManifestProofBytes?: string;
}

export interface DeleteClprChannelParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly ownershipCommitment?: string;
}

export interface SubmitClprBundleParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly bundlePayload?: string;
    /** Decimal uint64; set only for admin manifest recovery. */
    readonly expectedCachedManifestVersion?: string;
}

export interface CreateClprConnectorParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly connectorId?: string;
    readonly salt?: string;
    readonly identityKey?: string;
    readonly connectorContract?: string;
    readonly adminKey?: string;
    /** Decimal tinybars, passed to Hbar without converting to a number. */
    readonly lockedStake?: string;
}

export interface DeleteClprConnectorParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly connectorId?: string;
    readonly stakeRecipient?: string;
}

export interface ClprThrottlesParams {
    readonly maxMessagesPerBundle: number;
    readonly maxMessagePayloadBytes: number;
    /** Unsigned uint64 decimal string. */
    readonly maxGasPerMessage: string;
    readonly maxQueueDepth: number;
    /** Unsigned uint64 decimal string. */
    readonly maxSyncBytes: string;
    readonly maxLocalEndpoints: number;
    readonly maxPeerEndpoints: number;
}

export interface UpdateClprLedgerConfigurationParams
    extends BaseTransactionParams {
    readonly throttles?: ClprThrottlesParams;
}

export interface GetClprLedgerConfigurationParams extends BaseParams {
    /** Decimal tinybars, using the SDK's normal query payment controls. */
    readonly queryPayment?: string;
    readonly maxQueryPayment?: string;
}
export interface GetClprEndpointManifestParams
    extends GetClprLedgerConfigurationParams {
    readonly forManifestRecovery?: boolean;
}

export interface GetMirrorNodeClprChannelParams extends BaseParams {
    /** 32-byte ID as hex without 0x. */
    readonly channelId?: string;
}

export interface GetMirrorNodeClprConnectorParams
    extends GetMirrorNodeClprChannelParams {
    readonly connectorId?: string;
}
