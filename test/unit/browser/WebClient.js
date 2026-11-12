// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import WebClient from "../../../src/client/WebClient.js";
import WebMirrorChannel from "../../../src/channel/WebMirrorChannel.js";
import AddressBookQueryWeb from "../../../src/network/AddressBookQueryWeb.js";
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

    // The mirror network name in the configuration
    describe("mirrorNetwork in the configuration", function () {
        it("takes the local node mirror network from the constructor", function () {
            const client = new WebClient({
                mirrorNetwork: "local-node",
                scheduleNetworkUpdate: false,
            });

            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.LOCAL_NODE,
            );
        });

        it("takes the local node mirror network from a config string", function () {
            const client = WebClient.fromConfig(
                JSON.stringify({
                    mirrorNetwork: "local-node",
                    scheduleNetworkUpdate: false,
                }),
            );

            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.LOCAL_NODE,
            );
        });

        it("takes a named mirror network from the constructor as the setter does", function () {
            for (const name of [
                "mainnet",
                "testnet",
                "previewnet",
                "local-node",
            ]) {
                const client = new WebClient({
                    mirrorNetwork: name,
                    scheduleNetworkUpdate: false,
                });
                const setter = new WebClient({
                    scheduleNetworkUpdate: false,
                });
                setter.setMirrorNetwork(name);

                expect(client.mirrorNetwork).to.deep.equal(
                    setter.mirrorNetwork,
                );
            }
        });

        it("takes a mirror network address list as it is", function () {
            const client = new WebClient({
                mirrorNetwork: ["127.0.0.1:5551"],
                scheduleNetworkUpdate: false,
            });

            expect(client.mirrorNetwork).to.deep.equal(
                WebMirrorNetwork.LOCAL_NODE,
            );
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

        it("takes the shard and realm from a node map", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });

            client.setNetwork({ "localhost:8080": "1.2.3" });

            expect(client.shard).to.equal(1);
            expect(client.realm).to.equal(2);
        });

        it("resets to shard 0, realm 0 for a named network", function () {
            for (const name of [
                "testnet",
                "mainnet",
                "previewnet",
                "local-node",
            ]) {
                const client = new WebClient({
                    network: { "localhost:8080": "1.2.3" },
                    scheduleNetworkUpdate: false,
                });

                client.setNetwork(name);

                expect(client.shard, name).to.equal(0);
                expect(client.realm, name).to.equal(0);
            }
        });

        it("throws for nodes in different shards or realms and changes nothing", function () {
            const client = new WebClient({
                network: { "localhost:8080": "1.2.3" },
                scheduleNetworkUpdate: false,
            });

            expect(() =>
                client.setNetwork({
                    "localhost:8080": "1.2.3",
                    "localhost:8081": "2.2.4",
                }),
            ).to.throw(
                "Network is not valid, all nodes must be in the same shard and realm",
            );
            expect(client.shard).to.equal(1);
            expect(client.realm).to.equal(2);
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
        it("should return a factory that builds a WebMirrorChannel", function () {
            const client = new WebClient({ scheduleNetworkUpdate: false });
            const factory = client._createMirrorNetworkChannel();
            expect(factory("mirror.example.com:443")).to.be.instanceOf(
                WebMirrorChannel,
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

    describe("forName", function () {
        it("returns a client for the named network", function () {
            const client = WebClient.forName("testnet");

            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
            expect(client.mirrorNetwork).to.deep.equal([
                "testnet.mirrornode.hedera.com:443",
            ]);
            client.close();
        });
    });

    describe("forNameAsync", function () {
        let updateNetwork;

        beforeEach(function () {
            updateNetwork = vi
                .spyOn(WebClient.prototype, "updateNetwork")
                .mockImplementation(function () {
                    return Promise.resolve(this);
                });
        });

        it("returns a client for the name after updating the network", async function () {
            const client = await WebClient.forNameAsync("testnet");

            expect(client).to.be.instanceOf(WebClient);
            expect(client.ledgerId).to.equal(LedgerId.TESTNET);
            expect(updateNetwork).toHaveBeenCalledTimes(1);
            client.close();
        });

        it("doesn't update the network for local-node", async function () {
            const client = await WebClient.forNameAsync("local-node");

            expect(client.ledgerId).to.equal(LedgerId.LOCAL_NODE);
            expect(updateNetwork).not.toHaveBeenCalled();
            client.close();
        });
    });

    describe("updateNetwork", function () {
        it("returns the client without querying while an update is running", async function () {
            const client = WebClient.forNetwork({
                "node1.example.com:443": "0.0.3",
            });
            let rejectQuery;
            const execute = vi
                .spyOn(AddressBookQueryWeb.prototype, "execute")
                .mockImplementation(
                    () =>
                        new Promise((resolve, reject) => {
                            rejectQuery = reject;
                        }),
                );

            const running = client.updateNetwork();

            expect(await client.updateNetwork()).to.equal(client);
            expect(execute).toHaveBeenCalledTimes(1);

            rejectQuery(new Error("mirror node unavailable"));
            expect(await running).to.equal(client);
            expect(client._isUpdatingNetwork).to.be.false;
            client.close();
        });

        it("logs the error and keeps the network when the update fails", async function () {
            const client = WebClient.forNetwork({
                "node1.example.com:443": "0.0.3",
            });
            vi.spyOn(
                AddressBookQueryWeb.prototype,
                "execute",
            ).mockRejectedValue(new Error("mirror node unavailable"));
            const logger = { trace: vi.fn() };
            client.setLogger(logger);

            expect(await client.updateNetwork()).to.equal(client);

            expect(logger.trace).toHaveBeenCalledWith(
                "failed to update client address book: mirror node unavailable",
            );
            expect(client.network).to.deep.equal({
                "node1.example.com:443": new AccountId(3),
            });
            client.close();
        });

        it("logs a thrown value that is not an Error", async function () {
            const client = WebClient.forNetwork({
                "node1.example.com:443": "0.0.3",
            });
            vi.spyOn(
                AddressBookQueryWeb.prototype,
                "execute",
            ).mockRejectedValue("mirror node unavailable");
            const logger = { trace: vi.fn() };
            client.setLogger(logger);

            await client.updateNetwork();

            expect(logger.trace).toHaveBeenCalledWith(
                "failed to update client address book: mirror node unavailable",
            );
            client.close();
        });
    });
});
