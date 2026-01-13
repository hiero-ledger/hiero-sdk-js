import { AddressBookQuery } from "@hiero-ledger/sdk";

import { sdk } from "../sdk_data";
import {
    AddressBookResponse,
    NodeAddress,
    ServiceEndpoint,
} from "../response/network";
import { GetAddressBookParams } from "../params/network";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";

/**
 * Converts IPv4Address to hex string format
 */
const ipv4ToHex = (ipv4Address: any): string | undefined => {
    if (!ipv4Address) {
        return undefined;
    }

    // If it's already a string (domain name), return undefined
    if (typeof ipv4Address === "string") {
        return undefined;
    }

    // Convert IPv4Address to Uint8Array via _toProtobuf
    const bytes = ipv4Address._toProtobuf();
    if (!bytes || bytes.length !== 4) {
        return undefined;
    }

    // Convert bytes to hex string
    return Array.from(bytes)
        .map((byte) => Number(byte).toString(16).padStart(2, "0"))
        .join("");
};

/**
 * Maps SDK NodeAddress to TCK response format
 */
const mapNodeAddress = (nodeAddress: any): NodeAddress => {
    const serviceEndpoints: ServiceEndpoint[] = (nodeAddress.addresses || [])
        .map((endpoint: any) => {
            const address = endpoint.address;
            const port = endpoint.port;

            // Port is required per spec (1-65535), but handle missing port gracefully
            if (port == null) {
                return null;
            }

            // Check if address is a domain name (string) or IPv4Address
            // ipAddressV4 and domainName are mutually exclusive per spec
            let ipAddressV4: string | undefined;
            let domainName: string | undefined;

            if (typeof address === "string") {
                domainName = address;
            } else if (address) {
                ipAddressV4 = ipv4ToHex(address);
            }

            // Filter out endpoints without valid IP or domain
            if (!ipAddressV4 && !domainName) {
                return null;
            }

            const serviceEndpoint: ServiceEndpoint = {
                port: port,
                ...(domainName ? { domainName } : {}),
                ...(ipAddressV4 ? { ipAddressV4 } : {}),
            };

            return serviceEndpoint;
        })
        .filter((endpoint): endpoint is ServiceEndpoint => endpoint != null);

    return {
        nodeId: nodeAddress.nodeId != null ? nodeAddress.nodeId.toNumber() : 0,
        accountId:
            nodeAddress.accountId != null
                ? nodeAddress.accountId.toString()
                : "",
        serviceEndpoints,
        rsaPublicKey: nodeAddress.publicKey || null,
        nodeCertHash:
            nodeAddress.certHash != null
                ? Buffer.from(nodeAddress.certHash).toString("hex")
                : null,
        description: nodeAddress.description || null,
    };
};

/**
 * Queries the Hedera network address book to retrieve node addresses and network information.
 *
 * @param params - Parameters including optional fileId and limit
 * @returns Address book response with node addresses
 */
export const getAddressBook = async ({
    fileId,
    limit,
    sessionId,
}: GetAddressBookParams): Promise<AddressBookResponse> => {
    const client = sdk.getClient(sessionId);
    const query = new AddressBookQuery()
        .setGrpcDeadline(DEFAULT_GRPC_DEADLINE)
        .setMaxAttempts(1); // Set to 1 to fail fast on invalid fileIds

    // Validate and set fileId if provided
    if (fileId != null) {
        // Basic validation for fileId format (should be "shard.realm.num")
        const fileIdPattern = /^\d+\.\d+\.\d+$/;
        if (!fileIdPattern.test(fileId)) {
            throw new Error(`Invalid fileId format: ${fileId}`);
        }
        query.setFileId(fileId);
    }

    // Validate and set limit if provided
    if (limit != null) {
        if (limit < 0) {
            throw new Error("Limit cannot be negative");
        }
        query.setLimit(limit);
    }

    const response = await query.execute(client);
    const nodeAddresses = (response.nodeAddresses || []).map(mapNodeAddress);

    return {
        nodeAddresses,
    };
};
