import { setTimeout } from "timers/promises";
import {
    AccountId,
    NodeUpdateTransaction,
    PrivateKey,
    ServiceEndpoint,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

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
        const MIRROR_NODE_API_BASE_URL =
            "http://localhost:5551/api/v1/network/nodes";
        const API_RESPONSE_DELAY_MS = 2500;
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
                    .setNodeId(0)
                    .setDeclineReward(false)
                    .setGrpcWebProxyEndpoint(updatedGrpcEndpoint)
                    .freezeWith(env.client)
            ).execute(env.client)
        ).getReceipt(env.client);

        await setTimeout(API_RESPONSE_DELAY_MS);
        const firstResponse = await fetch(
            `${MIRROR_NODE_API_BASE_URL}?node.id=${TARGET_NODE_ID}`,
        );
        const firstNodeData = await firstResponse.json();
        expect(firstNodeData.nodes[0].grpc_proxy_endpoint.domainName).toEqual(
            updatedGrpcEndpoint.domainName,
        );

        await (
            await (
                await new NodeUpdateTransaction()
                    .setNodeId(0)
                    .setDeclineReward(false)
                    .clearGrpcWebProxyEndpoint()
                    .freezeWith(env.client)
            ).execute(env.client)
        ).getReceipt(env.client);

        await setTimeout(API_RESPONSE_DELAY_MS);
        const secondResponse = await fetch(
            `${MIRROR_NODE_API_BASE_URL}?node.id=${TARGET_NODE_ID}`,
        );
        const secondNodeData = await secondResponse.json();
        expect(secondNodeData.nodes[0].grpc_proxy_endpoint.domainName).toEqual(
            undefined,
        );
    });

    afterAll(async function () {
        await env.close();
    });
});
