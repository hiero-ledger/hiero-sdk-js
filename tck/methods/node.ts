import {
    NodeCreateTransaction,
    NodeUpdateTransaction,
    NodeDeleteTransaction,
    AccountId,
    ServiceEndpoint,
    Key,
} from "@hiero-ledger/sdk";
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
import { decode } from "../utils/hex";

const createServiceEndpoint = (
    params: ServiceEndpointParams,
): ServiceEndpoint => {
    const endpoint = new ServiceEndpoint();

    if (params.ipAddressV4 != null) {
        // Convert string IP to Uint8Array
        const ipBytes = Buffer.from(params.ipAddressV4, "hex");
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
    sessionId,
}: CreateNodeParams): Promise<NodeResponse> => {
    const client = sdk.getClient(sessionId);
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
        transaction.setGossipCaCertificate(decode(gossipCaCertificate));
    }

    if (grpcCertificateHash != null) {
        transaction.setCertificateHash(decode(grpcCertificateHash));
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
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        nodeId: receipt.nodeId?.toString(),
        status: receipt.status.toString(),
    };
};

export const updateNode = async ({
    accountId,
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
    sessionId,
}: UpdateNodeParams): Promise<NodeResponse> => {
    const client = sdk.getClient(sessionId);
    let transaction = new NodeUpdateTransaction().setGrpcDeadline(
        DEFAULT_GRPC_DEADLINE,
    );

    if (accountId != null) {
        transaction.setAccountId(AccountId.fromString(accountId));
    }

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
        transaction.setGossipCaCertificate(decode(gossipCaCertificate));
    }

    if (grpcCertificateHash != null) {
        transaction.setCertificateHash(decode(grpcCertificateHash));
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
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};

export const deleteNode = async ({
    nodeId,
    commonTransactionParams,
    sessionId,
}: DeleteNodeParams): Promise<NodeResponse> => {
    const client = sdk.getClient(sessionId);
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
            client,
        );
    }

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return {
        status: receipt.status.toString(),
    };
};
