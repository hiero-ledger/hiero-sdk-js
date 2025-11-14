import {
    Client,
    PrivateKey,
    AccountId,
    NodeCreateTransaction,
    NodeUpdateTransaction,
    NodeDeleteTransaction,
    ServiceEndpoint,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const network = process.env.HEDERA_NETWORK;
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const client = Client.forName(network).setOperator(operatorId, operatorKey);

    // Transaction parameters
    const accountId = AccountId.fromString("0.0.999");
    const description = "This is a description of the node.";
    const newDescription = "This is new a description of the node.";
    const ipAddressV4 = Uint8Array.of(127, 0, 0, 1);
    const port = 50211;
    const grpcProxyIpAddressV4 = Uint8Array.of(127, 0, 0, 1);
    const grpcProxyPort = 443;
    const gossipEndpoint = new ServiceEndpoint()
        .setIpAddressV4(ipAddressV4)
        .setPort(port);
    const gossipEndpoints = [gossipEndpoint];
    const serviceEndpoint = new ServiceEndpoint()
        .setIpAddressV4(ipAddressV4)
        .setPort(port);
    const serviceEndpoints = [serviceEndpoint];
    const gossipCaCertificate = new Uint8Array();
    const certificateHash = new Uint8Array();
    const grpcWebProxyEndpoint = new ServiceEndpoint()
        .setIpAddressV4(grpcProxyIpAddressV4)
        .setPort(grpcProxyPort);
    const adminKey = PrivateKey.generate();

    // 1. Create a new node
    console.log("Creating a new node...");
    const createTransaction = new NodeCreateTransaction()
        .setAccountId(accountId)
        .setDescription(description)
        .setGossipEndpoints(gossipEndpoints)
        .setServiceEndpoints(serviceEndpoints)
        .setGossipCaCertificate(gossipCaCertificate)
        .setCertificateHash(certificateHash)
        .setAdminKey(adminKey)
        .setDeclineReward(false)
        .setGrpcWebProxyEndpoint(grpcWebProxyEndpoint);

    const createTransactionResponse = await createTransaction.execute(client);
    const createTransactionReceipt =
        await createTransactionResponse.getReceipt(client);
    const nodeId = createTransactionReceipt.nodeId;
    console.log(
        `Node create transaction status: ${createTransactionReceipt.status.toString()}`,
    );
    console.log(
        `Node has been created successfully with node id: ${nodeId.toString()}`,
    );

    // 2. Update the node
    console.log("Updating the node...");
    const updateTransaction = new NodeUpdateTransaction()
        .setNodeId(nodeId)
        .setDescription(newDescription)
        .setDeclineReward(true);
    const updateTrasnactionResponse = await updateTransaction.execute(client);
    const updateTrasnactionReceipt =
        await updateTrasnactionResponse.getReceipt(client);
    console.log(
        `Node update transaction status: ${updateTrasnactionReceipt.status.toString()}`,
    );

    // 3. Delete the node
    console.log("Deleting the node...");
    const deleteTransaction = new NodeDeleteTransaction().setNodeId(nodeId);
    const deleteTransactionResponse = await deleteTransaction.execute(client);
    const deleteTransactionReceipt =
        await deleteTransactionResponse.getReceipt(client);
    console.log(
        `Node delete transaction status: ${deleteTransactionReceipt.status.toString()}`,
    );

    client.close();
}

void main();
