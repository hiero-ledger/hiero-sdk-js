import {
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    GeneralServiceEndpoint,
    MirrorNodeServiceEndpoint,
    PrivateKey,
    RegisteredNodeDeleteTransaction,
    RegisteredNodeUpdateTransaction,
    RpcRelayServiceEndpoint,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import {
    createRegisteredNode,
    deleteRegisteredNode,
    expectStatusError,
    waitForRegisteredNode,
    waitForRegisteredNodeRemoval,
} from "./utils/RegisteredNodes.js";

describe("RegisteredNodeTransactionIntegrationTest", function () {
    /** @type {IntegrationTestEnv} */
    let env;

    /**
     * @type {{ registeredNodeId: import("long").default, adminKey: import("../../src/PrivateKey.js").default }[]}
     */
    let registeredNodeCleanup;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    beforeEach(function () {
        env.client.setOperator(env.genesisOperatorId, env.genesisOperatorKey);
        registeredNodeCleanup = [];
    });

    afterEach(async function () {
        for (const cleanup of registeredNodeCleanup.reverse()) {
            try {
                const receipt = await deleteRegisteredNode(
                    env.client,
                    cleanup.registeredNodeId,
                    cleanup.adminKey,
                );
                expect(receipt.status).to.equal(Status.Success);
            } catch (error) {
                if (error.status !== Status.InvalidRegisteredNodeId) {
                    throw error;
                }
            }
        }
    });

    afterAll(async function () {
        await env.close();
    });

    it("Given a valid admin key and a single block node service endpoint, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the TransactionReceipt contains a non-zero registeredNodeId", async function () {
        const adminKey = PrivateKey.generateED25519();
        const receipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeIpEndpoint(Uint8Array.of(127, 0, 0, 1), [
                BlockNodeApi.SubscribeStream,
                BlockNodeApi.Status,
            ]),
        ]);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;
        expect(receipt.registeredNodeId.toNumber()).to.be.greaterThan(0);
    });

    it("Given a valid admin key and a single mirror node service endpoint, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with a mirror node endpoint", async function () {
        const adminKey = PrivateKey.generateED25519();
        const receipt = await createAndTrackRegisteredNode(adminKey, [
            new MirrorNodeServiceEndpoint()
                .setDomainName("mirror.single.example")
                .setPort(5600)
                .setRequiresTls(true),
        ]);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            receipt.registeredNodeId,
            (node) => node.serviceEndpoints.length === 1,
            "appear with a single mirror node service endpoint",
        );

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].type).to.equal("mirrorNode");
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "mirror.single.example",
        );
    });

    it("Given a valid admin key and a single RPC relay service endpoint, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with an RPC relay endpoint", async function () {
        const adminKey = PrivateKey.generateED25519();
        const receipt = await createAndTrackRegisteredNode(adminKey, [
            new RpcRelayServiceEndpoint()
                .setDomainName("rpc.single.example")
                .setPort(7546)
                .setRequiresTls(false),
        ]);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            receipt.registeredNodeId,
            (node) => node.serviceEndpoints.length === 1,
            "appear with a single RPC relay service endpoint",
        );

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].type).to.equal("rpcRelay");
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "rpc.single.example",
        );
    });

    it("Given a valid admin key and a single general service endpoint with a description, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with a general service endpoint", async function () {
        const adminKey = PrivateKey.generateED25519();
        const receipt = await createAndTrackRegisteredNode(adminKey, [
            new GeneralServiceEndpoint()
                .setDomainName("archive.single.example")
                .setPort(8443)
                .setRequiresTls(true)
                .setDescription("Archive API"),
        ]);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            receipt.registeredNodeId,
            (node) => node.serviceEndpoints.length === 1,
            "appear with a single general service endpoint",
        );

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].type).to.equal(
            "generalService",
        );
        expect(registeredNode.serviceEndpoints[0].description).to.equal(
            "Archive API",
        );
    });

    it("Given a valid admin key and multiple service endpoints of mixed types (block node, mirror node, RPC relay, general service), when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and all endpoints are stored", async function () {
        const adminKey = PrivateKey.generateED25519();
        const receipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeIpEndpoint(Uint8Array.of(127, 0, 0, 1), [
                BlockNodeApi.SubscribeStream,
                BlockNodeApi.Status,
            ]),
            new MirrorNodeServiceEndpoint()
                .setDomainName("mirror.mixed.example")
                .setPort(5600)
                .setRequiresTls(true),
            new RpcRelayServiceEndpoint()
                .setDomainName("rpc.mixed.example")
                .setPort(7546)
                .setRequiresTls(false),
            new GeneralServiceEndpoint()
                .setDomainName("archive.mixed.example")
                .setPort(8443)
                .setRequiresTls(true)
                .setDescription("Archive API"),
        ]);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            receipt.registeredNodeId,
            (node) => node.serviceEndpoints.length === 4,
            "appear with all mixed endpoint types stored",
        );

        expect(
            registeredNode.serviceEndpoints.map((endpoint) => endpoint.type),
        ).to.deep.equal([
            "blockNode",
            "mirrorNode",
            "rpcRelay",
            "generalService",
        ]);
    });

    it("Given a valid admin key, a description, and service endpoints, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with the provided description", async function () {
        const adminKey = PrivateKey.generateED25519();
        const receipt = await createAndTrackRegisteredNode(
            adminKey,
            [
                makeBlockNodeDomainEndpoint("described.example.com", [
                    BlockNodeApi.Status,
                ]),
            ],
            "Described registered node",
        );

        const registeredNode = await waitForRegisteredNode(
            env.client,
            receipt.registeredNodeId,
            (node) => node.description === "Described registered node",
            "appear with the provided description",
        );

        expect(registeredNode.description).to.equal(
            "Described registered node",
        );
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction updates the description, then the description is replaced and the update succeeds", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(
            adminKey,
            [
                makeBlockNodeDomainEndpoint("description.before.example", [
                    BlockNodeApi.Status,
                ]),
            ],
            "Before update",
        );

        const response = await (
            await (
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .setDescription("After update")
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await response.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            createReceipt.registeredNodeId,
            (node) => node.description === "After update",
            "reflect the updated description",
        );

        expect(registeredNode.description).to.equal("After update");
        expect(registeredNode.serviceEndpoints).to.have.length(1);
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction replaces the service endpoints with a new list, then the old endpoints are replaced and the update succeeds", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeIpEndpoint(Uint8Array.of(127, 0, 0, 1), [
                BlockNodeApi.SubscribeStream,
            ]),
        ]);

        const replacementEndpoints = [
            new MirrorNodeServiceEndpoint()
                .setDomainName("mirror.replaced.example")
                .setPort(5601)
                .setRequiresTls(true),
            new RpcRelayServiceEndpoint()
                .setDomainName("rpc.replaced.example")
                .setPort(7547)
                .setRequiresTls(false),
        ];

        const response = await (
            await (
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .setServiceEndpoints(replacementEndpoints)
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await response.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            createReceipt.registeredNodeId,
            (node) =>
                node.serviceEndpoints.length === 2 &&
                node.serviceEndpoints[0].type === "mirrorNode" &&
                node.serviceEndpoints[1].type === "rpcRelay",
            "replace the original service endpoints",
        );

        expect(registeredNode.serviceEndpoints).to.have.length(2);
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "mirror.replaced.example",
        );
        expect(registeredNode.serviceEndpoints[1].domainName).to.equal(
            "rpc.replaced.example",
        );
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction sets a new admin key and the transaction is signed by both the old and new key, then the admin key is updated successfully", async function () {
        const adminKey = PrivateKey.generateED25519();
        const nextAdminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeDomainEndpoint("admin-rotation.example.com", [
                BlockNodeApi.Status,
            ]),
        ]);

        const transaction = await new RegisteredNodeUpdateTransaction()
            .setRegisteredNodeId(createReceipt.registeredNodeId)
            .setAdminKey(nextAdminKey.publicKey)
            .freezeWith(env.client);

        await transaction.sign(adminKey);
        await transaction.sign(nextAdminKey);

        const response = await transaction.execute(env.client);
        const receipt = await response.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        updateTrackedAdminKey(createReceipt.registeredNodeId, nextAdminKey);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            createReceipt.registeredNodeId,
            (node) =>
                node.adminKey.toString() === nextAdminKey.publicKey.toString(),
            "reflect the rotated admin key",
        );

        expect(registeredNode.adminKey.toString()).to.equal(
            nextAdminKey.publicKey.toString(),
        );
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction sets a new admin key but only the old admin key signs, then the transaction fails with a receipt status of INVALID_SIGNATURE", async function () {
        const adminKey = PrivateKey.generateED25519();
        const nextAdminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeDomainEndpoint("missing-signature.example.com", [
                BlockNodeApi.Status,
            ]),
        ]);

        await expectStatusError(async () => {
            const response = await (
                await (
                    await new RegisteredNodeUpdateTransaction()
                        .setRegisteredNodeId(createReceipt.registeredNodeId)
                        .setAdminKey(nextAdminKey.publicKey)
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            return response.getReceipt(env.client);
        }, Status.InvalidSignature);
    });

    it("Given a RegisteredNodeUpdateTransaction targeting a non-existent registeredNodeId, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_NODE_ID", async function () {
        await expectStatusError(async () => {
            const response = await new RegisteredNodeUpdateTransaction()
                .setRegisteredNodeId(999999999)
                .setDescription("non-existent registered node")
                .execute(env.client);

            return response.getReceipt(env.client);
        }, Status.InvalidRegisteredNodeId);
    });

    it("Given an existing registered node, when a RegisteredNodeDeleteTransaction is executed and signed by the admin key, then the registered node is removed from the address book", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeDomainEndpoint("delete-me.example.com", [
                BlockNodeApi.Status,
            ]),
        ]);

        const deleteReceipt = await deleteRegisteredNode(
            env.client,
            createReceipt.registeredNodeId,
            adminKey,
        );

        expect(deleteReceipt.status).to.equal(Status.Success);
        untrackRegisteredNode(createReceipt.registeredNodeId);

        await waitForRegisteredNodeRemoval(
            env.client,
            createReceipt.registeredNodeId,
        );
    });

    it("Given a registered node that has already been deleted, when a RegisteredNodeDeleteTransaction is executed for the same registeredNodeId, then the transaction fails with a receipt status of INVALID_REGISTERED_NODE_ID", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeDomainEndpoint("delete-twice.example.com", [
                BlockNodeApi.Status,
            ]),
        ]);

        const deleteReceipt = await deleteRegisteredNode(
            env.client,
            createReceipt.registeredNodeId,
            adminKey,
        );

        expect(deleteReceipt.status).to.equal(Status.Success);
        untrackRegisteredNode(createReceipt.registeredNodeId);
        await waitForRegisteredNodeRemoval(
            env.client,
            createReceipt.registeredNodeId,
        );

        await expectStatusError(async () => {
            const response = await (
                await (
                    await new RegisteredNodeDeleteTransaction()
                        .setRegisteredNodeId(createReceipt.registeredNodeId)
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            return response.getReceipt(env.client);
        }, Status.InvalidRegisteredNodeId);
    });

    it("Given a RegisteredNodeDeleteTransaction targeting a non-existent registeredNodeId, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_NODE_ID", async function () {
        await expectStatusError(async () => {
            const response = await new RegisteredNodeDeleteTransaction()
                .setRegisteredNodeId(999999999)
                .execute(env.client);

            return response.getReceipt(env.client);
        }, Status.InvalidRegisteredNodeId);
    });

    it("Given an existing registered node created with an IP address endpoint, when a RegisteredNodeUpdateTransaction replaces it with a domain name endpoint, then the update succeeds and the endpoint uses the new domain name", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createReceipt = await createAndTrackRegisteredNode(adminKey, [
            makeBlockNodeIpEndpoint(Uint8Array.of(127, 0, 0, 1), [
                BlockNodeApi.SubscribeStream,
            ]),
        ]);

        const response = await (
            await (
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .setServiceEndpoints([
                        makeBlockNodeDomainEndpoint(
                            "blocks.updated.example.com",
                            [BlockNodeApi.Status],
                        ),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await response.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        const registeredNode = await waitForRegisteredNode(
            env.client,
            createReceipt.registeredNodeId,
            (node) =>
                node.serviceEndpoints[0]?.domainName ===
                "blocks.updated.example.com",
            "replace the IP address endpoint with a domain endpoint",
        );

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "blocks.updated.example.com",
        );
        expect(registeredNode.serviceEndpoints[0].ipAddress).to.be.null;
    });

    function trackRegisteredNode(registeredNodeId, adminKey) {
        registeredNodeCleanup.push({ registeredNodeId, adminKey });
    }

    function updateTrackedAdminKey(registeredNodeId, adminKey) {
        const cleanup = registeredNodeCleanup.find((entry) =>
            entry.registeredNodeId.eq(registeredNodeId),
        );

        if (cleanup != null) {
            cleanup.adminKey = adminKey;
        }
    }

    function untrackRegisteredNode(registeredNodeId) {
        registeredNodeCleanup = registeredNodeCleanup.filter(
            (entry) => !entry.registeredNodeId.eq(registeredNodeId),
        );
    }

    async function createAndTrackRegisteredNode(
        adminKey,
        serviceEndpoints,
        description = null,
    ) {
        const receipt = await createRegisteredNode(
            env.client,
            adminKey,
            serviceEndpoints,
            description,
        );

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;
        trackRegisteredNode(receipt.registeredNodeId, adminKey);

        return receipt;
    }

    function makeBlockNodeIpEndpoint(ipAddress, endpointApis) {
        return new BlockNodeServiceEndpoint()
            .setIpAddress(ipAddress)
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApis(endpointApis);
    }

    function makeBlockNodeDomainEndpoint(domainName, endpointApis) {
        return new BlockNodeServiceEndpoint()
            .setDomainName(domainName)
            .setPort(443)
            .setRequiresTls(true)
            .setEndpointApis(endpointApis);
    }
});
