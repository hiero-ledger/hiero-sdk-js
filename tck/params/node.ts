import { BaseParams } from "./base";

export interface ServiceEndpointParams extends BaseParams {
    readonly ipAddressV4?: string;
    readonly port?: number;
    readonly domainName?: string;
}

export interface CreateNodeParams extends BaseParams {
    readonly accountId?: string;
    readonly description?: string;
    readonly gossipEndpoints?: ServiceEndpointParams[];
    readonly serviceEndpoints?: ServiceEndpointParams[];
    readonly gossipCaCertificate?: string;
    readonly grpcCertificateHash?: string;
    readonly grpcWebProxyEndpoint?: ServiceEndpointParams;
    readonly adminKey?: string;
    readonly declineReward?: boolean;
    readonly commonTransactionParams?: Record<string, any>;
}

export interface UpdateNodeParams extends BaseParams {
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
    readonly commonTransactionParams?: Record<string, any>;
}

export interface DeleteNodeParams extends BaseParams {
    readonly nodeId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
