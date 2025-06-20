import { Client, LedgerId } from "../../../src/index.js";
import AccountId from "../../../src/account/AccountId.js";
import NodeClient from "../../../src/client/NodeClient.js";
import MirrorNode from "../../../src/MirrorNode.js";

const ledgerId = LedgerId.LOCAL_NODE;

describe("Client", function () {
    it("should support multiple IPs per node account ID", async function () {
        let nodes = {
            "0.testnet.hedera.com:50211": "0.0.3",
            "34.94.106.61:50211": "0.0.3",
            "50.18.132.211:50211": "0.0.3",
            "138.91.142.219:50211": "0.0.3",
        };

        const client = Client.forNetwork(nodes, {
            scheduleNetworkUpdate: false,
        });

        let network = client.network;

        expect(Object.entries(network).length).to.be.equal(4);
        expect(network["0.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.3",
        );
        expect(network["34.94.106.61:50211"].toString()).to.be.equal("0.0.3");
        expect(network["50.18.132.211:50211"].toString()).to.be.equal("0.0.3");
        expect(network["138.91.142.219:50211"].toString()).to.be.equal("0.0.3");
    });

    it("should correctly construct and update network", async function () {
        let nodes = {
            "0.testnet.hedera.com:50211": "0.0.3",
        };

        const client = Client.forNetwork(nodes, {
            scheduleNetworkUpdate: false,
        });

        let network = client.network;

        expect(Object.entries(network).length).to.be.equal(1);
        expect(network["0.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.3",
        );

        client.setNetwork(nodes);
        network = client.network;

        expect(Object.entries(network).length).to.be.equal(1);
        expect(network["0.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.3",
        );

        nodes["1.testnet.hedera.com:50211"] = "0.0.4";

        client.setNetwork(nodes);
        network = client.network;

        expect(Object.entries(network).length).to.be.equal(2);
        expect(network["0.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.3",
        );
        expect(network["1.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.4",
        );

        nodes["2.testnet.hedera.com:50211"] = "0.0.5";

        client.setNetwork(nodes);
        network = client.network;

        expect(Object.entries(network).length).to.be.equal(3);
        expect(network["0.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.3",
        );
        expect(network["1.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.4",
        );
        expect(network["2.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.5",
        );

        nodes = {
            "2.testnet.hedera.com:50211": "0.0.5",
        };

        client.setNetwork(nodes);
        network = client.network;

        expect(Object.entries(network).length).to.be.equal(1);
        expect(network["2.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.5",
        );

        nodes = {
            "2.testnet.hedera.com:50211": "0.0.6",
        };

        client.setNetwork(nodes);
        network = client.network;

        expect(Object.entries(network).length).to.be.equal(1);
        expect(network["2.testnet.hedera.com:50211"].toString()).to.be.equal(
            "0.0.6",
        );
    });

    describe("local-node factories work", function () {
        const consensusNodes = { "127.0.0.1:50211": new AccountId(3) };
        const mirrorNodes = ["127.0.0.1:5600"];

        function assertIsLocalNode(client) {
            expect(client.network).to.deep.equal(consensusNodes);
            expect(client.mirrorNetwork).to.deep.equal(mirrorNodes);
            expect(client.ledgerId).to.equal(ledgerId);
        }

        it("recognizes local node by name", function () {
            const client = Client.forNetwork("local-node", {
                scheduleNetworkUpdate: false,
            });
            assertIsLocalNode(client);
        });

        it("builds explicit local node client", function () {
            const client = Client.forLocalNode();
            assertIsLocalNode(client);
        });

        it("allows setting local node network", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setNetwork("local-node");
            client.setMirrorNetwork("local-node");
            assertIsLocalNode(client);
        });

        it("destructures props for local node", function () {
            const client = new NodeClient({
                network: "local-node",
                mirrorNodes: "local-node",
                scheduleNetworkUpdate: false,
            });
            assertIsLocalNode(client);
        });
    });

    it("should correctly construct and update mirror network", async function () {
        let nodes = ["testnet.mirrornode.hedera.com:443"];

        const client = Client.forNetwork(
            {},
            { scheduleNetworkUpdate: false },
        ).setMirrorNetwork(nodes);

        let network = client.mirrorNetwork;

        expect(network.length).to.be.equal(1);
        expect(network.includes("testnet.mirrornode.hedera.com:443")).to.be
            .true;

        client.setMirrorNetwork(nodes);
        network = client.mirrorNetwork;

        expect(network.length).to.be.equal(1);
        expect(network.includes("testnet.mirrornode.hedera.com:443")).to.be
            .true;

        nodes.push("hcs.testnet1.mirrornode.hedera.com:5600");

        client.setMirrorNetwork(nodes);
        network = client.mirrorNetwork;

        expect(network.length).to.be.equal(2);
        expect(network.includes("testnet.mirrornode.hedera.com:443")).to.be
            .true;
        expect(network.includes("hcs.testnet1.mirrornode.hedera.com:5600")).to
            .be.true;

        nodes = ["hcs.testnet1.mirrornode.hedera.com:5600"];

        client.setMirrorNetwork(nodes);
        network = client.mirrorNetwork;

        expect(network.length).to.be.equal(1);
        expect(network.includes("hcs.testnet1.mirrornode.hedera.com:5600")).to
            .be.true;
    });

    it("should maintain TLS after setting a mirror network with TLS", function () {
        const client = Client.forNetwork({}, { scheduleNetworkUpdate: false })
            .setTransportSecurity(true)
            .setMirrorNetwork(["mainnet-public.mirrornode.hedera.com:443"]);

        expect(client.mirrorNetwork).to.deep.equal([
            "mainnet-public.mirrornode.hedera.com:443",
        ]);
    });

    describe("forMirrorNetwork method tests", function () {
        let client;

        it("should create a NodeClient with the specified mirror network", async function () {
            const networkAddress = "testnet.mirrornode.hedera.com:443";

            client = await Client.forMirrorNetwork(networkAddress);

            expect(client).to.be.instanceOf(NodeClient);

            expect(client._mirrorNetwork._network.has(networkAddress)).to.be
                .true;

            const mirrorNode =
                client._mirrorNetwork._network.get(networkAddress)[0];

            expect(mirrorNode).to.be.an.instanceof(MirrorNode);
            expect(mirrorNode._address).to.not.be.undefined;
        });

        it("should throw an error if network name is unknown", async function () {
            try {
                await Client.forMirrorNetwork("unknown-net");
            } catch (error) {
                expect(error.message).to.equal(
                    "failed to parse address: unknown-net",
                );
            }
        });

        it("should set a default update period for network address book query", async function () {
            client = await NodeClient.forMirrorNetwork("testnet");
            expect(client._networkUpdatePeriod).to.equal(10000);
        });

        afterEach(async function () {
            await client.close();
        });
    });

    describe("shard and realm configuration", function () {
        it("should set default shard and realm to 0", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            expect(client._shard).to.equal(0);
            expect(client._realm).to.equal(0);
        });

        it("should set custom shard and realm values", function () {
            const client = new NodeClient({
                shard: 1,
                realm: 2,
                scheduleNetworkUpdate: false,
            });
            expect(client._shard).to.equal(1);
            expect(client._realm).to.equal(2);
        });
    });

    describe("factory methods shard and realm behavior", function () {
        describe("forNetwork", function () {
            it("should set custom shard and realm values", function () {
                const client = NodeClient.forNetwork(
                    { "0.testnet.hedera.com:50211": "0.0.3" },
                    { scheduleNetworkUpdate: false },
                );
                expect(client._shard).to.equal(0);
                expect(client._realm).to.equal(0);
            });

            it("should create client with nodes in same shard and realm", function () {
                const nodes = {
                    "0.testnet.hedera.com:50211": new AccountId(1, 2, 3),
                    "34.94.106.61:50211": new AccountId(1, 2, 3),
                    "50.18.132.211:50211": new AccountId(1, 2, 3),
                };

                const client = NodeClient.forNetwork(nodes, {
                    scheduleNetworkUpdate: false,
                });
                expect(client).to.be.instanceOf(NodeClient);
                expect(client._shard).to.equal(1);
                expect(client._realm).to.equal(2);
            });

            it("should throw error when nodes are in different shards", function () {
                const nodes = {
                    "0.testnet.hedera.com:50211": new AccountId(1, 2, 3),
                    "34.94.106.61:50211": new AccountId(2, 2, 4),
                };

                expect(() =>
                    NodeClient.forNetwork(nodes, {
                        scheduleNetworkUpdate: false,
                    }),
                ).to.throw(
                    "Network is not valid, all nodes must be in the same shard and realm",
                );
            });

            it("should throw error when nodes are in different realms", function () {
                const nodes = {
                    "0.testnet.hedera.com:50211": new AccountId(1, 2, 0),
                    "34.94.106.61:50211": new AccountId(1, 3, 1),
                };

                expect(() =>
                    NodeClient.forNetwork(nodes, {
                        scheduleNetworkUpdate: false,
                    }),
                ).to.throw(
                    "Network is not valid, all nodes must be in the same shard and realm",
                );
            });

            it("should use network node shard and realm values over explicitly provided values", function () {
                const nodes = {
                    "0.testnet.hedera.com:50211": new AccountId(1, 2, 3),
                    "34.94.106.61:50211": new AccountId(1, 2, 4),
                };

                const client = NodeClient.forNetwork(nodes, {
                    shard: 5,
                    realm: 6,
                    scheduleNetworkUpdate: false,
                });

                // Should use shard=1 and realm=2 from the network nodes
                // instead of the explicitly provided shard=5 and realm=6
                expect(client._shard).to.equal(1);
                expect(client._realm).to.equal(2);
            });
        });
    });
});
