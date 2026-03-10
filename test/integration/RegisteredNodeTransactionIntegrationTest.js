import {
    AccountId,
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    MirrorNodeServiceEndpoint,
    NodeUpdateTransaction,
    PrivateKey,
    RegisteredNodeCreateTransaction,
    RegisteredNodeDeleteTransaction,
    RegisteredNodeUpdateTransaction,
    RpcRelayServiceEndpoint,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

const RUN_ON_NETWORKS = new Set(["local-node", "localhost"]);

const describeIfSupported = RUN_ON_NETWORKS.has(process.env.HEDERA_NETWORK)
    ? describe
    : describe.skip;

describeIfSupported("RegisteredNodeTransactionIntegrationTest", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    afterAll(async function () {
        await env.close();
    });

    /**
     * @param {import("../../src/PrivateKey.js").default} adminKey
     * @param {import("../../src/node/RegisteredServiceEndpoint.js").default[]} endpoints
     * @param {string} description
     * @returns {Promise<import("long").default>}
     */
    async function createRegisteredNode(adminKey, endpoints, description) {
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setDescription(description)
                    .setServiceEndpoints(endpoints)
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);

        const createReceipt = await createResponse.getReceipt(env.client);
        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;
        expect(createReceipt.registeredNodeId.toNumber()).to.be.greaterThan(0);

        return createReceipt.registeredNodeId;
    }

    /**
     * @param {import("long").default | null} registeredNodeId
     * @param {import("../../src/PrivateKey.js").default} adminKey
     * @returns {Promise<void>}
     */
    async function deleteRegisteredNode(registeredNodeId, adminKey) {
        if (registeredNodeId == null) {
            return;
        }

        const deleteResponse = await (
            await (
                await new RegisteredNodeDeleteTransaction()
                    .setRegisteredNodeId(registeredNodeId)
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);

        const deleteReceipt = await deleteResponse.getReceipt(env.client);
        expect(deleteReceipt.status).to.equal(Status.Success);
    }

    it("should execute the registered node lifecycle with mixed endpoint types", async function () {
        let registeredNodeId = null;
        let adminKey = PrivateKey.generateED25519();

        try {
            const initialEndpoints = [
                new BlockNodeServiceEndpoint()
                    .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                    .setPort(443)
                    .setRequiresTls(true)
                    .setEndpointApi(BlockNodeApi.SubscribeStream),
                new MirrorNodeServiceEndpoint()
                    .setDomainName("mirror.initial.example")
                    .setPort(5600)
                    .setRequiresTls(true),
                new RpcRelayServiceEndpoint()
                    .setDomainName("rpc.initial.example")
                    .setPort(7546)
                    .setRequiresTls(false),
            ];

            registeredNodeId = await createRegisteredNode(
                adminKey,
                initialEndpoints,
                "HIP-1137 registered node",
            );

            const replacementEndpoints = [
                new BlockNodeServiceEndpoint()
                    .setDomainName("blocks.example.com")
                    .setPort(443)
                    .setRequiresTls(true)
                    .setEndpointApi(BlockNodeApi.Status),
                new MirrorNodeServiceEndpoint()
                    .setDomainName("mirror.updated.example")
                    .setPort(5601)
                    .setRequiresTls(true),
                new RpcRelayServiceEndpoint()
                    .setIpAddress(Uint8Array.of(10, 0, 0, 21))
                    .setPort(7546)
                    .setRequiresTls(false),
            ];

            const updateResponse = await (
                await (
                    await new RegisteredNodeUpdateTransaction()
                        .setRegisteredNodeId(registeredNodeId)
                        .setDescription("HIP-1137 registered node (updated)")
                        .setServiceEndpoints(replacementEndpoints)
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            const updateReceipt = await updateResponse.getReceipt(env.client);
            expect(updateReceipt.status).to.equal(Status.Success);

            const nextAdminKey = PrivateKey.generateED25519();
            const rotateAdminTransaction =
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(registeredNodeId)
                    .setAdminKey(nextAdminKey.publicKey)
                    .freezeWith(env.client);

            await rotateAdminTransaction.sign(adminKey);
            await rotateAdminTransaction.sign(nextAdminKey);

            const rotateAdminResponse = await rotateAdminTransaction.execute(
                env.client,
            );
            const rotateAdminReceipt = await rotateAdminResponse.getReceipt(
                env.client,
            );
            expect(rotateAdminReceipt.status).to.equal(Status.Success);

            adminKey = nextAdminKey;
        } finally {
            await deleteRegisteredNode(registeredNodeId, adminKey);
        }
    });

    it("should set and clear associated registered nodes on a consensus node", async function () {
        const CONSENSUS_OPERATOR_ACCOUNT_ID = "0.0.2";
        const CONSENSUS_OPERATOR_PRIVATE_KEY =
            "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137";
        const TARGET_NODE_ID = 0;

        let registeredNodeId = null;
        const adminKey = PrivateKey.generateED25519();

        const originalOperatorId = env.operatorId;
        const originalOperatorKey = env.operatorKey;

        try {
            registeredNodeId = await createRegisteredNode(
                adminKey,
                [
                    new BlockNodeServiceEndpoint()
                        .setDomainName("associate.example.com")
                        .setPort(443)
                        .setRequiresTls(true)
                        .setEndpointApi(BlockNodeApi.Publish),
                ],
                "Association target registered node",
            );

            const consensusOperatorId = AccountId.fromString(
                CONSENSUS_OPERATOR_ACCOUNT_ID,
            );
            const consensusOperatorKey = PrivateKey.fromStringED25519(
                CONSENSUS_OPERATOR_PRIVATE_KEY,
            );

            env.client.setOperator(consensusOperatorId, consensusOperatorKey);

            const associateResponse = await (
                await new NodeUpdateTransaction()
                    .setNodeId(TARGET_NODE_ID)
                    .setAssociatedRegisteredNodes([registeredNodeId])
                    .freezeWith(env.client)
            ).execute(env.client);
            const associateReceipt = await associateResponse.getReceipt(
                env.client,
            );
            expect(associateReceipt.status).to.equal(Status.Success);

            const clearResponse = await (
                await new NodeUpdateTransaction()
                    .setNodeId(TARGET_NODE_ID)
                    .clearAssociatedRegisteredNodes()
                    .freezeWith(env.client)
            ).execute(env.client);
            const clearReceipt = await clearResponse.getReceipt(env.client);
            expect(clearReceipt.status).to.equal(Status.Success);
        } finally {
            if (originalOperatorId != null && originalOperatorKey != null) {
                env.client.setOperator(originalOperatorId, originalOperatorKey);
            }

            await deleteRegisteredNode(registeredNodeId, adminKey);
        }
    });
});
