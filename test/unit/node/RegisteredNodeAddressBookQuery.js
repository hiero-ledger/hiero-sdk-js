import sinon from "sinon";
import {
    BlockNodeApi,
    Client,
    PrivateKey,
    RegisteredNodeAddressBookQuery,
} from "../../../src/index.js";

describe("RegisteredNodeAddressBookQuery", function () {
    let originalFetch;
    let originalSetTimeout;

    beforeEach(function () {
        originalFetch = global.fetch;
        originalSetTimeout = global.setTimeout;

        global.setTimeout = (callback) => {
            callback();
            return 0;
        };
    });

    afterEach(function () {
        global.fetch = originalFetch;
        global.setTimeout = originalSetTimeout;
    });

    it("should query the local mirror node Java REST API and parse registered nodes", async function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const client = Client.forLocalNode();

        global.fetch = sinon.stub().resolves({
            ok: true,
            json: sinon.stub().resolves({
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
            }),
        });

        const addressBook = await new RegisteredNodeAddressBookQuery().execute(
            client,
        );

        expect(global.fetch.calledOnce).to.be.true;
        expect(global.fetch.firstCall.args[0]).to.equal(
            "http://127.0.0.1:8084/api/v1/network/registered-nodes?limit=25",
        );

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
        expect(blockNodeEndpoint.endpointApis.map((api) => api.toString())).to.deep.equal(
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

    it("should follow pagination links and aggregate registered nodes", async function () {
        const adminKey = PrivateKey.generateED25519().publicKey;
        const client = Client.forTestnet();

        global.fetch = sinon
            .stub()
            .onFirstCall()
            .resolves({
                ok: true,
                json: sinon.stub().resolves({
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
                }),
            })
            .onSecondCall()
            .resolves({
                ok: true,
                json: sinon.stub().resolves({
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
                }),
            });

        const addressBook = await new RegisteredNodeAddressBookQuery()
            .setLimit(1)
            .execute(client);

        const expectedFirstUrl = new URL(
            `${client.mirrorRestJavaApiBaseUrl}/network/registered-nodes?limit=1`,
        ).toString();
        const expectedSecondUrl = new URL(
            "/api/v1/network/registered-nodes?limit=1&registerednode.id=gt:1",
            client.mirrorRestJavaApiBaseUrl,
        ).toString();

        expect(global.fetch.callCount).to.equal(2);
        expect(global.fetch.firstCall.args[0]).to.equal(expectedFirstUrl);
        expect(global.fetch.secondCall.args[0]).to.equal(expectedSecondUrl);

        expect(addressBook.registeredNodes).to.have.length(2);
        expect(
            addressBook.registeredNodes.map((node) =>
                node.registeredNodeId.toString(),
            ),
        ).to.deep.equal(["1", "2"]);
    });
});
