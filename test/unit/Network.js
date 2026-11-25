import Client from "../../src/client/Client.js";
import AccountId from "../../src/account/AccountId.js";

describe("deprecated", function () {
    let network;

    beforeEach(function () {
        const client = new Client({ scheduleNetworkUpdate: false });
        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.999999",
        });
        network = client._network;
    });

    it("networkName is null before a network name is set", function () {
        expect(network.networkName).to.equal(null);
    });

    for (const name of ["mainnet", "testnet", "previewnet"]) {
        it(`setNetworkName("${name}") sets networkName and returns the network`, function () {
            expect(network.setNetworkName(name)).to.equal(network);
            expect(network.networkName).to.equal(name);
            expect(network.ledgerId.toString()).to.equal(name);
        });

        it(`setNetworkName("${name}") gives each node its entry from the ${name} address book`, function () {
            network.setNetworkName(name);

            const inBook = network.getNode(new AccountId(3));
            expect(inBook.nodeAddress).to.not.equal(null);
            expect(inBook.nodeAddress.accountId.toString()).to.equal("0.0.3");

            // 0.0.999999 is in the network map but not in the address book
            const notInBook = network.getNode(new AccountId(999999));
            expect(notInBook.nodeAddress).to.equal(null);
        });
    }
});
