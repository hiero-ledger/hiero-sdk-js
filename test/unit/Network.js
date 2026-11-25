import { Client } from "../../src/index.js";

describe("Network", function () {
    describe("deprecated", function () {
        it("setNetworkName() and networkName set and return the network name and update node addresses", function () {
            const client = new Client({ scheduleNetworkUpdate: false });
            expect(client._network.networkName).to.be.null;
            client.close();

            const testnetClient = Client.forTestnet({
                scheduleNetworkUpdate: false,
            });
            expect(testnetClient._network.networkName).to.equal("testnet");

            for (const name of ["mainnet", "testnet", "previewnet"]) {
                const result = testnetClient._network.setNetworkName(name);
                expect(result).to.equal(testnetClient._network);
                expect(testnetClient._network.networkName).to.equal(name);
            }

            testnetClient.close();
        });
    });
});
