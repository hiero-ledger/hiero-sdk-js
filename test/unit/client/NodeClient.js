// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, afterEach } from "vitest";
import NodeClient from "../../../src/client/NodeClient.js";
import LedgerId from "../../../src/LedgerId.js";

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
            expect(
                clientNetwork["node.example.com:50211"].toString(),
            ).to.equal("0.0.3");
            expect(
                clientNetwork["node2.example.com:50211"].toString(),
            ).to.equal("0.0.4");
        });
    });
});
