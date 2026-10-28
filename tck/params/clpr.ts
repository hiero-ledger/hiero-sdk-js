import { BaseParams, BaseTransactionParams } from "./base";

/** Hex bytes have no 0x prefix. An empty byte string is "". */
export interface RegisterClprChannelParams extends BaseTransactionParams {
    readonly ownershipCommitment?: string;
}

export interface CompleteClprChannelParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly ownershipPrivateKey?: string;
    readonly verifierContract?: string;
    readonly configProofBytes?: string;
    readonly endpointManifestProofBytes?: string;
}

export interface CloseClprChannelParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly ownershipCommitment?: string;
}

export interface SubmitClprBundleParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly bundlePayload?: string;
}

export interface RegisterClprConnectorParams extends BaseTransactionParams {
    readonly commitment?: string;
}

export interface CompleteClprConnectorParams extends BaseTransactionParams {
    readonly channelId?: string;
    readonly connectorId?: string;
    readonly salt?: string;
    readonly ownershipPrivateKey?: string;
    readonly connectorContract?: string;
    readonly adminKey?: string;
    /** Decimal tinybars, passed to Hbar without converting to a number. */
    readonly lockedStake?: string;
}

export interface DeregisterClprConnectorParams extends BaseTransactionParams {
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

export type GetClprLedgerConfigurationParams = BaseParams;
export type GetClprEndpointManifestParams = BaseParams;
