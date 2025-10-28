import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import Long from "long";
import * as HieroProto from "@hashgraph/proto";
import { encodeRequest } from "../../../src/channel/Channel.js";
import {
    Client,
    FileId,
    AccountId,
    TransactionId,
    LedgerId,
    TransactionReceiptQuery,
    Status,
} from "../../../src/browser.js";
import {
    MAINNET,
    WEB_TESTNET,
    WEB_PREVIEWNET,
} from "../../../src/constants/ClientConstants.js";
/**
 * @typedef {import("../../../src/network/AddressBookQueryWeb.js").AddressBookQueryWebResponse} AddressBookQueryWebResponse
 */

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
 * MSW worker for mocking HTTP responses
 */
let worker;

/**
 * Setup MSW worker with handlers and start it
 * @param {Array} handlers - MSW handlers
 * @param {Object} options - Start options (defaults to {quiet: true})
 */
const setupMSW = async (handlers) => {
    worker = setupWorker(...handlers);
    await worker.start({ quiet: true });
    return worker;
};

/**
 * Clean up MSW worker
 */
const cleanupMSW = async () => {
    if (worker) {
        await worker.stop();
        worker = null;
    }
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

describe("WebClient", function () {
    afterEach(async () => {
        // Clean up MSW worker after each test
        await cleanupMSW();
    });

    describe("Mainnet network", function () {
        it("should not change network when response includes grpc_proxy_endpoint", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            await setupMSW([
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when all nodes have null grpc_proxy_endpoint", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have null grpc_proxy_endpoint
            const response = generateAddressBookResponse(MAINNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint = null;
            });

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when some nodes have null grpc_proxy_endpoint", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have mixed grpc_proxy_endpoint
            const response = generateAddressBookResponse(MAINNET);
            response.nodes.forEach((node, index) => {
                // Alternate between including and excluding grpc_proxy_endpoint
                if (index % 2 === 1) {
                    node.grpc_proxy_endpoint = null;
                }
            });

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint has empty domain_name", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have empty domain names
            const response = generateAddressBookResponse(MAINNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint.domain_name = "";
            });

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint has empty port", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have empty ports
            const response = generateAddressBookResponse(MAINNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint.port = "";
            });

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint field is missing", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to remove grpc_proxy_endpoint
            const response = generateAddressBookResponse(MAINNET);
            response.nodes.forEach((node) => {
                delete node.grpc_proxy_endpoint;
            });

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

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

            await setupMSW([
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have changed to the new nodes from the mirror response
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

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

        it("should change network to empty when mirror response has different nodes with no grpc_proxy_endpoint", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Create a different ObjectMap with completely different nodes
            const differentNodes = {
                "new-mainnet-node-1.hedera.com:443": new AccountId(100),
                "new-mainnet-node-2.hedera.com:443": new AccountId(101),
            };

            // Generate response and then modify it to remove grpc_proxy_endpoint
            const response = generateAddressBookResponse(differentNodes);
            response.nodes.forEach((node) => {
                delete node.grpc_proxy_endpoint;
            });

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should be empty since all nodes have no grpc_proxy_endpoint
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes but they have no grpc_proxy_endpoint
            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });

        it("should strip missing nodes from network when mirror response has fewer nodes than constants", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            // Create a response with only some of the nodes from MAINNET constants
            // Get the first two entries from MAINNET to simulate some nodes being missing
            const mainnetEntries = Object.entries(MAINNET);
            const partialNodes = {};

            // Take only the first 2 nodes (assuming MAINNET has more than 2 nodes)
            for (let i = 0; i < Math.min(2, mainnetEntries.length); i++) {
                const [url, accountId] = mainnetEntries[i];
                partialNodes[url] = accountId;
            }

            const partialResponse = generateAddressBookResponse(partialNodes);

            await setupMSW([
                http.get(
                    "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(partialResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have only the nodes that were in the mirror response
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since some nodes are missing
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have only the nodes from the partial response
            const partialEntries = createNetworkAddressNodeSet(partialNodes);
            expect(updatedEntries).toEqual(partialEntries);

            // Should have fewer nodes than the original network
            expect(updatedEntries.size).toBeLessThan(initialEntries.size);

            // Should not have any nodes that weren't in the partial response
            Object.entries(MAINNET).forEach(([url, accountId]) => {
                if (!partialNodes[url]) {
                    expect(updatedEntries).not.toContain(
                        `${url}:${accountId.toString()}`,
                    );
                }
            });
        });
    });

    describe("Testnet network", function () {
        it("should not change network when response includes grpc_proxy_endpoint", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            await setupMSW([
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when all nodes have null grpc_proxy_endpoint", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have null grpc_proxy_endpoint
            const response = generateAddressBookResponse(WEB_TESTNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint = null;
            });

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when some nodes have null grpc_proxy_endpoint", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have mixed grpc_proxy_endpoint
            const response = generateAddressBookResponse(WEB_TESTNET);
            response.nodes.forEach((node, index) => {
                // Alternate between including and excluding grpc_proxy_endpoint
                if (index % 2 === 1) {
                    node.grpc_proxy_endpoint = null;
                }
            });

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint has empty domain_name", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have empty domain names
            const response = generateAddressBookResponse(WEB_TESTNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint.domain_name = "";
            });

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint has empty port", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have empty ports
            const response = generateAddressBookResponse(WEB_TESTNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint.port = "";
            });

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint field is missing", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to remove grpc_proxy_endpoint
            const response = generateAddressBookResponse(WEB_TESTNET);
            response.nodes.forEach((node) => {
                delete node.grpc_proxy_endpoint;
            });

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should change network to new nodes when mirror response has different nodes with valid grpc_proxy_endpoint", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Create a different ObjectMap with completely different nodes
            const differentNodes = {
                "new-testnet-node-1.hedera.com:443": new AccountId(200),
                "new-testnet-node-2.hedera.com:443": new AccountId(201),
            };

            const newNodesResponse =
                generateAddressBookResponse(differentNodes);

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have changed to the new nodes from the mirror response
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes from the mirror
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have the new nodes from the mirror response
            expect(updatedEntries).toContain(
                "new-testnet-node-1.hedera.com:443:0.0.200",
            );
            expect(updatedEntries).toContain(
                "new-testnet-node-2.hedera.com:443:0.0.201",
            );

            // Should not have any of the original hardcoded nodes
            Object.entries(WEB_TESTNET).forEach(([url, accountId]) => {
                expect(updatedEntries).not.toContain(
                    `${url}:${accountId.toString()}`,
                );
            });
        });

        it("should change network to empty when mirror response has different nodes with no grpc_proxy_endpoint", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Create a different ObjectMap with completely different nodes
            const differentNodes = {
                "new-testnet-node-1.hedera.com:443": new AccountId(200),
                "new-testnet-node-2.hedera.com:443": new AccountId(201),
            };

            // Generate response and then modify it to remove grpc_proxy_endpoint
            const response = generateAddressBookResponse(differentNodes);
            response.nodes.forEach((node) => {
                delete node.grpc_proxy_endpoint;
            });

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should be empty since all nodes have no grpc_proxy_endpoint
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes but they have no grpc_proxy_endpoint
            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });

        it("should strip missing nodes from network when mirror response has fewer nodes than constants", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Create a response with only some of the nodes from WEB_TESTNET constants
            // Get the first two entries from WEB_TESTNET to simulate some nodes being missing
            const testnetEntries = Object.entries(WEB_TESTNET);
            const partialNodes = {};

            // Take only the first 2 nodes (assuming WEB_TESTNET has more than 2 nodes)
            for (let i = 0; i < Math.min(2, testnetEntries.length); i++) {
                const [url, accountId] = testnetEntries[i];
                partialNodes[url] = accountId;
            }

            const partialResponse = generateAddressBookResponse(partialNodes);

            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(partialResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have only the nodes that were in the mirror response
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since some nodes are missing
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have only the nodes from the partial response
            const partialEntries = createNetworkAddressNodeSet(partialNodes);
            expect(updatedEntries).toEqual(partialEntries);

            // Should have fewer nodes than the original network
            expect(updatedEntries.size).toBeLessThan(initialEntries.size);

            // Should not have any nodes that weren't in the partial response
            Object.entries(WEB_TESTNET).forEach(([url, accountId]) => {
                if (!partialNodes[url]) {
                    expect(updatedEntries).not.toContain(
                        `${url}:${accountId.toString()}`,
                    );
                }
            });
        });
    });

    describe("Previewnet network", function () {
        it("should not change network when response includes grpc_proxy_endpoint", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            await setupMSW([
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when all nodes have null grpc_proxy_endpoint", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have null grpc_proxy_endpoint
            const response = generateAddressBookResponse(WEB_PREVIEWNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint = null;
            });

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when some nodes have null grpc_proxy_endpoint", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have mixed grpc_proxy_endpoint
            const response = generateAddressBookResponse(WEB_PREVIEWNET);
            response.nodes.forEach((node, index) => {
                // Alternate between including and excluding grpc_proxy_endpoint
                if (index % 2 === 1) {
                    node.grpc_proxy_endpoint = null;
                }
            });

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint has empty domain_name", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have empty domain names
            const response = generateAddressBookResponse(WEB_PREVIEWNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint.domain_name = "";
            });

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint has empty port", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to have empty ports
            const response = generateAddressBookResponse(WEB_PREVIEWNET);
            response.nodes.forEach((node) => {
                node.grpc_proxy_endpoint.port = "";
            });

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should not change network when grpc_proxy_endpoint field is missing", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Generate response and then modify it to remove grpc_proxy_endpoint
            const response = generateAddressBookResponse(WEB_PREVIEWNET);
            response.nodes.forEach((node) => {
                delete node.grpc_proxy_endpoint;
            });

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).toEqual(updatedEntries);
            expect(initialEntries.size).toBe(updatedEntries.size);
        });

        it("should change network to new nodes when mirror response has different nodes with valid grpc_proxy_endpoint", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Create a different ObjectMap with completely different nodes
            const differentNodes = {
                "new-previewnet-node-1.hedera.com:443": new AccountId(300),
                "new-previewnet-node-2.hedera.com:443": new AccountId(301),
            };

            const newNodesResponse =
                generateAddressBookResponse(differentNodes);

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have changed to the new nodes from the mirror response
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes from the mirror
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have the new nodes from the mirror response
            expect(updatedEntries).toContain(
                "new-previewnet-node-1.hedera.com:443:0.0.300",
            );
            expect(updatedEntries).toContain(
                "new-previewnet-node-2.hedera.com:443:0.0.301",
            );

            // Should not have any of the original hardcoded nodes
            Object.entries(WEB_PREVIEWNET).forEach(([url, accountId]) => {
                expect(updatedEntries).not.toContain(
                    `${url}:${accountId.toString()}`,
                );
            });
        });

        it("should change network to empty when mirror response has different nodes with no grpc_proxy_endpoint", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Create a different ObjectMap with completely different nodes
            const differentNodes = {
                "new-previewnet-node-1.hedera.com:443": new AccountId(300),
                "new-previewnet-node-2.hedera.com:443": new AccountId(301),
            };

            // Generate response and then modify it to remove grpc_proxy_endpoint
            const response = generateAddressBookResponse(differentNodes);
            response.nodes.forEach((node) => {
                delete node.grpc_proxy_endpoint;
            });

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(response);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should be empty since all nodes have no grpc_proxy_endpoint
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes but they have no grpc_proxy_endpoint
            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });

        it("should strip missing nodes from network when mirror response has fewer nodes than constants", async function () {
            const client = Client.forPreviewnet();
            const initialNetwork = { ...client.network };

            // Create a response with only some of the nodes from WEB_PREVIEWNET constants
            // Get the first two entries from WEB_PREVIEWNET to simulate some nodes being missing
            const previewnetEntries = Object.entries(WEB_PREVIEWNET);
            const partialNodes = {};

            // Take only the first 2 nodes (assuming WEB_PREVIEWNET has more than 2 nodes)
            for (let i = 0; i < Math.min(2, previewnetEntries.length); i++) {
                const [url, accountId] = previewnetEntries[i];
                partialNodes[url] = accountId;
            }

            const partialResponse = generateAddressBookResponse(partialNodes);

            await setupMSW([
                http.get(
                    "https://previewnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (fileId === FileId.ADDRESS_BOOK.toString()) {
                            return HttpResponse.json(partialResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have only the nodes that were in the mirror response
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since some nodes are missing
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have only the nodes from the partial response
            const partialEntries = createNetworkAddressNodeSet(partialNodes);
            expect(updatedEntries).toEqual(partialEntries);

            // Should have fewer nodes than the original network
            expect(updatedEntries.size).toBeLessThan(initialEntries.size);

            // Should not have any nodes that weren't in the partial response
            Object.entries(WEB_PREVIEWNET).forEach(([url, accountId]) => {
                if (!partialNodes[url]) {
                    expect(updatedEntries).not.toContain(
                        `${url}:${accountId.toString()}`,
                    );
                }
            });
        });
    });

    describe("Custom network", function () {
        it("should change network when using custom network with mirror response and new nodes with grpc_proxy_endpoint", async function () {
            // Create a custom network with initial nodes
            const initialCustomNetwork = {
                "custom-node-1.example.com:443": new AccountId(1, 1, 3),
                "custom-node-2.example.com:443": new AccountId(1, 1, 4),
            };

            const client = Client.forNetwork(initialCustomNetwork);

            // Set a custom mirror network with proper URL format
            client.setMirrorNetwork(["custom-mirror.example.com:5551"]);

            const initialNetwork = { ...client.network };

            // Create a response with different nodes than the initial network
            const customMirrorResponse = {
                nodes: [
                    {
                        admin_key: {
                            key: "sample-key-5",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: {
                            domain_name: "new-node-1.example.com",
                            port: "443",
                        },
                        file_id: "file-id-5",
                        memo: "New Node 5",
                        public_key: "public-key-5",
                        node_id: 5,
                        node_account_id: "1.1.5",
                        node_cert_hash: "cert-hash-5",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 5",
                        stake: 0,
                    },
                    {
                        admin_key: {
                            key: "sample-key-6",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: {
                            domain_name: "new-node-2.example.com",
                            port: "443",
                        },
                        file_id: "file-id-6",
                        memo: "New Node 6",
                        public_key: "public-key-6",
                        node_id: 6,
                        node_account_id: "1.1.6",
                        node_cert_hash: "cert-hash-6",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 6",
                        stake: 0,
                    },
                ],
            };

            await setupMSW([
                http.get(
                    "https://custom-mirror.example.com:5551/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        if (
                            fileId ===
                            FileId.getAddressBookFileIdFor(
                                client.shard,
                                client.realm,
                            ).toString()
                        ) {
                            return HttpResponse.json(customMirrorResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // The network should have changed to the new nodes from the mirror response
            console.log("Updated network:", updatedNetwork);
            console.log("Initial network:", initialNetwork);
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes from the mirror
            expect(initialEntries).not.toEqual(updatedEntries);
            console.log("Updated entries:", updatedEntries);
            console.log("Initial entries:", initialEntries);

            // Should have the new nodes from the mirror response
            expect(updatedEntries).toContain(
                "new-node-1.example.com:443:1.1.5",
            );
            expect(updatedEntries).toContain(
                "new-node-2.example.com:443:1.1.6",
            );

            // Should not have the old nodes
            expect(updatedEntries).not.toContain(
                "custom-node-1.example.com:443:1.1.3",
            );
            expect(updatedEntries).not.toContain(
                "custom-node-2.example.com:443:1.1.4",
            );
        });

        it("should change network to empty when mirror response has only nodes with null grpc_proxy_endpoint", async function () {
            const initialCustomNetwork = {
                "custom-node-1.example.com:443": new AccountId(1, 1, 3),
                "custom-node-2.example.com:443": new AccountId(1, 1, 4),
            };

            const client = Client.forNetwork(initialCustomNetwork);

            // Set a custom mirror network
            client.setMirrorNetwork(["custom-mirror.example.com:5551"]);

            const initialNetwork = { ...client.network };

            // Create a response with null grpc_proxy_endpoint (should fall back to initial network)
            const customMirrorResponse = {
                nodes: [
                    {
                        admin_key: {
                            key: "sample-key-5",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: null, // Null grpc_proxy_endpoint
                        file_id: "file-id-5",
                        memo: "New Node 5",
                        public_key: "public-key-5",
                        node_id: 5,
                        node_account_id: "1.1.5",
                        node_cert_hash: "cert-hash-5",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 5",
                        stake: 0,
                    },
                    {
                        admin_key: {
                            key: "sample-key-6",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: null,
                        file_id: "file-id-6",
                        memo: "New Node 6",
                        public_key: "public-key-6",
                        node_id: 6,
                        node_account_id: "1.1.6",
                        node_cert_hash: "cert-hash-6",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 6",
                        stake: 0,
                    },
                ],
            };

            await setupMSW([
                http.get(
                    "https://custom-mirror.example.com:5551/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        if (
                            fileId ===
                            FileId.getAddressBookFileIdFor(
                                client.shard,
                                client.realm,
                            ).toString()
                        ) {
                            return HttpResponse.json(customMirrorResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });

        it("should change network to empty when mirror response has only nodes with empty domain_name in grpc_proxy_endpoint", async function () {
            const initialCustomNetwork = {
                "custom-node-1.example.com:443": new AccountId(1, 1, 3),
                "custom-node-2.example.com:443": new AccountId(1, 1, 4),
            };

            const client = Client.forNetwork(initialCustomNetwork);

            client.setMirrorNetwork(["custom-mirror.example.com:5551"]);

            const initialNetwork = { ...client.network };

            const customMirrorResponse = {
                nodes: [
                    {
                        admin_key: {
                            key: "sample-key-5",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: {
                            domain_name: "", // Empty domain name
                            port: "443",
                        },
                        file_id: "file-id-5",
                        memo: "New Node 5",
                        public_key: "public-key-5",
                        node_id: 5,
                        node_account_id: "1.1.5",
                        node_cert_hash: "cert-hash-5",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 5",
                        stake: 0,
                    },
                    {
                        admin_key: {
                            key: "sample-key-6",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: {
                            domain_name: "",
                            port: "443",
                        },
                        file_id: "file-id-6",
                        memo: "New Node 6",
                        public_key: "public-key-6",
                        node_id: 6,
                        node_account_id: "1.1.6",
                        node_cert_hash: "cert-hash-6",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 6",
                        stake: 0,
                    },
                ],
            };

            await setupMSW([
                http.get(
                    "https://custom-mirror.example.com:5551/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        // Only respond if the file.id parameter matches
                        if (
                            fileId ===
                            FileId.getAddressBookFileIdFor(
                                client.shard,
                                client.realm,
                            ).toString()
                        ) {
                            return HttpResponse.json(customMirrorResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });

        it("should include only nodes with valid grpc_proxy_endpoint when mirror response has mixed null and valid endpoints", async function () {
            const initialCustomNetwork = {
                "custom-node-1.example.com:443": new AccountId(1, 1, 3),
                "custom-node-2.example.com:443": new AccountId(1, 1, 4),
            };

            const client = Client.forNetwork(initialCustomNetwork);

            client.setMirrorNetwork(["custom-mirror.example.com:5551"]);

            const initialNetwork = { ...client.network };

            const customMirrorResponse = {
                nodes: [
                    {
                        admin_key: {
                            key: "sample-key-5",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: null, // Null grpc_proxy_endpoint
                        file_id: "file-id-5",
                        memo: "New Node 5",
                        public_key: "public-key-5",
                        node_id: 5,
                        node_account_id: "1.1.5",
                        node_cert_hash: "cert-hash-5",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 5",
                        stake: 0,
                    },
                    {
                        admin_key: {
                            key: "sample-key-6",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: {
                            domain_name: "valid-node-1.example.com",
                            port: "443",
                        },
                        file_id: "file-id-6",
                        memo: "New Node 6",
                        public_key: "public-key-6",
                        node_id: 6,
                        node_account_id: "1.1.6",
                        node_cert_hash: "cert-hash-6",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 6",
                        stake: 0,
                    },
                    {
                        admin_key: {
                            key: "sample-key-7",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: {
                            domain_name: "valid-node-2.example.com",
                            port: "443",
                        },
                        file_id: "file-id-7",
                        memo: "New Node 7",
                        public_key: "public-key-7",
                        node_id: 7,
                        node_account_id: "1.1.7",
                        node_cert_hash: "cert-hash-7",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 7",
                        stake: 0,
                    },
                    {
                        admin_key: {
                            key: "sample-key-8",
                            _type: "ED25519",
                        },
                        decline_reward: false,
                        grpc_proxy_endpoint: null, // Another null grpc_proxy_endpoint
                        file_id: "file-id-8",
                        memo: "New Node 8",
                        public_key: "public-key-8",
                        node_id: 8,
                        node_account_id: "1.1.8",
                        node_cert_hash: "cert-hash-8",
                        address: "127.0.0.1",
                        service_endpoints: [],
                        description: "New Node 8",
                        stake: 0,
                    },
                ],
            };

            await setupMSW([
                http.get(
                    "https://custom-mirror.example.com:5551/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");

                        if (
                            fileId ===
                            FileId.getAddressBookFileIdFor(
                                client.shard,
                                client.realm,
                            ).toString()
                        ) {
                            return HttpResponse.json(customMirrorResponse);
                        }

                        return HttpResponse.json({ nodes: [] });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes from the mirror
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have only the nodes with valid grpc_proxy_endpoint
            expect(updatedEntries).toContain(
                "valid-node-1.example.com:443:1.1.6",
            );
            expect(updatedEntries).toContain(
                "valid-node-2.example.com:443:1.1.7",
            );

            // Should not have nodes with null grpc_proxy_endpoint
            expect(updatedEntries).not.toContain(
                "1.1.5", // Node 5 has null grpc_proxy_endpoint
            );
            expect(updatedEntries).not.toContain(
                "1.1.8", // Node 8 has null grpc_proxy_endpoint
            );

            // Should not have the original nodes
            expect(updatedEntries).not.toContain(
                "custom-node-1.example.com:443:1.1.3",
            );
            expect(updatedEntries).not.toContain(
                "custom-node-2.example.com:443:1.1.4",
            );

            // Should have exactly 2 nodes (only the valid ones)
            expect(updatedEntries.size).toBe(2);
        });
    });

    describe("Async factory methods", function () {
        describe("forMainnetAsync", function () {
            it("should create mainnet client with network update", async function () {
                // Mock the mirror node response for mainnet
                await setupMSW([
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
                ]);

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
        });

        describe("forTestnetAsync", function () {
            it("should create testnet client with newest addressbook", async function () {
                // Mock the mirror node response for testnet
                await setupMSW([
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
                ]);

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
        });

        describe("forPreviewnetAsync", function () {
            it("should create previewnet client with newest addressbook", async function () {
                // Mock the mirror node response for previewnet
                await setupMSW([
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
                ]);

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

        describe("forNameAsync", function () {
            it("should create mainnet client by name with newest addressbook", async function () {
                // Mock the mirror node response for mainnet
                await setupMSW([
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
                ]);

                const client = await Client.forNameAsync("mainnet");

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

            it("should create testnet client by name with newest addressbook", async function () {
                // Mock the mirror node response for testnet
                await setupMSW([
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
                ]);

                const client = await Client.forNameAsync("testnet");

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

            it("should create previewnet client by name with newest addressbook", async function () {
                // Mock the mirror node response for previewnet
                await setupMSW([
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
                ]);

                const client = await Client.forNameAsync("previewnet");

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
    });

    describe("AddressBookQueryWeb Pagination", function () {
        it("should fetch all pages automatically and aggregate results", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            // Mock paginated responses
            let requestCount = 0;
            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    ({ request }) => {
                        const url = new URL(request.url);
                        const fileId = url.searchParams.get("file.id");
                        const limit = url.searchParams.get("limit");

                        // Verify the request parameters
                        expect(fileId).to.equal(FileId.ADDRESS_BOOK.toString());
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
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // Verify that all 3 requests were made
            expect(requestCount).to.equal(3);

            // Verify that all 6 nodes were aggregated
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            // Networks should be different since we got new nodes from the mirror
            expect(initialEntries).not.toEqual(updatedEntries);

            // Should have the new nodes from the paginated response
            expect(updatedEntries).toContain("0.testnet.hedera.com:443:0.0.3");
            expect(updatedEntries).toContain("1.testnet.hedera.com:443:0.0.4");
            expect(updatedEntries).toContain("2.testnet.hedera.com:443:0.0.5");
            expect(updatedEntries).toContain("3.testnet.hedera.com:443:0.0.6");
            expect(updatedEntries).toContain("4.testnet.hedera.com:443:0.0.7");
            expect(updatedEntries).toContain("5.testnet.hedera.com:443:0.0.8");

            // Should have exactly 6 nodes (all pages aggregated)
            expect(updatedEntries.size).toBe(6);
        });

        it("should handle single page response (no pagination)", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            let requestCount = 0;
            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    () => {
                        requestCount++;

                        return HttpResponse.json(
                            generatePaginatedAddressBookResponse(
                                [
                                    {
                                        nodeAddress: "0.testnet.hedera.com:443",
                                        id: new AccountId(3),
                                    },
                                ],
                                null, // No pagination
                            ),
                        );
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // Verify that only 1 request was made
            expect(requestCount).to.equal(1);

            // Verify that the single node was returned
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries).toContain("0.testnet.hedera.com:443:0.0.3");
            expect(updatedEntries.size).toBe(1);
        });

        it("should handle empty response", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            let requestCount = 0;
            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    () => {
                        requestCount++;

                        return HttpResponse.json(
                            generatePaginatedAddressBookResponse(
                                [], // No nodes
                                null,
                            ),
                        );
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // Verify that only 1 request was made
            expect(requestCount).to.equal(1);

            // Verify that no nodes were returned
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });

        it("should handle missing links object in response", async function () {
            const client = Client.forTestnet();
            const initialNetwork = { ...client.network };

            let requestCount = 0;
            await setupMSW([
                http.get(
                    "https://testnet.mirrornode.hedera.com/api/v1/network/nodes",
                    () => {
                        requestCount++;

                        return HttpResponse.json({
                            nodes: [
                                {
                                    admin_key: {
                                        key: "sample-key-3",
                                        _type: "ED25519",
                                    },
                                    decline_reward: false,
                                    grpc_proxy_endpoint: {
                                        domain_name: "0.testnet.hedera.com",
                                        port: 443,
                                    },
                                    file_id: "file-id-3",
                                    memo: "Node 3",
                                    public_key: "public-key-3",
                                    node_id: 3,
                                    node_account_id: "3",
                                    node_cert_hash: "cert-hash-3",
                                    address: "127.0.0.1",
                                    service_endpoints: [],
                                    description: "Node 3",
                                    stake: 0,
                                },
                            ],
                            // No links object - should terminate pagination
                        });
                    },
                ),
            ]);

            await client.updateNetwork();

            const updatedNetwork = client.network;

            // Verify that only 1 request was made
            expect(requestCount).to.equal(1);

            // Verify that the single node was returned
            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries).toContain("0.testnet.hedera.com:443:0.0.3");
            expect(updatedEntries.size).toBe(1);
        });
    });

    describe("Network endpoint scheme handling", function () {
        const ACCOUNT_ID = {
            shardNum: Long.ZERO,
            realmNum: Long.ZERO,
            accountNum: Long.fromNumber(10),
        };

        const TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE = {
            transactionGetReceipt: {
                header: { nodeTransactionPrecheckCode: 0 },
                receipt: {
                    status: 22,
                    accountId: ACCOUNT_ID,
                },
            },
        };
        it("should work correctly with https:// scheme in network endpoints", async function () {
            const networkWithHttps = {
                "https://test-node.example.com:443": new AccountId(3),
            };

            const client = Client.forNetwork(networkWithHttps);

            // Mock the gRPC-Web request to the endpoint with scheme
            await setupMSW([
                http.post(
                    "https://test-node.example.com/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log(
                            "Mocking request to get transaction receipt",
                        );
                        // Serialize the protobuf response properly
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
            ]);

            const transactionId = TransactionId.generate(new AccountId(3));
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            // Execute the query to test the endpoint
            const response = await receiptQuery.execute(client);

            // Verify the response
            expect(response).to.not.be.null;
            expect(response.status.toString()).to.equal(
                Status.Success.toString(),
            );
        });

        it("should work correctly with http:// scheme in network endpoints", async function () {
            const networkWithHttp = {
                "http://dev-node.local:50211": new AccountId(3),
            };

            const client = Client.forNetwork(networkWithHttp);

            // Mock the gRPC-Web request to the endpoint with http scheme
            await setupMSW([
                http.post(
                    "http://dev-node.local:50211/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log(
                            "Mocking request to get transaction receipt with http",
                        );
                        // Serialize the protobuf response properly
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
            ]);

            const transactionId = TransactionId.generate(new AccountId(3));
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            // Execute the query to test the endpoint
            const response = await receiptQuery.execute(client);

            // Verify the response
            expect(response).to.not.be.null;
            expect(response.status.toString()).to.equal(
                Status.Success.toString(),
            );
        });

        it("should work correctly with endpoints without scheme (auto-detected https)", async function () {
            const networkWithoutScheme = {
                "test-node.example.com:443": new AccountId(3),
            };

            const client = Client.forNetwork(networkWithoutScheme);

            // Mock the gRPC-Web request to the endpoint (should auto-add https)
            await setupMSW([
                http.post(
                    "https://test-node.example.com/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log(
                            "Mocking request to get transaction receipt without scheme",
                        );
                        // Serialize the protobuf response properly
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
            ]);

            const transactionId = TransactionId.generate(new AccountId(3));
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            // Execute the query to test the endpoint
            const response = await receiptQuery.execute(client);

            // Verify the response
            expect(response).to.not.be.null;
            expect(response.status.toString()).to.equal(
                Status.Success.toString(),
            );
        });

        it("should work correctly with localhost endpoints (auto-detected http)", async function () {
            const networkWithLocalhost = {
                "localhost:50211": new AccountId(3),
            };

            const client = Client.forNetwork(networkWithLocalhost);

            // Mock the gRPC-Web request to the localhost endpoint (should auto-add http)
            await setupMSW([
                http.post(
                    "http://localhost:50211/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log("Mocking request to localhost");
                        // Serialize the protobuf response properly
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
            ]);

            const transactionId = TransactionId.generate(new AccountId(3));
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            // Execute the query to test the endpoint
            const response = await receiptQuery.execute(client);

            // Verify the response
            expect(response).to.not.be.null;
            expect(response.status.toString()).to.equal(
                Status.Success.toString(),
            );
        });

        it("should work correctly with 127.0.0.1 endpoints (auto-detected http)", async function () {
            const networkWithLocalhost = {
                "127.0.0.1:50211": new AccountId(3),
            };

            const client = Client.forNetwork(networkWithLocalhost);

            // Mock the gRPC-Web request to the 127.0.0.1 endpoint (should auto-add http)
            await setupMSW([
                http.post(
                    "http://127.0.0.1:50211/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log(
                            "Mocking request to get transaction receipt with 127.0.0.1",
                        );
                        // Serialize the protobuf response properly
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
            ]);

            const transactionId = TransactionId.generate(new AccountId(3));
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            // Execute the query to test the endpoint
            const response = await receiptQuery.execute(client);

            // Verify the response
            expect(response).to.not.be.null;
            expect(response.status.toString()).to.equal(
                Status.Success.toString(),
            );
        });

        it("should work correctly with mixed scheme endpoints", async function () {
            const networkWithMixedSchemes = {
                "https://secure-node.example.com:443": new AccountId(3),
                "http://dev-node.local:50211": new AccountId(4),
                "test-node.example.com:443": new AccountId(5),
            };

            const client = Client.forNetwork(networkWithMixedSchemes);

            // Mock the gRPC-Web requests for all endpoints
            await setupMSW([
                // HTTPS endpoint with explicit scheme
                http.post(
                    "https://secure-node.example.com/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log(
                            "Mocking request to secure-node.example.com",
                        );
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
                // HTTP dev-node.local endpoint
                http.post(
                    "http://dev-node.local:50211/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log("Mocking request to dev-node.local");
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
                // Auto-detected HTTPS endpoint
                http.post(
                    "https://test-node.example.com/proto.CryptoService/getTransactionReceipts",
                    () => {
                        console.log("Mocking request to test-node.example.com");
                        const serializedResponse = serializeProtobufResponse(
                            TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
                        );
                        return new Response(serializedResponse, {
                            status: 200,
                            headers: {
                                "content-type": "application/grpc-web+proto",
                            },
                        });
                    },
                ),
            ]);

            const transactionId = TransactionId.generate(new AccountId(3));
            const receiptQuery = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            // Execute the query to test the endpoint
            const response = await receiptQuery.execute(client);

            // Verify the response
            expect(response).to.not.be.null;
            expect(response.status.toString()).to.equal(
                Status.Success.toString(),
            );
        });
    });
});
