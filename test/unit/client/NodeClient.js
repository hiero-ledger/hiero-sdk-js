// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, afterEach } from "vitest";
import NodeClient from "../../../src/client/NodeClient.js";
import LedgerId from "../../../src/LedgerId.js";
import AccountId from "../../../src/account/AccountId.js";
import { MirrorNetwork } from "../../../src/constants/ClientConstants.js";

vi.mock("../../../src/channel/NodeChannel.js", () => ({
    default: vi.fn().mockImplementation(() => ({ close: vi.fn() })),
}));
vi.mock("../../../src/channel/NodeMirrorChannel.js", () => ({
    default: vi.fn().mockImplementation(() => ({ close: vi.fn() })),
}));

describe("NodeClient", function () {
    afterEach(function () {
        vi.restoreAllMocks();
    });

    // fromConfig static factory
    describe("fromConfig", function () {
        it("should create a client from a JSON string", function () {
            const config = JSON.stringify({
                network: "testnet",
                scheduleNetworkUpdate: false,
            });
            const client = NodeClient.fromConfig(config);
            expect(client).to.be.instanceOf(NodeClient);
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
        });

        it("should create a client from a configuration object", function () {
            const client = NodeClient.fromConfig({
                network: "mainnet",
                scheduleNetworkUpdate: false,
            });
            expect(client).to.be.instanceOf(NodeClient);
            expect(client.ledgerId).to.equal(LedgerId.MAINNET);
        });
    });

    // Named-network static factories
    describe("named-network factories", function () {
        it("forMainnet returns a client with MAINNET ledgerId", function () {
            const client = NodeClient.forMainnet();
            expect(client).to.be.instanceOf(NodeClient);
            expect(client.ledgerId).to.equal(LedgerId.MAINNET);
        });

        it("forTestnet returns a client with TESTNET ledgerId", function () {
            const client = NodeClient.forTestnet();
            expect(client).to.be.instanceOf(NodeClient);
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
        });

        it("forPreviewnet returns a client with PREVIEWNET ledgerId", function () {
            const client = NodeClient.forPreviewnet();
            expect(client).to.be.instanceOf(NodeClient);
            expect(client.ledgerId).to.equal(LedgerId.PREVIEWNET);
        });

        it("forLocalNode returns a client with LOCAL_NODE ledgerId", function () {
            const client = NodeClient.forLocalNode();
            expect(client).to.be.instanceOf(NodeClient);
            expect(client.ledgerId).to.equal(LedgerId.LOCAL_NODE);
        });
    });

    // forNetwork with custom map
    describe("forNetwork", function () {
        it("should construct a client from a custom network map", function () {
            const network = {
                "node.example.com:50211": "0.0.3",
                "node2.example.com:50211": "0.0.4",
            };
            const client = NodeClient.forNetwork(network, {
                scheduleNetworkUpdate: false,
            });
            const clientNetwork = client.network;

            expect(client).to.be.instanceOf(NodeClient);
            expect(clientNetwork["node.example.com:50211"].toString()).to.equal(
                "0.0.3",
            );
            expect(
                clientNetwork["node2.example.com:50211"].toString(),
            ).to.equal("0.0.4");
        });
    });

    // _setNetworkFromName
    describe("_setNetworkFromName", function () {
        it("should throw for an unknown network name", function () {
            expect(() => NodeClient.forName("unknown-net")).to.throw(
                "unknown network: unknown-net",
            );
        });

        it("should resolve mainnet", function () {
            const client = new NodeClient({
                network: "mainnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.MAINNET);
        });

        it("should resolve testnet", function () {
            const client = new NodeClient({
                network: "testnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
        });

        it("should resolve previewnet", function () {
            const client = new NodeClient({
                network: "previewnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.PREVIEWNET);
        });

        it("should resolve local-node", function () {
            const client = new NodeClient({
                network: "local-node",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.LOCAL_NODE);
        });
    });

    // setMirrorNetwork
    describe("setMirrorNetwork", function () {
        it("should dispatch string 'mainnet'", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("mainnet");
            expect(client.mirrorNetwork).to.deep.equal(MirrorNetwork.MAINNET);
        });

        it("should dispatch string 'testnet'", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("testnet");
            expect(client.mirrorNetwork).to.deep.equal(MirrorNetwork.TESTNET);
        });

        it("should dispatch string 'previewnet'", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("previewnet");
            expect(client.mirrorNetwork).to.deep.equal(
                MirrorNetwork.PREVIEWNET,
            );
        });

        it("should dispatch string 'local-node'", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("local-node");
            expect(client.mirrorNetwork).to.deep.equal(
                MirrorNetwork.LOCAL_NODE,
            );
        });

        it("should pass through an array directly", function () {
            const mirrors = [
                "mirror1.example.com:443",
                "mirror2.example.com:443",
            ];
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork(mirrors);
            const result = client.mirrorNetwork;
            // Order-insensitive — MirrorNetwork shuffles entries internally
            expect(result).to.have.length(mirrors.length);
            for (const m of mirrors) {
                expect(result).to.include(m);
            }
        });

        it("should wrap an unknown string as a single-element array", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("custom-mirror.example.com:443");
            expect(client.mirrorNetwork).to.deep.equal([
                "custom-mirror.example.com:443",
            ]);
        });
    });

    // setMaxExecutionTime (deprecated shim)
    describe("setMaxExecutionTime", function () {
        it("should delegate to setGrpcDeadline", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            client.setMaxExecutionTime(5000);
            expect(client.grpcDeadline).to.equal(5000);
        });

        it("should return the client instance for chaining", function () {
            const client = new NodeClient({ scheduleNetworkUpdate: false });
            const result = client.setMaxExecutionTime(3000);
            expect(result).to.equal(client);
        });
    });

    // Constructor mirror-network resolution via props
    describe("constructor mirrorNetwork prop", function () {
        it("should resolve mirrorNetwork string 'mainnet' in constructor", function () {
            const client = new NodeClient({
                mirrorNetwork: "mainnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal(MirrorNetwork.MAINNET);
        });

        it("should resolve mirrorNetwork string 'testnet' in constructor", function () {
            const client = new NodeClient({
                mirrorNetwork: "testnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal(MirrorNetwork.TESTNET);
        });

        it("should resolve mirrorNetwork string 'previewnet' in constructor", function () {
            const client = new NodeClient({
                mirrorNetwork: "previewnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal(
                MirrorNetwork.PREVIEWNET,
            );
        });

        it("should wrap unknown mirrorNetwork string as array in constructor", function () {
            const client = new NodeClient({
                mirrorNetwork: "custom-mirror.example.com:443",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal([
                "custom-mirror.example.com:443",
            ]);
        });

        it("should pass through mirrorNetwork array in constructor", function () {
            const mirrors = [
                "mirror1.example.com:443",
                "mirror2.example.com:443",
            ];
            const client = new NodeClient({
                mirrorNetwork: mirrors,
                scheduleNetworkUpdate: false,
            });
            const result = client.mirrorNetwork;
            // Order-insensitive — MirrorNetwork shuffles entries internally
            expect(result).to.have.length(mirrors.length);
            for (const m of mirrors) {
                expect(result).to.include(m);
            }
        });
    });

    // Constructor network object prop
    describe("constructor network object prop", function () {
        it("should accept a network object in constructor", function () {
            const network = {
                "node1.example.com:50211": new AccountId(3),
                "node2.example.com:50211": new AccountId(4),
            };
            const client = new NodeClient({
                network,
                scheduleNetworkUpdate: false,
            });
            const clientNetwork = client.network;

            expect(
                clientNetwork["node1.example.com:50211"].toString(),
            ).to.equal("0.0.3");
            expect(
                clientNetwork["node2.example.com:50211"].toString(),
            ).to.equal("0.0.4");
        });
    });
});
