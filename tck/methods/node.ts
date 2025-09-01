import {
    NodeCreateTransaction,
    NodeUpdateTransaction,
    NodeDeleteTransaction,
    AccountId,
    ServiceEndpoint,
    Key,
} from "@hashgraph/sdk";
import Long from "long";

import { sdk } from "../sdk_data";
import { NodeResponse } from "../response/node";

import { getKeyFromString } from "../utils/key";
import { DEFAULT_GRPC_DEADLINE } from "../utils/constants/config";

import {
    CreateNodeParams,
    UpdateNodeParams,
    DeleteNodeParams,
    ServiceEndpointParams,
} from "../params/node";
import { applyCommonTransactionParams } from "../params/common-tx-params";

const createServiceEndpoint = (
    params: ServiceEndpointParams,
): ServiceEndpoint => {
    const endpoint = new ServiceEndpoint();

    if (params.ipAddressV4 != null) {
        // Convert string IP to Uint8Array
        const ipParts = params.ipAddressV4.split(".").map(Number);
        const ipBytes = new Uint8Array(ipParts);
        endpoint.setIpAddressV4(ipBytes);
    }

    if (params.port != null) {
        endpoint.setPort(params.port);
    }

    if (params.domainName != null) {
        endpoint.setDomainName(params.domainName);
    }

    return endpoint;
};

const stringToUint8Array = (str: string): Uint8Array => {
    return new TextEncoder().encode(str);
};

export const createNode = async ({
    accountId,
    description,
    gossipEndpoints,
    serviceEndpoints,
    gossipCaCertificate,
    grpcCertificateHash,
    grpcWebProxyEndpoint,
    adminKey,
    declineReward,
    commonTransactionParams,
}: CreateNodeParams): Promise<NodeResponse> => {
    let transaction = new NodeCreateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (accountId != null) {
        transaction.setAccountId(AccountId.fromString(accountId));
    }

    if (description != null) {
        transaction.setDescription(description);
    }

    if (gossipEndpoints != null) {
        const endpoints = gossipEndpoints.map(createServiceEndpoint);
        transaction.setGossipEndpoints(endpoints);
    }

    if (serviceEndpoints != null) {
        const endpoints = serviceEndpoints.map(createServiceEndpoint);
        transaction.setServiceEndpoints(endpoints);
    }

    if (gossipCaCertificate != null) {
        transaction.setGossipCaCertificate(
            stringToUint8Array(gossipCaCertificate),
        );
    }

    if (grpcCertificateHash != null) {
        transaction.setCertificateHash(stringToUint8Array(grpcCertificateHash));
    }

    if (grpcWebProxyEndpoint != null) {
        const endpoint = createServiceEndpoint(grpcWebProxyEndpoint);
        transaction.setGrpcWebProxyEndpoint(endpoint);
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (declineReward != null) {
        transaction.setDeclineReward(declineReward);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        nodeId: receipt.nodeId?.toString(),
        status: receipt.status.toString(),
    };
};

export const updateNode = async ({
    nodeId,
    description,
    gossipEndpoints,
    serviceEndpoints,
    gossipCaCertificate,
    grpcCertificateHash,
    grpcWebProxyEndpoint,
    adminKey,
    declineReward,
    commonTransactionParams,
}: UpdateNodeParams): Promise<NodeResponse> => {
    let transaction = new NodeUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (nodeId != null) {
        transaction.setNodeId(Long.fromNumber(parseInt(nodeId)));
    }

    if (description != null) {
        transaction.setDescription(description);
    }

    if (gossipEndpoints != null) {
        const endpoints = gossipEndpoints.map(createServiceEndpoint);
        transaction.setGossipEndpoints(endpoints);
    }

    if (serviceEndpoints != null) {
        const endpoints = serviceEndpoints.map(createServiceEndpoint);
        transaction.setServiceEndpoints(endpoints);
    }

    if (gossipCaCertificate != null) {
        transaction.setGossipCaCertificate(
            stringToUint8Array(gossipCaCertificate),
        );
    }

    if (grpcCertificateHash != null) {
        transaction.setCertificateHash(stringToUint8Array(grpcCertificateHash));
    }

    if (grpcWebProxyEndpoint != null) {
        const endpoint = createServiceEndpoint(grpcWebProxyEndpoint);
        transaction.setGrpcWebProxyEndpoint(endpoint);
    }

    if (adminKey != null) {
        transaction.setAdminKey(getKeyFromString(adminKey));
    }

    if (declineReward != null) {
        transaction.setDeclineReward(declineReward);
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};

export const deleteNode = async ({
    nodeId,
    commonTransactionParams,
}: DeleteNodeParams): Promise<NodeResponse> => {
    let transaction = new NodeDeleteTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (nodeId != null) {
        transaction.setNodeId(Long.fromNumber(parseInt(nodeId)));
    }

    if (commonTransactionParams != null) {
        applyCommonTransactionParams(
            commonTransactionParams,
            transaction,
            sdk.getClient(),
        );
    }

    const txResponse = await transaction.execute(sdk.getClient());
    const receipt = await txResponse.getReceipt(sdk.getClient());

    return {
        status: receipt.status.toString(),
    };
};
