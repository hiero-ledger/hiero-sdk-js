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

    it("getNode finds a backed-off node that a network update kept", function () {
        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });

        const network = client._network;
        const backedOff = network.getNode(new AccountId(3));

        network.increaseBackoff(backedOff);
        // What `client.updateNetwork()` does when a node answers
        // INVALID_NODE_ACCOUNT: the address book is applied while that node is
        // still unhealthy.
        network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });

        const node = network._nodes.find(
            (candidate) => candidate.accountId.toString() === "0.0.3",
        );

        expect(node).to.equal(backedOff);
        expect(network.getNode(new AccountId(3))).to.equal(backedOff);
        expect(network._healthyNodes).to.deep.equal([
            network.getNode(new AccountId(4)),
        ]);
    });

    it("getNode finds a node whose backoff ended after a network update", function () {
        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });

        const network = client._network;
        const backedOff = network.getNode(new AccountId(3));

        network.increaseBackoff(backedOff);
        network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });

        // Let the backoff end, the way time does.
        backedOff._readmitTime = Date.now();
        network._earliestReadmitTime = 0;

        expect(network.getNode(new AccountId(3))).to.equal(backedOff);
        expect(network.getNodeAccountIdsForExecute()).to.have.deep.members([
            new AccountId(3),
            new AccountId(4),
        ]);
    });
});

describe("Network transport security", function () {
    let client;

    beforeEach(function () {
        client = new Client({ scheduleNetworkUpdate: false });
        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.2:50211": "0.0.4",
        });
    });

    afterEach(function () {
        client.close();
    });

    it("setTransportSecurity(true) moves every node to the TLS port", function () {
        expect(client._network.setTransportSecurity(true)).to.equal(
            client._network,
        );

        expect(client._network.isTransportSecurity()).to.be.true;
        expect(client.network).to.deep.equal({
            "127.0.0.1:50212": new AccountId(3),
            "127.0.0.2:50212": new AccountId(4),
        });
    });

    it("setTransportSecurity(true) keeps the node map and the healthy nodes in sync", function () {
        client._network.setTransportSecurity(true);

        expect([...client._network._network.keys()].sort()).to.deep.equal([
            "0.0.3",
            "0.0.4",
        ]);
        expect(
            client._network.getNode(new AccountId(3)).address.toString(),
        ).to.equal("127.0.0.1:50212");
        expect(
            client._network.getNode(new AccountId(4)).address.toString(),
        ).to.equal("127.0.0.2:50212");
        expect(client._network._healthyNodes).to.have.members(
            client._network._nodes,
        );
    });

    it("setTransportSecurity(false) moves every node back to the plaintext port", function () {
        client._network.setTransportSecurity(true);
        client._network.setTransportSecurity(false);

        expect(client._network.isTransportSecurity()).to.be.false;
        expect(client.network).to.deep.equal({
            "127.0.0.1:50211": new AccountId(3),
            "127.0.0.2:50211": new AccountId(4),
        });
        expect(
            client._network.getNode(new AccountId(3)).address.toString(),
        ).to.equal("127.0.0.1:50211");
    });

    it("setTransportSecurity() keeps the nodes when the value doesn't change", function () {
        const nodes = [...client._network._nodes];

        client._network.setTransportSecurity(false);

        expect(client._network._nodes).to.deep.equal(nodes);
        expect(client._network._nodes[0]).to.equal(nodes[0]);
    });
});

describe("Network maxNodeAttempts", function () {
    it("is -1 by default and returns the value set with setMaxNodeAttempts()", function () {
        const client = new Client({ scheduleNetworkUpdate: false });

        expect(client._network.maxNodeAttempts).to.equal(-1);
        expect(client._network.setMaxNodeAttempts(2)).to.equal(client._network);
        expect(client._network.maxNodeAttempts).to.equal(2);

        client.close();
    });
});

describe("ManagedNetwork configuration", function () {
    // MirrorNetwork doesn't replace these ManagedNetwork methods, while
    // Network replaces maxNodeAttempts and setMaxNodeAttempts().
    let client;

    beforeEach(function () {
        client = new Client({ scheduleNetworkUpdate: false });
    });

    afterEach(function () {
        client.close();
    });

    it("has the default backoff, readmit periods and maxNodeAttempts", function () {
        const mirrorNetwork = client._mirrorNetwork;

        expect(mirrorNetwork.maxNodeAttempts).to.equal(-1);
        expect(mirrorNetwork.minBackoff).to.equal(8000);
        expect(mirrorNetwork.maxBackoff).to.equal(60 * 60 * 1000);
        expect(mirrorNetwork.nodeMinReadmitPeriod).to.equal(8000);
        expect(mirrorNetwork.nodeMaxReadmitPeriod).to.equal(60 * 60 * 1000);
    });

    it("maxNodeAttempts returns the value set with setMaxNodeAttempts()", function () {
        const mirrorNetwork = client._mirrorNetwork;

        expect(mirrorNetwork.setMaxNodeAttempts(4)).to.equal(mirrorNetwork);
        expect(mirrorNetwork.maxNodeAttempts).to.equal(4);
    });

    it("minBackoff and maxBackoff return the values set and apply them to the nodes", function () {
        const mirrorNetwork = client._mirrorNetwork;
        mirrorNetwork.setNetwork(["127.0.0.1:5600"]);

        expect(mirrorNetwork.setMinBackoff(100)).to.equal(mirrorNetwork);
        expect(mirrorNetwork.setMaxBackoff(1000)).to.equal(mirrorNetwork);

        expect(mirrorNetwork.minBackoff).to.equal(100);
        expect(mirrorNetwork.maxBackoff).to.equal(1000);
        expect(mirrorNetwork._nodes[0]._minBackoff).to.equal(100);
        expect(mirrorNetwork._nodes[0]._maxBackoff).to.equal(1000);
    });

    it("nodeMinReadmitPeriod and nodeMaxReadmitPeriod return the values set", function () {
        const mirrorNetwork = client._mirrorNetwork;

        expect(mirrorNetwork.setNodeMinReadmitPeriod(300)).to.equal(
            mirrorNetwork,
        );
        expect(mirrorNetwork.setNodeMaxReadmitPeriod(3000)).to.equal(
            mirrorNetwork,
        );

        expect(mirrorNetwork.nodeMinReadmitPeriod).to.equal(300);
        expect(mirrorNetwork.nodeMaxReadmitPeriod).to.equal(3000);
    });
});

describe("ManagedNetwork node health", function () {
    let client;

    beforeEach(function () {
        client = new Client({ scheduleNetworkUpdate: false });
        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });
    });

    afterEach(function () {
        client.close();
    });

    // Nothing increments a node's bad gRPC status count yet (#4747), so
    // these tests set it directly.
    it("closes a node that reached maxNodeAttempts bad responses", function () {
        client._network.setMaxNodeAttempts(2);
        const node = client._network.getNode(new AccountId(3));
        node._badGrpcStatusCount = 2;

        client._network.getNodeAccountIdsForExecute();

        expect(client.network).to.deep.equal({
            "127.0.0.1:50212": new AccountId(4),
        });
        expect(() => client._network.getNode(new AccountId(3))).to.throw(
            "NodeAccountId not recognized: 0.0.3",
        );
    });

    // TODO: #4747. A closed node stays in the healthy nodes.
    it.skip("no longer picks a node closed for reaching maxNodeAttempts", function () {
        client._network.setMaxNodeAttempts(2);
        client._network.getNode(new AccountId(3))._badGrpcStatusCount = 2;

        client._network.getNodeAccountIdsForExecute();

        expect(
            client._network.getNodeAccountIdsForExecute().map(String),
        ).to.deep.equal(["0.0.4"]);
        expect(
            client._network._healthyNodes.map((node) =>
                node.accountId.toString(),
            ),
        ).to.not.include("0.0.3");
    });

    it("keeps a node below maxNodeAttempts bad responses", function () {
        client._network.setMaxNodeAttempts(2);
        client._network.getNode(new AccountId(3))._badGrpcStatusCount = 1;

        expect(
            client._network.getNodeAccountIdsForExecute().map(String).sort(),
        ).to.deep.equal(["0.0.3", "0.0.4"]);
    });

    it("keeps every node when maxNodeAttempts is not set", function () {
        client._network.getNode(new AccountId(3))._badGrpcStatusCount = 100;

        expect(
            client._network.getNodeAccountIdsForExecute().map(String).sort(),
        ).to.deep.equal(["0.0.3", "0.0.4"]);
    });

    it("leaves a backed-off node out of the healthy nodes when the network is set", function () {
        const node = client._network.getNode(new AccountId(3));
        client._network.increaseBackoff(node);

        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });

        expect(client._network._nodes).to.include(node);
        expect(client._network._healthyNodes).to.not.include(node);
        expect(
            client._network.getNodeAccountIdsForExecute().map(String),
        ).to.deep.equal(["0.0.4"]);
    });

    it("getNode() throws when there is no healthy node", function () {
        const emptyClient = new Client({ scheduleNetworkUpdate: false });

        expect(() => emptyClient._network.getNode()).to.throw(
            "failed to find a healthy working node",
        );

        emptyClient.close();
    });
});
