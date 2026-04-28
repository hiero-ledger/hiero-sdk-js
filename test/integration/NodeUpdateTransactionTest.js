import {
    AccountId,
    NodeUpdateTransaction,
    PrivateKey,
    ServiceEndpoint,
} from "../../src/exports.js";
import { AddressBookQuery } from "../../src/index.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

const getNodeAddress = async (client, nodeId) => {
    const addressBook = await new AddressBookQuery()
        .setFileId("0.0.102")
        .execute(client);

    return (
        addressBook.nodeAddresses.find(
            (nodeAddress) =>
                nodeAddress.nodeId != null &&
                nodeAddress.nodeId.toInt() === nodeId,
        ) ?? null
    );
};

const waitForNodeDescription = async (client, nodeId, expectedDescription) => {
    let lastDescription = null;

    for (let attempt = 0; attempt < 10; attempt++) {
        const nodeAddress = await getNodeAddress(client, nodeId);

        if (
            nodeAddress != null &&
            nodeAddress.description === expectedDescription
        ) {
            return nodeAddress;
        }

        lastDescription = nodeAddress != null ? nodeAddress.description : null;
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(
        `Expected node ${nodeId} description to remain "${expectedDescription}", got "${lastDescription}" instead.`,
    );
};

// eslint-disable-next-line vitest/no-disabled-tests
describe("NodeUpdateTransaction", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should create and update a network node", async function () {
        // Constants for better readability
        const OPERATOR_ACCOUNT_ID = "0.0.2";
        const OPERATOR_PRIVATE_KEY =
            "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137";
        const TEST_DOMAIN_NAME = "test.com";
        const TEST_PORT = 123456;
        const TARGET_NODE_ID = 0;

        // Set the operator to be account 0.0.2
        const operatorPrivateKey =
            PrivateKey.fromStringED25519(OPERATOR_PRIVATE_KEY);
        const operatorAccount = AccountId.fromString(OPERATOR_ACCOUNT_ID);

        env.client.setOperator(operatorAccount, operatorPrivateKey);

        // Update the node
        const updatedGrpcEndpoint = new ServiceEndpoint()
            .setDomainName(TEST_DOMAIN_NAME)
            .setPort(TEST_PORT);

        await (
            await (
                await new NodeUpdateTransaction()
                    .setNodeId(TARGET_NODE_ID)
                    .setDeclineReward(false)
                    .setGrpcWebProxyEndpoint(updatedGrpcEndpoint)
                    .freezeWith(env.client)
            ).execute(env.client)
        ).getReceipt(env.client);

        await (
            await (
                await new NodeUpdateTransaction()
                    .setNodeId(TARGET_NODE_ID)
                    .setDeclineReward(false)
                    .deleteGrpcWebProxyEndpoint()
                    .freezeWith(env.client)
            ).execute(env.client)
        ).getReceipt(env.client);
    });

    it("should preserve the node description when description is not set", async function () {
        env.client.setOperator(env.genesisOperatorId, env.genesisOperatorKey);

        const addressBook = await new AddressBookQuery()
            .setFileId("0.0.102")
            .execute(env.client);
        const nodeAddress = addressBook.nodeAddresses.find(
            (entry) => entry.nodeId != null && entry.description != null,
        );

        if (nodeAddress == null) {
            this.skip();
            return;
        }

        const targetNodeId = nodeAddress.nodeId.toInt();
        const originalDescription = nodeAddress.description;
        const updatedGrpcEndpoint = new ServiceEndpoint()
            .setDomainName("description-regression.test")
            .setPort(123456);

        try {
            await (
                await (
                    await new NodeUpdateTransaction()
                        .setNodeId(targetNodeId)
                        .setGrpcWebProxyEndpoint(updatedGrpcEndpoint)
                        .freezeWith(env.client)
                ).execute(env.client)
            ).getReceipt(env.client);

            const updatedNodeAddress = await waitForNodeDescription(
                env.client,
                targetNodeId,
                originalDescription,
            );

            expect(updatedNodeAddress.description).to.equal(
                originalDescription,
            );
        } finally {
            await (
                await (
                    await new NodeUpdateTransaction()
                        .setNodeId(targetNodeId)
                        .deleteGrpcWebProxyEndpoint()
                        .freezeWith(env.client)
                ).execute(env.client)
            ).getReceipt(env.client);
        }
    });

    afterAll(async function () {
        await env.close();
    });
});
