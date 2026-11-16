import { ClprThrottlesParams } from "../params/clpr";

export interface ClprTransactionResponse {
    readonly status: string;
}

export interface ClprCompletionResponse extends ClprTransactionResponse {
    readonly publicKey: string | null;
    readonly signature: string | null;
    readonly signatureScheme: string | null;
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
