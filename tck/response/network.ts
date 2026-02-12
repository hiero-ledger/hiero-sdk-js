export interface ServiceEndpoint {
    readonly ipAddressV4?: string;
    readonly domainName?: string;
    readonly port: number;
}

export interface NodeAddress {
    readonly nodeId: number;
    readonly accountId: string;
    readonly serviceEndpoints: ServiceEndpoint[];
    readonly rsaPublicKey?: string | null;
    readonly nodeCertHash?: string | null;
    readonly description?: string | null;
}

export interface AddressBookResponse {
    readonly nodeAddresses: NodeAddress[];
}
