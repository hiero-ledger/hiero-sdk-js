import {
    BlockNodeApi,
    BlockNodeServiceEndpoint,
    GeneralServiceEndpoint,
    MirrorNodeServiceEndpoint,
    PrivateKey,
    RegisteredNodeAddressBookQuery,
    RegisteredNodeCreateTransaction,
    RegisteredNodeDeleteTransaction,
    RegisteredNodeUpdateTransaction,
    RpcRelayServiceEndpoint,
    Status,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";

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
                const deleteResponse = await (
                    await (
                        await new RegisteredNodeDeleteTransaction()
                            .setRegisteredNodeId(cleanup.registeredNodeId)
                            .freezeWith(env.client)
                    ).sign(cleanup.adminKey)
                ).execute(env.client);
                const deleteReceipt = await deleteResponse.getReceipt(
                    env.client,
                );

                expect(deleteReceipt.status).to.equal(Status.Success);
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
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([
                                BlockNodeApi.SubscribeStream,
                                BlockNodeApi.Status,
                            ]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await createResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;
        expect(Number(receipt.registeredNodeId.toString())).to.be.greaterThan(
            0,
        );

        registeredNodeCleanup.push({
            registeredNodeId: receipt.registeredNodeId,
            adminKey,
        });
    });

    it("Given a valid admin key and a single mirror node service endpoint, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with a mirror node endpoint", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new MirrorNodeServiceEndpoint()
                            .setDomainName("mirror.single.example")
                            .setPort(5600)
                            .setRequiresTls(true),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await createResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: receipt.registeredNodeId,
            adminKey,
        });

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                    receipt.registeredNodeId.toString(),
            ) ?? null;

        if (
            registeredNode == null ||
            registeredNode.serviceEndpoints.length !== 1
        ) {
            throw new Error(
                `Expected registered node ${receipt.registeredNodeId.toString()} to appear with a single mirror node service endpoint after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].type).to.equal("mirrorNode");
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "mirror.single.example",
        );
    });

    it("Given a valid admin key and a single RPC relay service endpoint, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with an RPC relay endpoint", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new RpcRelayServiceEndpoint()
                            .setDomainName("rpc.single.example")
                            .setPort(7546)
                            .setRequiresTls(false),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await createResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: receipt.registeredNodeId,
            adminKey,
        });

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                    receipt.registeredNodeId.toString(),
            ) ?? null;

        if (
            registeredNode == null ||
            registeredNode.serviceEndpoints.length !== 1
        ) {
            throw new Error(
                `Expected registered node ${receipt.registeredNodeId.toString()} to appear with a single RPC relay service endpoint after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].type).to.equal("rpcRelay");
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "rpc.single.example",
        );
    });

    it("Given a valid admin key and a single general service endpoint with a description, when a RegisteredNodeCreateTransaction is executed, then the transaction succeeds and the registered node is created with a general service endpoint", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new GeneralServiceEndpoint()
                            .setDomainName("archive.single.example")
                            .setPort(8443)
                            .setRequiresTls(true)
                            .setDescription("Archive API"),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await createResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: receipt.registeredNodeId,
            adminKey,
        });

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                    receipt.registeredNodeId.toString(),
            ) ?? null;

        if (
            registeredNode == null ||
            registeredNode.serviceEndpoints.length !== 1
        ) {
            throw new Error(
                `Expected registered node ${receipt.registeredNodeId.toString()} to appear with a single general service endpoint after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

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
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([
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
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await createResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: receipt.registeredNodeId,
            adminKey,
        });

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                    receipt.registeredNodeId.toString(),
            ) ?? null;

        if (
            registeredNode == null ||
            registeredNode.serviceEndpoints.length !== 4
        ) {
            throw new Error(
                `Expected registered node ${receipt.registeredNodeId.toString()} to appear with all mixed endpoint types stored after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

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
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setDescription("Described registered node")
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("described.example.com")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await createResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);
        expect(receipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: receipt.registeredNodeId,
            adminKey,
        });

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                        receipt.registeredNodeId.toString() &&
                    node.description === "Described registered node",
            ) ?? null;

        if (registeredNode == null) {
            throw new Error(
                `Expected registered node ${receipt.registeredNodeId.toString()} to appear with the provided description after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

        expect(registeredNode.description).to.equal(
            "Described registered node",
        );
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction updates the description, then the description is replaced and the update succeeds", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setDescription("Before update")
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("description.before.example")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        const updateResponse = await (
            await (
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .setDescription("After update")
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await updateResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                        createReceipt.registeredNodeId.toString() &&
                    node.description === "After update",
            ) ?? null;

        if (registeredNode == null) {
            throw new Error(
                `Expected registered node ${createReceipt.registeredNodeId.toString()} to reflect the updated description after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

        expect(registeredNode.description).to.equal("After update");
        expect(registeredNode.serviceEndpoints).to.have.length(1);
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction replaces the service endpoints with a new list, then the old endpoints are replaced and the update succeeds", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.SubscribeStream]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        const updateResponse = await (
            await (
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .setServiceEndpoints([
                        new MirrorNodeServiceEndpoint()
                            .setDomainName("mirror.replaced.example")
                            .setPort(5601)
                            .setRequiresTls(true),
                        new RpcRelayServiceEndpoint()
                            .setDomainName("rpc.replaced.example")
                            .setPort(7547)
                            .setRequiresTls(false),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await updateResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                        createReceipt.registeredNodeId.toString() &&
                    node.serviceEndpoints.length === 2 &&
                    node.serviceEndpoints[0].type === "mirrorNode" &&
                    node.serviceEndpoints[1].type === "rpcRelay",
            ) ?? null;

        if (registeredNode == null) {
            throw new Error(
                `Expected registered node ${createReceipt.registeredNodeId.toString()} to replace the original service endpoints after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

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
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("admin-rotation.example.com")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        const transaction = await new RegisteredNodeUpdateTransaction()
            .setRegisteredNodeId(createReceipt.registeredNodeId)
            .setAdminKey(nextAdminKey.publicKey)
            .freezeWith(env.client);

        await transaction.sign(adminKey);
        await transaction.sign(nextAdminKey);

        const updateResponse = await transaction.execute(env.client);
        const receipt = await updateResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        const cleanup = registeredNodeCleanup.find(
            (entry) =>
                entry.registeredNodeId.toString() ===
                createReceipt.registeredNodeId.toString(),
        );

        if (cleanup != null) {
            cleanup.adminKey = nextAdminKey;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                        createReceipt.registeredNodeId.toString() &&
                    node.adminKey.toString() ===
                        nextAdminKey.publicKey.toString(),
            ) ?? null;

        if (registeredNode == null) {
            throw new Error(
                `Expected registered node ${createReceipt.registeredNodeId.toString()} to reflect the rotated admin key after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

        expect(registeredNode.adminKey.toString()).to.equal(
            nextAdminKey.publicKey.toString(),
        );
    });

    it("Given an existing registered node, when a RegisteredNodeUpdateTransaction sets a new admin key but only the old admin key signs, then the transaction fails with a receipt status of INVALID_SIGNATURE", async function () {
        const adminKey = PrivateKey.generateED25519();
        const nextAdminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("missing-signature.example.com")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        try {
            const response = await (
                await (
                    await new RegisteredNodeUpdateTransaction()
                        .setRegisteredNodeId(createReceipt.registeredNodeId)
                        .setAdminKey(nextAdminKey.publicKey)
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidSignature.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidSignature);
        }
    });

    it("Given a RegisteredNodeCreateTransaction with no admin key set, when the transaction is executed, then the transaction fails with a precheck status of KEY_REQUIRED", async function () {
        try {
            const response = await new RegisteredNodeCreateTransaction()
                .setServiceEndpoints([
                    new BlockNodeServiceEndpoint()
                        .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                        .setPort(443)
                        .setRequiresTls(true)
                        .setEndpointApis([BlockNodeApi.Status]),
                ])
                .execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(`Expected status ${Status.KeyRequired.toString()}.`);
        } catch (error) {
            expect(error.status).to.equal(Status.KeyRequired);
        }
    });

    it("Given a RegisteredNodeCreateTransaction with an empty service endpoints list, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_ENDPOINT", async function () {
        const adminKey = PrivateKey.generateED25519();
        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setServiceEndpoints([])
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredEndpoint.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidRegisteredEndpoint);
        }
    });

    it("Given a RegisteredNodeUpdateTransaction targeting a non-existent registeredNodeId, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_NODE_ID", async function () {
        try {
            const response = await new RegisteredNodeUpdateTransaction()
                .setRegisteredNodeId(999999999)
                .setDescription("non-existent registered node")
                .execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredNodeId.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidRegisteredNodeId);
        }
    });

    it("Given an existing registered node, when a RegisteredNodeDeleteTransaction is executed and signed by the admin key, then the registered node is removed from the address book", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("delete-me.example.com")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        const deleteResponse = await (
            await (
                await new RegisteredNodeDeleteTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const deleteReceipt = await deleteResponse.getReceipt(env.client);

        expect(deleteReceipt.status).to.equal(Status.Success);
        registeredNodeCleanup = registeredNodeCleanup.filter(
            (entry) =>
                entry.registeredNodeId.toString() !==
                createReceipt.registeredNodeId.toString(),
        );

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode = addressBook.registeredNodes.find(
            (node) =>
                node.registeredNodeId.toString() ===
                createReceipt.registeredNodeId.toString(),
        );

        if (registeredNode != null) {
            throw new Error(
                `Expected registered node ${createReceipt.registeredNodeId.toString()} to be removed from the mirror node after waiting 5000ms, but it was still present. Address book size: ${
                    addressBook.registeredNodes.length
                }.`,
            );
        }
    });

    it("Given a registered node that has already been deleted, when a RegisteredNodeDeleteTransaction is executed for the same registeredNodeId, then the transaction fails with a receipt status of INVALID_REGISTERED_NODE_ID", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("delete-twice.example.com")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        const deleteResponse = await (
            await (
                await new RegisteredNodeDeleteTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const deleteReceipt = await deleteResponse.getReceipt(env.client);

        expect(deleteReceipt.status).to.equal(Status.Success);
        registeredNodeCleanup = registeredNodeCleanup.filter(
            (entry) =>
                entry.registeredNodeId.toString() !==
                createReceipt.registeredNodeId.toString(),
        );

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode = addressBook.registeredNodes.find(
            (node) =>
                node.registeredNodeId.toString() ===
                createReceipt.registeredNodeId.toString(),
        );

        if (registeredNode != null) {
            throw new Error(
                `Expected registered node ${createReceipt.registeredNodeId.toString()} to be removed from the mirror node after waiting 5000ms, but it was still present. Address book size: ${
                    addressBook.registeredNodes.length
                }.`,
            );
        }

        try {
            const secondDeleteResponse = await (
                await (
                    await new RegisteredNodeDeleteTransaction()
                        .setRegisteredNodeId(createReceipt.registeredNodeId)
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await secondDeleteResponse.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredNodeId.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidRegisteredNodeId);
        }
    });

    it("Given a RegisteredNodeDeleteTransaction targeting a non-existent registeredNodeId, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_NODE_ID", async function () {
        try {
            const response = await new RegisteredNodeDeleteTransaction()
                .setRegisteredNodeId(999999999)
                .execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredNodeId.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidRegisteredNodeId);
        }
    });

    // -------------------------------------------------------------------------
    // Backfill: integration coverage for response codes the SDK no longer
    // pre-checks (port range, address shape, endpoint count). Each test sends
    // a Create transaction with a deliberately-malformed field and asserts
    // the consensus node returns the documented status from the HIP-1137
    // "Response Codes" section.
    // -------------------------------------------------------------------------

    it("Given a RegisteredNodeCreateTransaction with a port out of range, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_ENDPOINT", async function () {
        const adminKey = PrivateKey.generateED25519();
        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setServiceEndpoints([
                            new BlockNodeServiceEndpoint()
                                .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                                .setPort(99999)
                                .setRequiresTls(true)
                                .setEndpointApis([BlockNodeApi.Status]),
                        ])
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredEndpoint.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidRegisteredEndpoint);
        }
    });

    it("Given a RegisteredNodeCreateTransaction whose endpoint has neither an IP address nor a domain name, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_ENDPOINT", async function () {
        const adminKey = PrivateKey.generateED25519();
        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setServiceEndpoints([
                            new BlockNodeServiceEndpoint()
                                .setPort(443)
                                .setRequiresTls(true)
                                .setEndpointApis([BlockNodeApi.Status]),
                        ])
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredEndpoint.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(Status.InvalidRegisteredEndpoint);
        }
    });

    it("Given a RegisteredNodeCreateTransaction whose endpoint has an IP address that is not 4 or 16 bytes, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_ENDPOINT_ADDRESS", async function () {
        const adminKey = PrivateKey.generateED25519();
        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setServiceEndpoints([
                            new BlockNodeServiceEndpoint()
                                .setIpAddress(Uint8Array.of(1, 2, 3))
                                .setPort(443)
                                .setRequiresTls(true)
                                .setEndpointApis([BlockNodeApi.Status]),
                        ])
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredEndpointAddress.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(
                Status.InvalidRegisteredEndpointAddress,
            );
        }
    });

    it("Given a RegisteredNodeCreateTransaction whose endpoint has a domain name longer than 250 ASCII characters, when the transaction is executed, then the transaction fails with a receipt status of INVALID_REGISTERED_ENDPOINT_ADDRESS", async function () {
        const adminKey = PrivateKey.generateED25519();
        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setServiceEndpoints([
                            new BlockNodeServiceEndpoint()
                                .setDomainName("a".repeat(251))
                                .setPort(443)
                                .setRequiresTls(true)
                                .setEndpointApis([BlockNodeApi.Status]),
                        ])
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.InvalidRegisteredEndpointAddress.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(
                Status.InvalidRegisteredEndpointAddress,
            );
        }
    });

    it("Given a RegisteredNodeCreateTransaction with more than 50 service endpoints, when the transaction is executed, then the transaction fails with a receipt status of REGISTERED_ENDPOINTS_EXCEEDED_LIMIT", async function () {
        const adminKey = PrivateKey.generateED25519();
        const endpoints = [];
        for (let i = 0; i < 51; i++) {
            endpoints.push(
                new BlockNodeServiceEndpoint()
                    .setDomainName(`endpoint-${i}.example.com`)
                    .setPort(443)
                    .setRequiresTls(true)
                    .setEndpointApis([BlockNodeApi.Status]),
            );
        }

        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setServiceEndpoints(endpoints)
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail(
                `Expected status ${Status.RegisteredEndpointsExceededLimit.toString()}.`,
            );
        } catch (error) {
            expect(error.status).to.equal(
                Status.RegisteredEndpointsExceededLimit,
            );
        }
    });

    // The HIP-1137 "Response Codes" section does not enumerate a specific
    // status for description-too-long. The proto defines the 100-byte UTF-8
    // limit and the consensus node enforces it, but we don't yet know what
    // it returns. Skipped pending an empirical run against testnet/solo —
    // un-skip and pin the actual `Status.X` once observed. If the network
    // silently accepts/truncates, raise that as a HIP follow-up.
    it.skip("Given a RegisteredNodeCreateTransaction with a description longer than 100 UTF-8 bytes, when the transaction is executed, then the transaction fails with the consensus-node-defined status", async function () {
        const adminKey = PrivateKey.generateED25519();
        try {
            const response = await (
                await (
                    await new RegisteredNodeCreateTransaction()
                        .setAdminKey(adminKey.publicKey)
                        .setDescription("a".repeat(101))
                        .setServiceEndpoints([
                            new BlockNodeServiceEndpoint()
                                .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                                .setPort(443)
                                .setRequiresTls(true)
                                .setEndpointApis([BlockNodeApi.Status]),
                        ])
                        .freezeWith(env.client)
                ).sign(adminKey)
            ).execute(env.client);

            await response.getReceipt(env.client);
            expect.fail("Expected the consensus node to reject the request.");
        } catch (error) {
            // TODO: pin the actual status once observed empirically.
            expect(error).to.be.an("error");
        }
    });

    it("Given an existing registered node created with an IP address endpoint, when a RegisteredNodeUpdateTransaction replaces it with a domain name endpoint, then the update succeeds and the endpoint uses the new domain name", async function () {
        const adminKey = PrivateKey.generateED25519();
        const createResponse = await (
            await (
                await new RegisteredNodeCreateTransaction()
                    .setAdminKey(adminKey.publicKey)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setIpAddress(Uint8Array.of(127, 0, 0, 1))
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.SubscribeStream]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const createReceipt = await createResponse.getReceipt(env.client);

        expect(createReceipt.status).to.equal(Status.Success);
        expect(createReceipt.registeredNodeId).to.not.be.null;

        registeredNodeCleanup.push({
            registeredNodeId: createReceipt.registeredNodeId,
            adminKey,
        });

        const updateResponse = await (
            await (
                await new RegisteredNodeUpdateTransaction()
                    .setRegisteredNodeId(createReceipt.registeredNodeId)
                    .setServiceEndpoints([
                        new BlockNodeServiceEndpoint()
                            .setDomainName("blocks.updated.example.com")
                            .setPort(443)
                            .setRequiresTls(true)
                            .setEndpointApis([BlockNodeApi.Status]),
                    ])
                    .freezeWith(env.client)
            ).sign(adminKey)
        ).execute(env.client);
        const receipt = await updateResponse.getReceipt(env.client);

        expect(receipt.status).to.equal(Status.Success);

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(100)
            .execute(env.client);
        const registeredNode =
            addressBook.registeredNodes.find(
                (node) =>
                    node.registeredNodeId.toString() ===
                        createReceipt.registeredNodeId.toString() &&
                    node.serviceEndpoints[0]?.domainName ===
                        "blocks.updated.example.com",
            ) ?? null;

        if (registeredNode == null) {
            throw new Error(
                `Expected registered node ${createReceipt.registeredNodeId.toString()} to replace the IP address endpoint with a domain endpoint after waiting 5000ms, but it was not observed. Address book size: ${
                    addressBook.registeredNodes.length
                }. Registered node ids: ${addressBook.registeredNodes
                    .map((node) => node.registeredNodeId.toString())
                    .join(", ")}.`,
            );
        }

        expect(registeredNode.serviceEndpoints).to.have.length(1);
        expect(registeredNode.serviceEndpoints[0].domainName).to.equal(
            "blocks.updated.example.com",
        );
        expect(registeredNode.serviceEndpoints[0].ipAddress).to.be.null;
    });
});
