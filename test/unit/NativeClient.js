import { AccountId, LedgerId } from "../../src/index.js";
import NativeClient, { Network } from "../../src/client/NativeClient.js";

describe("NativeClient", function () {
    describe("constructor", function () {
        it("should create client with default configuration", function () {
            const client = new NativeClient();
            expect(client).to.be.instanceOf(NativeClient);
        });

        it("should set network from string 'mainnet'", function () {
            const client = new NativeClient({ network: "mainnet" });
            // Check if network is properly set for mainnet
            expect(client._network._network).to.not.be.empty;
            expect(client._network._ledgerId).to.equal(LedgerId.MAINNET);
        });

        it("should set network from string 'testnet'", function () {
            const client = new NativeClient({ network: "testnet" });
            // Check if network is properly set for testnet
            expect(client._network._network).to.not.be.empty;
            expect(client._network._ledgerId).to.deep.equal(LedgerId.TESTNET);
        });

        it("should set network from string 'previewnet'", function () {
            const client = new NativeClient({ network: "previewnet" });
            // Check if network is properly set for previewnet
            expect(client._network._network).to.not.be.empty;
            expect(client._network._ledgerId).to.deep.equal(
                LedgerId.PREVIEWNET,
            );
        });

        it("should throw error for unknown network string", function () {
            expect(() => new NativeClient({ network: "invalid" })).to.throw(
                "unknown network: invalid",
            );
        });

        it("should set network from object", function () {
            const customNetwork = {
                "127.0.0.1:50211": AccountId.fromString("0.0.5"),
            };
            const client = new NativeClient({ network: customNetwork });
            // Check if the Map contains the expected key-value pair
            expect(client._network._network.has("0.0.5")).to.be.true;
        });
    });

    describe("static factory methods", function () {
        it("forNetwork should create client with specified network object", function () {
            const customNetwork = { "127.0.0.1:50211": "0.0.3" };
            const client = NativeClient.forNetwork(customNetwork);
            expect(client).to.be.instanceOf(NativeClient);
            // Check if the Map contains the expected key-value pair
            expect(client._network._network.has("0.0.3")).to.be.true;
            expect(client._isUpdatingNetwork).to.be.false;
        });

        it("forName should create client with named network", function () {
            const client = NativeClient.forName("testnet");
            expect(client).to.be.instanceOf(NativeClient);
            // Check if network is properly set
            expect(client._network._network).to.not.be.empty;
            expect(client._isUpdatingNetwork).to.be.false;
        });

        it("forMainnet should create client configured for mainnet", function () {
            const client = NativeClient.forMainnet();
            expect(client).to.be.instanceOf(NativeClient);
            // Check if network is properly set for mainnet
            expect(client._network._network).to.not.be.empty;
            expect(client._isUpdatingNetwork).to.be.false;
        });

        it("forTestnet should create client configured for testnet", function () {
            const client = NativeClient.forTestnet();
            expect(client).to.be.instanceOf(NativeClient);
            // Check if network is properly set for testnet
            expect(client._network._network).to.not.be.empty;
            expect(client._isUpdatingNetwork).to.be.false;
        });

        it("forPreviewnet should create client configured for previewnet", function () {
            const client = NativeClient.forPreviewnet();
            expect(client).to.be.instanceOf(NativeClient);
            // Check if network is properly set for previewnet
            expect(client._network._network).to.not.be.empty;
            expect(client._isUpdatingNetwork).to.be.false;
        });
    });

    describe("setNetwork", function () {
        it("should set network from string 'mainnet'", function () {
            const client = new NativeClient();
            client.setNetwork("mainnet");
            expect(client._network._network).to.not.be.empty;
        });

        it("should set network from string 'testnet'", function () {
            const client = new NativeClient();
            client.setNetwork("testnet");
            expect(client._network._network).to.not.be.empty;
        });

        it("should set network from string 'previewnet'", function () {
            const client = new NativeClient();
            client.setNetwork("previewnet");
            expect(client._network._network).to.not.be.empty;
        });

        it("should set network from object", function () {
            const client = new NativeClient();
            const customNetwork = { "127.0.0.1:50211": "0.0.3" };
            client.setNetwork(customNetwork);
            expect(client._network._network.has("0.0.3")).to.be.true;
        });
    });

    describe("Network utility", function () {
        it("should return correct network from name", function () {
            // Check network objects by examining properties instead of deep equality
            expect(
                Object.keys(Network.fromName("mainnet")),
            ).to.have.length.above(0);
            expect(
                Object.keys(Network.fromName("testnet")),
            ).to.have.length.above(0);
            expect(
                Object.keys(Network.fromName("previewnet")),
            ).to.have.length.above(0);
        });

        it("should throw error for unknown network name", function () {
            expect(() => Network.fromName("invalid")).to.throw(
                "unknown network name: invalid",
            );
        });
    });
});
