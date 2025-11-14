import { BaseParams, BaseTransactionParams } from "./base";

export interface ServiceEndpointParams extends BaseParams {
    readonly ipAddressV4?: string;
    readonly port?: number;
    readonly domainName?: string;
}

export interface CreateNodeParams extends BaseTransactionParams {
    readonly accountId?: string;
    readonly description?: string;
    readonly gossipEndpoints?: ServiceEndpointParams[];
    readonly serviceEndpoints?: ServiceEndpointParams[];
    readonly gossipCaCertificate?: string;
    readonly grpcCertificateHash?: string;
    readonly grpcWebProxyEndpoint?: ServiceEndpointParams;
    readonly adminKey?: string;
    readonly declineReward?: boolean;
}

export interface UpdateNodeParams extends BaseTransactionParams {
    readonly accountId?: string;
    readonly nodeId?: string;
    readonly description?: string;
    readonly gossipEndpoints?: ServiceEndpointParams[];
    readonly serviceEndpoints?: ServiceEndpointParams[];
    readonly gossipCaCertificate?: string;
    readonly grpcCertificateHash?: string;
    readonly grpcWebProxyEndpoint?: ServiceEndpointParams;
    readonly adminKey?: string;
    readonly declineReward?: boolean;
}

export interface DeleteNodeParams extends BaseTransactionParams {
    readonly nodeId?: string;
}
