import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { Client, FileId, AccountId } from "../../../src/browser.js";
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

const server = setupWorker();

describe("WebClient", function () {
    beforeEach(() => {
        server.start({ quiet: true });
    });

    afterEach(() => {
        server.resetHandlers();
    });

    afterAll(() => {
        server.stop();
    });

    describe("Mainnet network", function () {
        it("should not change network when response includes grpc_proxy_endpoint", async function () {
            const client = Client.forMainnet();
            const initialNetwork = { ...client.network };

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

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

            server.use(
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
            );

            // Ensure MSW is ready by waiting a bit
            await new Promise((resolve) => setTimeout(resolve, 100));

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

            server.use(
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
            );

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

            server.use(
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
            );

            await client.updateNetwork();

            const updatedNetwork = client.network;

            const initialEntries = createNetworkAddressNodeSet(initialNetwork);
            const updatedEntries = createNetworkAddressNodeSet(updatedNetwork);

            expect(initialEntries).not.toEqual(updatedEntries);
            expect(updatedEntries.size).toBe(0);
        });
    });
});
