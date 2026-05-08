// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, afterEach } from "vitest";
import WebClient from "../../../src/client/WebClient.js";
import LedgerId from "../../../src/LedgerId.js";

vi.mock("../../../src/channel/WebChannel.js", () => ({
    default: vi.fn().mockImplementation(() => ({ close: vi.fn() })),
}));

describe("WebClient", function () {
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
            const client = WebClient.fromConfig(config);
            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
        });

        it("should create a client from a configuration object", function () {
            const client = WebClient.fromConfig({
                network: "mainnet",
                scheduleNetworkUpdate: false,
            });
            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.MAINNET);
        });
    });

    // Named-network static factories
    describe("named-network factories", function () {
        it("forMainnet returns a client with MAINNET ledgerId", function () {
            const client = WebClient.forMainnet();
            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.MAINNET);
        });

        it("forTestnet returns a client with TESTNET ledgerId", function () {
            const client = WebClient.forTestnet();
            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
        });

        it("forPreviewnet returns a client with PREVIEWNET ledgerId", function () {
            const client = WebClient.forPreviewnet();
            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.PREVIEWNET);
        });

        it("forLocalNode returns a client with LOCAL_NODE ledgerId", function () {
            const client = WebClient.forLocalNode();
            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.LOCAL_NODE);
        });
    });

    // forNetwork with custom map
    describe("forNetwork", function () {
        it("should construct a client from a custom network map", function () {
            const network = { "https://node.example.com:443": "0.0.3" };
            const client = WebClient.forNetwork(network);
            const clientNetwork = client.network;

            expect(client).to.be.instanceOf(WebClient);
            expect(
                clientNetwork["https://node.example.com:443"].toString(),
            ).to.equal("0.0.3");
        });
    });
});
