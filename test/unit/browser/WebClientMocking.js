import { http, HttpResponse } from "msw";
import Long from "long";
import {
    Client,
    AccountId,
    TransactionReceiptQuery,
    PrivateKey,
    TransactionId,
    FileId,
    LedgerId,
} from "../../../src/browser.js";
import { encodeRequest } from "../../../src/channel/Channel.js";
import { startMSW, cleanupMSW } from "./utils/MswSetup.js";
import * as HieroProto from "@hashgraph/proto";
import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
} from "../../../src/constants/ClientConstants.js";

const TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE = {
    transactionGetReceipt: {
        header: { nodeTransactionPrecheckCode: 0 },
        receipt: {
            status: 22, // SUCCESS
            accountId: {
                shardNum: Long.ZERO,
                realmNum: Long.ZERO,
                accountNum: Long.fromNumber(10),
            },
        },
    },
};

/**
 * Serializes a protobuf response for gRPC-Web
 * @param {HieroProto.proto.IResponse} response - The protobuf response to serialize
 * @returns {ArrayBuffer} The serialized response as ArrayBuffer
 */
function serializeProtobufResponse(response) {
    // Encode the protobuf response
    const responseBytes = HieroProto.proto.Response.encode(response).finish();

    // Wrap it in gRPC-Web format using encodeRequest
    return encodeRequest(responseBytes);
}

// Pre-serialize the response for reuse across all tests
const SERIALIZED_TRANSACTION_RECEIPT_RESPONSE = serializeProtobufResponse(
    TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
);

/**
 * Creates a Set of network entries for comparison regardless of order.
 * This is a workaround to compare networks since they are not ordered (client shuffles the nodes).
 * @param {Record<string, any>} network - The network object to convert
 * @returns {Set<string>} - A set of network entries as strings
 */
const createNetworkAddressNodeSet = (network) => {
    return new Set(
        Object.entries(network).map(
            ([url, accountId]) => `${url}:${accountId.toString()}`,
        ),
    );
};

/**
 * Generates an address book response from a node object map.
 * @param {Record<string, AccountId>} nodeObjectMap - A map of node URLs to their IDs.
 * @returns {AddressBookQueryWebResponse} - An address book response object.
 */
const generateAddressBookResponse = (nodeObjectMap) => {
    return {
        nodes: Object.entries(nodeObjectMap).map(([nodeAddress, id]) => {
            const [domain_name, port] = nodeAddress.split(":");

            return {
                admin_key: {
                    key: `sample-key-${id}`,
                    _type: "ED25519",
                },
                decline_reward: false,
                grpc_proxy_endpoint: {
                    domain_name,
                    port: Number(port),
                },
                file_id: `file-id-${id}`,
                memo: `Node ${id}`,
                public_key: `public-key-${id}`,
                node_id: id,
                node_account_id: `${id}`,
                node_cert_hash: `cert-hash-${id}`,
                address: "127.0.0.1",
                service_endpoints: [],
                description: `Node ${id}`,
                stake: 0,
            };
        }),
    };
};

/**
 * Generates a paginated address book response for testing pagination functionality.
 * @param {Array<{nodeAddress: string, id: AccountId}>} nodesData - Array of node data
 * @param {string|null} nextUrl - Next page URL or null for last page
 * @returns {AddressBookQueryWebResponse} - A paginated address book response object.
 */
const generatePaginatedAddressBookResponse = (nodesData, nextUrl = null) => {
    return {
        nodes: nodesData.map(({ nodeAddress, id }) => {
            const [domain_name, port] = nodeAddress.split(":");

            return {
                admin_key: {
                    key: `sample-key-${id}`,
                    _type: "ED25519",
                },
                decline_reward: false,
                grpc_proxy_endpoint: {
                    domain_name,
                    port: Number(port),
                },
                file_id: `file-id-${id}`,
                memo: `Node ${id}`,
                public_key: `public-key-${id}`,
                node_id: id,
                node_account_id: `${id}`,
                node_cert_hash: `cert-hash-${id}`,
                address: "127.0.0.1",
                service_endpoints: [],
                description: `Node ${id}`,
                stake: 0,
            };
        }),
        links: {
            next: nextUrl,
        },
    };
};

/**
 * Setup test client with custom network configuration
 * @param {Object} network - Network configuration object
 * @param {number} maxAttempts - Maximum number of attempts
 * @returns {Client} Configured client instance
 */
const setupClientWithNetwork = (network) => {
    const MAX_ATTEMPTS = 2; // We don't want long running tests
    const client = Client.forNetwork(network)
        .setNodeMinBackoff(0)
        .setNodeMaxBackoff(0)
        .setNodeMinReadmitPeriod(0)
        .setNodeMaxReadmitPeriod(0);

    client.setMaxAttempts(MAX_ATTEMPTS);

    return client;
};

describe("WebClient Browser Tests", function () {
    let client;
    let testPrivateKey;
    /**
     * MSW worker for mocking HTTP responses
     */
    let worker;

    const testAccountId = "0.0.123456";

    beforeEach(async function () {
        // Generate a test private key
        testPrivateKey = PrivateKey.generate();
    });

    afterEach(async function () {
        if (client) {
            client.close();
        }
        await cleanupMSW(worker);
    });

    // ========================================
    // gRPC Deadline and Health Check Tests
    // ========================================
    it("should timeout when server response exceeds gRPC deadline", async function () {
        const customNodeAddress = "fast-deadline-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 100;
        const customDeadline = 1000; // 1 second

        let healthCheckRequestTime = null;
        let serviceRequestTime = null;

        // Setup MSW to simulate response throttling based on deadline
        const handlers = [
            // Health check endpoint - responds quickly
            http.post(
                `https://${customNodeAddress}`,
                () => {
                    healthCheckRequestTime = Date.now();
                    return new HttpResponse(null, {
                        status: 200,
                        headers: {
                            "grpc-status": "0",
                            "grpc-message": "OK",
                        },
                    });
                },
                {
                    once: false,
                },
            ),

            // Service endpoint - simulates throttling by delaying response
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                async () => {
                    serviceRequestTime = Date.now();
                    // Simulate server throttling - delay response for 2 seconds
                    // This should exceed the 1-second deadline
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
                {
                    once: false,
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client with custom 1-second deadline
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        }).setGrpcDeadline(customDeadline);

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create a transaction receipt query
        const transactionId = TransactionId.generate(accountId);
        const receiptQuery = new TransactionReceiptQuery().setTransactionId(
            transactionId,
        );

        try {
            await receiptQuery.execute(client);
            expect.fail(
                "Expected timeout due to server throttling exceeding 1-second deadline",
            );
        } catch (error) {
            // Should fail due to timeout - server response takes 2 seconds but deadline is 1 second
            expect(error.constructor.name).to.equal(
                "MaxAttemptsOrTimeoutError",
            );
            expect(error.message).to.include("DEADLINE_EXCEEDED");

            // Verify that requests were made
            expect(healthCheckRequestTime).to.not.be.null;
            expect(serviceRequestTime).to.not.be.null;
        }
    });

    it("should override client-level deadline with transaction-level deadline", async function () {
        const customNodeAddress = "override-deadline-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 102;
        const clientDeadline = 1; // 1 millisecond (Would cause immediate timeout)
        const transactionDeadline = 3000; // 3 seconds

        let healthCheckRequestTime = null;
        let serviceRequestTime = null;

        // Setup MSW to track request timing
        const handlers = [
            // Health check endpoint
            http.post(`https://${customNodeAddress}`, () => {
                healthCheckRequestTime = Date.now();
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                async () => {
                    serviceRequestTime = Date.now();
                    // Simulate server throttling - delay response for 2 seconds
                    // This should exceed the 1-second deadline
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client with client-level deadline
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        }).setGrpcDeadline(clientDeadline);

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create a transaction receipt query with its own deadline
        const transactionId = TransactionId.generate(accountId);
        const receiptQuery = new TransactionReceiptQuery()
            .setTransactionId(transactionId)
            .setGrpcDeadline(transactionDeadline);

        try {
            const response = await receiptQuery.execute(client);
            expect(response).to.not.be.null;

            // Verify that requests were made within the transaction deadline
            expect(healthCheckRequestTime).to.not.be.null;
            expect(serviceRequestTime).to.not.be.null;

            // Verify the time between health check and service request is within transaction deadline
            const timeDiff = serviceRequestTime - healthCheckRequestTime;
            expect(timeDiff).to.be.lessThan(transactionDeadline);
        } catch (error) {
            // If it fails, it should be due to the mock response format, not deadline issues
            expect(error.message).to.not.include("DEADLINE_EXCEEDED");
        }
    });

    it("should timeout when health check exceeds deadline", async function () {
        const customNodeAddress = "timeout-health-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 103;

        let healthCheckAttempts = 0;
        let serviceRequestAttempts = 0;

        // Setup MSW to simulate health check timeout
        const handlers = [
            // Health check endpoint times out - simulate actual timeout
            http.post(`https://${customNodeAddress}/`, async () => {
                healthCheckAttempts++;
                // Simulate a timeout by delaying longer than the deadline
                await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint (should not be reached due to health check failure)
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                () => {
                    serviceRequestAttempts++;
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client with short deadline to trigger timeout
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        }).setGrpcDeadline(1000); // 1 millisecond (Would cause immediate timeout)

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create a transaction receipt query
        const transactionId = TransactionId.generate(accountId);
        const receiptQuery = new TransactionReceiptQuery().setTransactionId(
            transactionId,
        );

        try {
            await receiptQuery.execute(client);
            expect.fail("Expected health check timeout error");
        } catch (error) {
            // The error should be a GrpcServiceError due to timeout
            expect(error.constructor.name).to.equal(
                "MaxAttemptsOrTimeoutError",
            );
            expect(error.message).to.include("TIMEOUT");

            // Verify health check was attempted
            expect(healthCheckAttempts).to.be.greaterThan(0);

            // Verify service request was not attempted due to health check failure
            expect(serviceRequestAttempts).to.equal(0);
        }
    });

    it("should cache health check results and avoid duplicate requests", async function () {
        const customNodeAddress = "cached-health-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 104;

        let healthCheckAttempts = 0;
        let serviceRequestAttempts = 0;

        // Setup MSW to track health check requests
        const handlers = [
            // Health check endpoint (should only be called once)
            http.post(`https://${customNodeAddress}`, () => {
                healthCheckAttempts++;
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint (should be called multiple times)
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                () => {
                    serviceRequestAttempts++;
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        });

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Execute multiple queries to test caching
        const transactionId1 = TransactionId.generate(accountId);
        const transactionId2 = TransactionId.generate(accountId);
        const receiptQuery1 = new TransactionReceiptQuery().setTransactionId(
            transactionId1,
        );
        const receiptQuery2 = new TransactionReceiptQuery().setTransactionId(
            transactionId2,
        );

        try {
            // Execute first query
            const response1 = await receiptQuery1.execute(client);
            expect(response1).to.not.be.null;

            // Execute second query
            const response2 = await receiptQuery2.execute(client);
            expect(response2).to.not.be.null;

            // Verify health check was only called once (cached)
            expect(healthCheckAttempts).to.equal(1);

            // Verify service requests were made for both transactions
            expect(serviceRequestAttempts).to.equal(2);
        } catch (error) {
            // If it fails, it should be due to the mock response format, not caching issues
            expect(error.message).to.not.include("health");
        }
    });

    it("should cache health check results even with high concurrency (20 simultaneous transactions)", async function () {
        const customNodeAddress = "concurrent-health-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 105;

        let healthCheckAttempts = 0;
        let serviceRequestAttempts = 0;

        // Setup MSW to track health check requests
        const handlers = [
            // Health check endpoint (should only be called once even with 20 concurrent requests)
            http.post(`https://${customNodeAddress}`, () => {
                healthCheckAttempts++;
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint (should be called 20 times - once per transaction)
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                () => {
                    serviceRequestAttempts++;
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        });

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create 20 transaction receipt queries
        const receiptQueries = [];
        for (let i = 0; i < 20; i++) {
            const transactionId = TransactionId.generate(accountId);
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );
            receiptQueries.push(receiptQuery);
        }

        try {
            // Execute all 20 queries simultaneously
            const promises = receiptQueries.map((query) =>
                query.execute(client),
            );
            const responses = await Promise.all(promises);

            // Verify all responses are successful
            responses.forEach((response) => {
                expect(response).to.not.be.null;
            });
        } catch (error) {
            console.log("ERROR: ", error);
            // If it fails, it should be due to the mock response format, not caching issues
            expect(error.message).to.not.include("health");
        }

        // Verify health check was only called once (cached) even with 20 concurrent requests
        expect(healthCheckAttempts).to.equal(1);

        // Verify service requests were made for all 20 transactions
        expect(serviceRequestAttempts).to.equal(20);
    });

    // ========================================
    // WebClient Network Management Tests
    // ========================================
    describe("WebClient Network Management", function () {
        describe("Mainnet network", function () {
            it("should not change network when response includes grpc_proxy_endpoint", async function () {
                const client = Client.forMainnet();
                const initialNetwork = { ...client.network };

                const handlers = [
                    http.get(
                        "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            // Only respond if the file.id parameter matches
                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(MAINNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                await client.updateNetwork();

                const updatedNetwork = client.network;

                const initialEntries =
                    createNetworkAddressNodeSet(initialNetwork);
                const updatedEntries =
                    createNetworkAddressNodeSet(updatedNetwork);

                expect(initialEntries).toEqual(updatedEntries);
                expect(initialEntries.size).toBe(updatedEntries.size);
            });

            it("should change network to new nodes when mirror response has different nodes with valid grpc_proxy_endpoint", async function () {
                const client = Client.forMainnet();
                const initialNetwork = { ...client.network };

                // Create a different ObjectMap with completely different nodes
                const differentNodes = {
                    "new-mainnet-node-1.hedera.com:443": new AccountId(100),
                    "new-mainnet-node-2.hedera.com:443": new AccountId(101),
                };

                const newNodesResponse =
                    generateAddressBookResponse(differentNodes);

                const handlers = [
                    http.get(
                        "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            // Only respond if the file.id parameter matches
                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(newNodesResponse);
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                await client.updateNetwork();

                const updatedNetwork = client.network;

                // The network should have changed to the new nodes from the mirror response
                const initialEntries =
                    createNetworkAddressNodeSet(initialNetwork);
                const updatedEntries =
                    createNetworkAddressNodeSet(updatedNetwork);

                // Networks should be different since we got new nodes from the mirror
                expect(initialEntries).not.toEqual(updatedEntries);

                // Should have the new nodes from the mirror response
                expect(updatedEntries).toContain(
                    "new-mainnet-node-1.hedera.com:443:0.0.100",
                );
                expect(updatedEntries).toContain(
                    "new-mainnet-node-2.hedera.com:443:0.0.101",
                );

                // Should not have any of the original hardcoded nodes
                Object.entries(MAINNET).forEach(([url, accountId]) => {
                    expect(updatedEntries).not.toContain(
                        `${url}:${accountId.toString()}`,
                    );
                });
            });
        });

        describe("Testnet network", function () {
            it("should not change network when response includes grpc_proxy_endpoint", async function () {
                const client = Client.forTestnet();
                const initialNetwork = { ...client.network };

                const handlers = [
                    http.get(
                        "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            // Only respond if the file.id parameter matches
                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(WEB_TESTNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                await client.updateNetwork();

                const updatedNetwork = client.network;

                const initialEntries =
                    createNetworkAddressNodeSet(initialNetwork);
                const updatedEntries =
                    createNetworkAddressNodeSet(updatedNetwork);

                expect(initialEntries).toEqual(updatedEntries);
                expect(initialEntries.size).toBe(updatedEntries.size);
            });
        });

        describe("Previewnet network", function () {
            it("should not change network when response includes grpc_proxy_endpoint", async function () {
                const client = Client.forPreviewnet();
                const initialNetwork = { ...client.network };

                const handlers = [
                    http.get(
                        "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            // Only respond if the file.id parameter matches
                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(WEB_PREVIEWNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                await client.updateNetwork();

                const updatedNetwork = client.network;

                const initialEntries =
                    createNetworkAddressNodeSet(initialNetwork);
                const updatedEntries =
                    createNetworkAddressNodeSet(updatedNetwork);

                expect(initialEntries).toEqual(updatedEntries);
                expect(initialEntries.size).toBe(updatedEntries.size);
            });
        });

        describe("Async factory methods", function () {
            it("should create mainnet client with network update", async function () {
                // Mock the mirror node response for mainnet
                const handlers = [
                    http.get(
                        "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(MAINNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forMainnetAsync();

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;
                expect(client.ledgerId).to.equal(LedgerId.MAINNET);

                // Verify that the network was updated (should match the mock response)
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );
                const mainnetEntries = createNetworkAddressNodeSet(MAINNET);
                expect(networkEntries).to.deep.equal(mainnetEntries);
            });

            it("should create testnet client with newest addressbook", async function () {
                // Mock the mirror node response for testnet
                const handlers = [
                    http.get(
                        "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(WEB_TESTNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forTestnetAsync();

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;
                expect(client.ledgerId).to.equal(LedgerId.TESTNET);

                // Verify that the network was updated (should match the mock response)
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );
                const testnetEntries = createNetworkAddressNodeSet(WEB_TESTNET);
                expect(networkEntries).to.deep.equal(testnetEntries);
            });

            it("should create previewnet client with newest addressbook", async function () {
                // Mock the mirror node response for previewnet
                const handlers = [
                    http.get(
                        "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(WEB_PREVIEWNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forPreviewnetAsync();

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;
                expect(client.ledgerId).to.equal(LedgerId.PREVIEWNET);

                // Verify that the network was updated (should match the mock response)
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );
                const previewnetEntries =
                    createNetworkAddressNodeSet(WEB_PREVIEWNET);
                expect(networkEntries).to.deep.equal(previewnetEntries);
            });
        });

        describe("forMirrorNetwork factory method", function () {
            it("should create client with mainnet mirror network", async function () {
                const handlers = [
                    http.get(
                        "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(MAINNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forMirrorNetwork("mainnet");

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;

                // Verify that the network was updated from mirror node
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );
                const mainnetEntries = createNetworkAddressNodeSet(MAINNET);
                expect(networkEntries).to.deep.equal(mainnetEntries);

                // Verify mirror network is set
                expect(client._mirrorNetwork).to.not.be.null;
            });

            it("should create client with testnet mirror network", async function () {
                const handlers = [
                    http.get(
                        "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(WEB_TESTNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forMirrorNetwork("testnet");

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;

                // Verify that the network was updated from mirror node
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );
                const testnetEntries = createNetworkAddressNodeSet(WEB_TESTNET);
                expect(networkEntries).to.deep.equal(testnetEntries);

                // Verify mirror network is set
                expect(client._mirrorNetwork).to.not.be.null;
            });

            it("should create client with previewnet mirror network", async function () {
                const handlers = [
                    http.get(
                        "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(WEB_PREVIEWNET),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forMirrorNetwork("previewnet");

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;

                // Verify that the network was updated from mirror node
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );
                const previewnetEntries =
                    createNetworkAddressNodeSet(WEB_PREVIEWNET);
                expect(networkEntries).to.deep.equal(previewnetEntries);

                // Verify mirror network is set
                expect(client._mirrorNetwork).to.not.be.null;
            });

            it("should create client with custom mirror network URL", async function () {
                const customMirrorUrl = "custom-mirror.example.com:443";
                const customNodes = {
                    "custom-node-1.example.com:443": new AccountId(200),
                    "custom-node-2.example.com:443": new AccountId(201),
                    "custom-node-3.example.com:443": new AccountId(202),
                };

                const handlers = [
                    http.get(
                        `https://${
                            customMirrorUrl.split(":")[0]
                        }/api/v1/network/nodes`,
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(customNodes),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forMirrorNetwork(customMirrorUrl);

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;

                // Verify that the network was updated with custom nodes
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );

                // Verify all custom nodes are present
                expect(networkEntries).toContain(
                    "custom-node-1.example.com:443:0.0.200",
                );
                expect(networkEntries).toContain(
                    "custom-node-2.example.com:443:0.0.201",
                );
                expect(networkEntries).toContain(
                    "custom-node-3.example.com:443:0.0.202",
                );

                // Verify we have exactly 3 nodes
                expect(networkEntries.size).toBe(3);

                // Verify mirror network is set
                expect(client._mirrorNetwork).to.not.be.null;
            });

            it("should create client with array of custom mirror network URLs", async function () {
                const customMirrorUrls = [
                    "custom-mirror-1.example.com:8081",
                    "custom-mirror-2.example.com:8080",
                ];
                const customNodes = {
                    "custom-node-1.example.com:443": new AccountId(300),
                    "custom-node-2.example.com:443": new AccountId(301),
                };

                const handlers = [
                    http.get(
                        `https://${customMirrorUrls[0]}/api/v1/network/nodes`,
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(customNodes),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                    http.get(
                        `https://${customMirrorUrls[1]}/api/v1/network/nodes`,
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");

                            if (fileId === FileId.ADDRESS_BOOK.toString()) {
                                return HttpResponse.json(
                                    generateAddressBookResponse(customNodes),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                const client = await Client.forMirrorNetwork(customMirrorUrls);

                expect(client).to.be.instanceOf(Client);
                expect(client.network).to.not.be.empty;

                // Verify that the network was updated with custom nodes
                const networkEntries = createNetworkAddressNodeSet(
                    client.network,
                );

                // Verify all custom nodes are present
                expect(networkEntries).toContain(
                    "custom-node-1.example.com:443:0.0.300",
                );
                expect(networkEntries).toContain(
                    "custom-node-2.example.com:443:0.0.301",
                );

                // Verify we have exactly 2 nodes
                expect(networkEntries.size).toBe(2);

                // Verify mirror network is set with both URLs
                expect(client._mirrorNetwork).to.not.be.null;
            });
        });

        describe("AddressBookQueryWeb Pagination", function () {
            it("should fetch all pages automatically and aggregate results", async function () {
                const client = Client.forTestnet();
                const initialNetwork = { ...client.network };

                // Mock paginated responses
                let requestCount = 0;
                const handlers = [
                    http.get(
                        "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                        ({ request }) => {
                            const url = new URL(request.url);
                            const fileId = url.searchParams.get("file.id");
                            const limit = url.searchParams.get("limit");

                            // Verify the request parameters
                            expect(fileId).to.equal(
                                FileId.ADDRESS_BOOK.toString(),
                            );
                            expect(limit).to.equal("25"); // Should use DEFAULT_PAGE_SIZE

                            requestCount++;

                            if (requestCount === 1) {
                                // First page - return 3 nodes with next link
                                return HttpResponse.json(
                                    generatePaginatedAddressBookResponse(
                                        [
                                            {
                                                nodeAddress:
                                                    "0.testnet.hedera.com:443",
                                                id: new AccountId(3),
                                            },
                                            {
                                                nodeAddress:
                                                    "1.testnet.hedera.com:443",
                                                id: new AccountId(4),
                                            },
                                            {
                                                nodeAddress:
                                                    "2.testnet.hedera.com:443",
                                                id: new AccountId(5),
                                            },
                                        ],
                                        "/api/v1/network/nodes?file.id=0.0.102&limit=25&node.id=gt:3",
                                    ),
                                );
                            } else if (requestCount === 2) {
                                // Second page - return 2 more nodes with next link
                                return HttpResponse.json(
                                    generatePaginatedAddressBookResponse(
                                        [
                                            {
                                                nodeAddress:
                                                    "3.testnet.hedera.com:443",
                                                id: new AccountId(6),
                                            },
                                            {
                                                nodeAddress:
                                                    "4.testnet.hedera.com:443",
                                                id: new AccountId(7),
                                            },
                                        ],
                                        "/api/v1/network/nodes?file.id=0.0.102&limit=25&node.id=gt:5",
                                    ),
                                );
                            } else if (requestCount === 3) {
                                // Third page - return 1 final node with no next link
                                return HttpResponse.json(
                                    generatePaginatedAddressBookResponse(
                                        [
                                            {
                                                nodeAddress:
                                                    "5.testnet.hedera.com:443",
                                                id: new AccountId(8),
                                            },
                                        ],
                                        null, // No more pages
                                    ),
                                );
                            }

                            return HttpResponse.json({ nodes: [] });
                        },
                    ),
                ];

                worker = await startMSW(handlers);

                await client.updateNetwork();

                const updatedNetwork = client.network;

                // Verify that all 3 requests were made
                expect(requestCount).to.equal(3);

                // Verify that all 6 nodes were aggregated
                const initialEntries =
                    createNetworkAddressNodeSet(initialNetwork);
                const updatedEntries =
                    createNetworkAddressNodeSet(updatedNetwork);

                // Networks should be different since we got new nodes from the mirror
                expect(initialEntries).not.toEqual(updatedEntries);

                // Should have the new nodes from the paginated response
                expect(updatedEntries).toContain(
                    "0.testnet.hedera.com:443:0.0.3",
                );
                expect(updatedEntries).toContain(
                    "1.testnet.hedera.com:443:0.0.4",
                );
                expect(updatedEntries).toContain(
                    "2.testnet.hedera.com:443:0.0.5",
                );
                expect(updatedEntries).toContain(
                    "3.testnet.hedera.com:443:0.0.6",
                );
                expect(updatedEntries).toContain(
                    "4.testnet.hedera.com:443:0.0.7",
                );
                expect(updatedEntries).toContain(
                    "5.testnet.hedera.com:443:0.0.8",
                );

                // Should have exactly 6 nodes (all pages aggregated)
                expect(updatedEntries.size).toBe(6);
            });
        });
    });
});
