export interface ServiceEndpointParams {
    readonly ipAddressV4?: string;
    readonly port?: number;
    readonly domainName?: string;
}

export interface CreateNodeParams {
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

export interface UpdateNodeParams {
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

export interface DeleteNodeParams {
    readonly nodeId?: string;
    readonly commonTransactionParams?: Record<string, any>;
}
