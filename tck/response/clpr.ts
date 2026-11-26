import { ClprThrottlesParams } from "../params/clpr";

export interface ClprTransactionResponse {
    readonly status: string;
}

export interface ClprLedgerConfigurationResponse {
    readonly protocolVersion: number;
    readonly chainId: string;
    readonly serviceAddress: string;
    /** Consensus timestamp as seconds.nanoseconds. */
    readonly timestamp: string;
    readonly throttles: ClprThrottlesParams;
    readonly initialTrustAnchor: string;
    readonly initialTrustAnchorId: string;
    /** Hex bytes, or "" when no signed snapshot is available. */
    readonly configurationStateProof: string;
}

export interface ClprEndpointResponse {
    readonly serviceEndpoint: {
        readonly ipAddress: string;
        readonly port: number;
    };
    readonly tlsCertificate: string;
    readonly accountId: string;
}

export interface ClprEndpointManifestResponse {
    /** Unsigned uint64 decimal string. */
    readonly version: string;
    readonly serviceAddress: string;
    readonly endpoints: ClprEndpointResponse[];
    /** Hex bytes, or "" when no signed snapshot is available. */
    readonly manifestStateProof: string;
}

export interface MirrorNodeClprChannelResponse {
    readonly channelId: string;
    readonly chainId: string;
    readonly status: string;
    /** Null when the mirror node returns null. */
    readonly verifierContractId: string | null;
    readonly verifierFingerprint: string | null;
    readonly trustAnchorId: string | null;
    /** Unsigned uint64 decimal strings. */
    readonly nextMessageId: string;
    readonly ackedMessageId: string;
    readonly receivedMessageId: string;
    readonly createdTimestamp: string;
    readonly modifiedTimestamp: string;
}

export interface MirrorNodeClprConnectorResponse {
    readonly connectorId: string;
    readonly channelId: string;
    /** Null when the mirror node returns null. */
    readonly connectorContractId: string | null;
    /** Complete protobuf Key bytes, including composite key structure. */
    readonly adminKey: {
        readonly _type: "ProtobufEncoded";
        readonly key: string;
    };
    /** Decimal tinybars. */
    readonly lockedStake: string;
    /** Unsigned uint64 decimal strings. */
    readonly inFlightMessageCount: string;
    readonly slashCount: string;
    readonly createdTimestamp: string;
}
