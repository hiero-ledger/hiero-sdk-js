// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, afterEach } from "vitest";
import WebClient from "../../../src/client/WebClient.js";
import LedgerId from "../../../src/LedgerId.js";
import AccountId from "../../../src/account/AccountId.js";
import {
    WebNetwork,
    WebMirrorNetwork,
} from "../../../src/constants/ClientConstants.js";

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

    // _setNetworkFromName
    describe("_setNetworkFromName", function () {
        it("should throw for an unknown network name", function () {
            expect(
                () =>
                    new WebClient({
                        network: "unknown-net",
                        scheduleNetworkUpdate: false,
                    }),
            ).to.throw("unknown network: unknown-net");
        });

        it("should resolve mainnet", function () {
            const client = new WebClient({
                network: "mainnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.MAINNET);
        });

        it("should resolve testnet", function () {
            const client = new WebClient({
                network: "testnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
        });

        it("should resolve previewnet", function () {
            const client = new WebClient({
                network: "previewnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.PREVIEWNET);
        });

        it("should resolve local-node", function () {
            const client = new WebClient({
                network: "local-node",
                scheduleNetworkUpdate: false,
            });
            expect(client.ledgerId).to.equal(LedgerId.LOCAL_NODE);
        });
    });

    // setNetwork, with string and object inputs
    describe("setNetwork", function () {
        it("should dispatch string 'mainnet'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork("mainnet");

            const network = client.network;
            const keys = Object.keys(network);

            // Should contain the same keys as WebNetwork.MAINNET
            for (const key of Object.keys(WebNetwork.MAINNET)) {
                expect(keys).to.include(key);
            }
        });

        it("should dispatch string 'testnet'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork("testnet");

            const network = client.network;
            const keys = Object.keys(network);

            // Should contain the same keys as WebNetwork.TESTNET
            for (const key of Object.keys(WebNetwork.TESTNET)) {
                expect(keys).to.include(key);
            }
        });

        it("should dispatch string 'previewnet'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork("previewnet");

            const network = client.network;
            const keys = Object.keys(network);

            // Should contain the same keys as WebNetwork.PREVIEWNET
            for (const key of Object.keys(WebNetwork.PREVIEWNET)) {
                expect(keys).to.include(key);
            }
        });

        it("should dispatch string 'local-node'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork("local-node");

            const network = client.network;
            const keys = Object.keys(network);

            // Should contain the same keys as WebNetwork.LOCAL_NODE
            for (const key of Object.keys(WebNetwork.LOCAL_NODE)) {
                expect(keys).to.include(key);
            }
        });

        it("should accept an object network map", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork({ "custom-node.com:443": "0.0.5" });

            expect(client.network["custom-node.com:443"].toString()).to.equal(
                "0.0.5",
            );
        });

        it("should log a deprecation warning for scheme-prefixed keys", function () {
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork({ "https://node.example.com:443": "0.0.3" });

            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("[Deprecation Notice]"),
            );
        });

        it("should log a deprecation warning for http:// prefixed keys", function () {
            const warnSpy = vi
                .spyOn(console, "warn")
                .mockImplementation(() => {});
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setNetwork({ "http://node.example.com:80": "0.0.3" });
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("[Deprecation Notice]"),
            );
        });
    });

    // setMirrorNetwork
    describe("setMirrorNetwork", function () {
        it("should dispatch string 'mainnet'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("mainnet");
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.MAINNET,
            );
        });

        it("should dispatch string 'testnet'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("testnet");
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.TESTNET,
            );
        });

        it("should dispatch string 'previewnet'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("previewnet");
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.PREVIEWNET,
            );
        });

        it("should dispatch string 'local-node'", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("local-node");
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.LOCAL_NODE,
            );
        });

        it("should pass through an array directly", function () {
            const mirrors = [
                "mirror1.example.com:443",
                "mirror2.example.com:443",
            ];
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork(mirrors);
            const result = client.mirrorNetwork;
            expect(result).to.have.length(mirrors.length);
            for (const m of mirrors) {
                expect(result).to.include(m);
            }
        });

        it("should wrap an unknown string as a single-element array", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            client.setMirrorNetwork("custom-mirror.example.com:443");
            expect(client.mirrorNetwork).to.deep.equal([
                "custom-mirror.example.com:443",
            ]);
        });
    });

    // _createMirrorNetworkChannel
    describe("_createMirrorNetworkChannel", function () {
        it("should return a factory that throws when invoked", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            const factory = client._createMirrorNetworkChannel();
            expect(() => factory("any-address")).to.throw(
                "mirror support is not supported in browsers",
            );
        });
    });

    // Constructor mirror-network resolution via props
    describe("constructor mirrorNetwork prop", function () {
        it("should resolve mirrorNetwork string 'mainnet' in constructor", function () {
            const client = new WebClient({
                mirrorNetwork: "mainnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.MAINNET,
            );
        });

        it("should resolve mirrorNetwork string 'testnet' in constructor", function () {
            const client = new WebClient({
                mirrorNetwork: "testnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.TESTNET,
            );
        });

        it("should resolve mirrorNetwork string 'previewnet' in constructor", function () {
            const client = new WebClient({
                mirrorNetwork: "previewnet",
                scheduleNetworkUpdate: false,
            });
            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.PREVIEWNET,
            );
        });

        it("should wrap unknown mirrorNetwork string as array in constructor", function () {
            const client = new WebClient({
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
            const client = new WebClient({
                mirrorNetwork: mirrors,
                scheduleNetworkUpdate: false,
            });
            const result = client.mirrorNetwork;
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
                "node1.example.com:443": new AccountId(3),
                "node2.example.com:443": new AccountId(4),
            };
            const client = new WebClient({
                network,
                scheduleNetworkUpdate: false,
            });
            const clientNetwork = client.network;

            expect(clientNetwork["node1.example.com:443"].toString()).to.equal(
                "0.0.3",
            );
            expect(clientNetwork["node2.example.com:443"].toString()).to.equal(
                "0.0.4",
            );
        });
    });
});
