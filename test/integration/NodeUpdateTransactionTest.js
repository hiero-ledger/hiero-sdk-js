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

    afterAll(async function () {
        await env.close();
    });
});
