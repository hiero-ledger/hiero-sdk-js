// SPDX-License-Identifier: Apache-2.0

import {
    BlockNodeApi,
    Client,
    PrivateKey,
    RegisteredNodeAddressBookQuery,
} from "../../../src/index.js";
import FakeHttpTransport from "../utils/FakeHttpTransport.js";

describe("RegisteredNodeAddressBookQuery", function () {
    /** @type {Client[]} */
    let clients = [];

    /**
     * @param {Client} client
     * @returns {FakeHttpTransport}
     */
    function inject(client) {
        const fake = new FakeHttpTransport();
        client.setMirrorNodeHttpConfig({ transport: fake });
        clients.push(client);
        return fake;
    }

    afterEach(function () {
        for (const client of clients) {
            client.close();
        }
        clients = [];
    });

    it("should query the local mirror node Java REST API and parse registered nodes", async function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const client = Client.forLocalNode();
        const fake = inject(client);

        fake.respondJson(200, {
            registered_nodes: [
                {
                    admin_key: {
                        _type: "ED25519",
                        key: adminKey.toStringRaw(),
                    },
                    created_timestamp: "1234567890.000000001",
                    description: "alpha",
                    registered_node_id: 1,
                    service_endpoints: [
                        {
                            block_node: {
                                endpoint_apis: ["STATUS", "PUBLISH"],
                            },
                            domain_name: null,
                            general_service: null,
                            ip_address: "127.0.0.1",
                            mirror_node: null,
                            port: 443,
                            requires_tls: true,
                            rpc_relay: null,
                            type: "BLOCK_NODE",
                        },
                        {
                            block_node: null,
                            domain_name: "mirror.alpha.example",
                            general_service: null,
                            ip_address: null,
                            mirror_node: {},
                            port: 5600,
                            requires_tls: true,
                            rpc_relay: null,
                            type: "MIRROR_NODE",
                        },
                        {
                            block_node: null,
                            domain_name: "rpc.alpha.example",
                            general_service: null,
                            ip_address: null,
                            mirror_node: null,
                            port: 7546,
                            requires_tls: false,
                            rpc_relay: {},
                            type: "RPC_RELAY",
                        },
                        {
                            block_node: null,
                            domain_name: "archive.alpha.example",
                            general_service: {
                                description: "Archive API",
                            },
                            ip_address: null,
                            mirror_node: null,
                            port: 8443,
                            requires_tls: true,
                            rpc_relay: null,
                            type: "GENERAL_SERVICE",
                        },
                    ],
                    timestamp: {
                        from: "1234567890.000000001",
                        to: null,
                    },
                },
            ],
            links: {
                next: null,
            },
        });

        const addressBook = await new RegisteredNodeAddressBookQuery().execute(
            client,
        );

        expect(fake.requests).to.have.length(1);
        expect(fake.requests[0].url).to.equal(
            "http://127.0.0.1:8084/api/v1/network/registered-nodes?limit=25",
        );
        expect(fake.requests[0].method).to.equal("GET");

        expect(addressBook.registeredNodes).to.have.length(1);

        const registeredNode = addressBook.registeredNodes[0];
        expect(registeredNode.registeredNodeId.toString()).to.equal("1");
        expect(registeredNode.adminKey.toStringRaw()).to.equal(
            adminKey.toStringRaw(),
        );
        expect(registeredNode.description).to.equal("alpha");
        expect(registeredNode.serviceEndpoints).to.have.length(4);

        const blockNodeEndpoint = registeredNode.serviceEndpoints[0];
        expect(blockNodeEndpoint.type).to.equal("blockNode");
        expect(blockNodeEndpoint.ipAddress).to.deep.equal(
            Uint8Array.of(127, 0, 0, 1),
        );
        expect(
            blockNodeEndpoint.endpointApis.map((api) => api.toString()),
        ).to.deep.equal(
            [BlockNodeApi.Status, BlockNodeApi.Publish].map((api) =>
                api.toString(),
            ),
        );

        expect(registeredNode.serviceEndpoints[1].type).to.equal("mirrorNode");
        expect(registeredNode.serviceEndpoints[2].type).to.equal("rpcRelay");
        expect(registeredNode.serviceEndpoints[3].type).to.equal(
            "generalService",
        );
        expect(registeredNode.serviceEndpoints[3].description).to.equal(
            "Archive API",
        );
    });

    it("should reject when the client has no mirror network", async function () {
        const client = Client.forNetwork(
            { "127.0.0.1:50211": "0.0.3" },
            { scheduleNetworkUpdate: false },
        );

        await expect(
            new RegisteredNodeAddressBookQuery().execute(client),
        ).rejects.toThrow("Client has no mirror network configured");
        client.close();
    });

    it("should follow pagination links and aggregate registered nodes", async function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const client = Client.forTestnet();
        const fake = inject(client);

        fake.respondJson(200, {
            registered_nodes: [
                {
                    admin_key: {
                        _type: "ED25519",
                        key: adminKey.toStringRaw(),
                    },
                    created_timestamp: "1234567890.000000001",
                    description: "alpha",
                    registered_node_id: 1,
                    service_endpoints: [
                        {
                            block_node: {
                                endpoint_apis: ["STATUS"],
                            },
                            domain_name: "block.alpha.example",
                            general_service: null,
                            ip_address: null,
                            mirror_node: null,
                            port: 443,
                            requires_tls: true,
                            rpc_relay: null,
                            type: "BLOCK_NODE",
                        },
                    ],
                    timestamp: {
                        from: "1234567890.000000001",
                        to: null,
                    },
                },
            ],
            links: {
                next: "/api/v1/network/registered-nodes?limit=1&registerednode.id=gt:1",
            },
        }).respondJson(200, {
            registered_nodes: [
                {
                    admin_key: {
                        _type: "ED25519",
                        key: adminKey.toStringRaw(),
                    },
                    created_timestamp: "1234567891.000000001",
                    description: "bravo",
                    registered_node_id: 2,
                    service_endpoints: [
                        {
                            block_node: null,
                            domain_name: "mirror.bravo.example",
                            general_service: null,
                            ip_address: null,
                            mirror_node: {},
                            port: 5600,
                            requires_tls: true,
                            rpc_relay: null,
                            type: "MIRROR_NODE",
                        },
                    ],
                    timestamp: {
                        from: "1234567891.000000001",
                        to: null,
                    },
                },
            ],
            links: {
                next: null,
            },
        });

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(1)
            .execute(client);

        // A testnet client gets no local-port rewrite, and the next link's
        // `/api/v1` prefix is stripped because the base URL carries it.
        const baseUrl = "https://testnet.mirrornode.hedera.com:443/api/v1";

        expect(fake.requests).to.have.length(2);
        expect(fake.requests[0].url).to.equal(
            `${baseUrl}/network/registered-nodes?limit=1`,
        );
        expect(fake.requests[1].url).to.equal(
            `${baseUrl}/network/registered-nodes?limit=1&registerednode.id=gt:1`,
        );

        expect(addressBook.registeredNodes).to.have.length(2);
        expect(
            addressBook.registeredNodes.map((node) =>
                node.registeredNodeId.toString(),
            ),
        ).to.deep.equal(["1", "2"]);
    });
});
