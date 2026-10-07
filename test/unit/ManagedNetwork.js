import Client from "../../src/client/Client.js";
import AccountId from "../../src/account/AccountId.js";

describe("ManagedNetwork", function () {
    let client;

    beforeEach(function () {
        client = new Client({ scheduleNetworkUpdate: false });
        client._network.setNetwork({ "127.0.0.1:50211": "0.0.3" });
    });

    it("getNode returns the node for a known node account ID", function () {
        const node = client._network.getNode(new AccountId(3));

        expect(node.accountId.toString()).to.equal("0.0.3");
        expect(node.address.toString()).to.equal("127.0.0.1:50211");
    });

    it("getNode throws for a node account ID that is not in the network map", function () {
        expect(() => client._network.getNode(new AccountId(111))).to.throw(
            "NodeAccountId not recognized: 0.0.111",
        );
    });

    it("getNode without a key returns a healthy node", function () {
        expect(client._network.getNode().accountId.toString()).to.equal(
            "0.0.3",
        );
    });
});
