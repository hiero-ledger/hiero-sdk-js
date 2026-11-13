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

    describe("maxNodeAttempts", function () {
        let network;

        // Let the node's backoff end, the way time does, so that only
        // `maxNodeAttempts` decides whether it is used again.
        function endBackoff(node) {
            node._readmitTime = Date.now();
            network._earliestReadmitTime = 0;
        }

        beforeEach(function () {
            client._network.setNetwork({
                "127.0.0.1:50211": "0.0.3",
                "127.0.0.1:50212": "0.0.4",
            });
            network = client._network;
        });

        it("closes a node after maxNodeAttempts bad gRPC statuses", function () {
            client.setMaxNodeAttempts(2);
            const node = network.getNode(new AccountId(3));

            network.increaseBackoff(node);
            endBackoff(node);

            // One failure: the node is still used.
            expect(network.getNodeAccountIdsForExecute()).to.have.deep.members([
                new AccountId(3),
                new AccountId(4),
            ]);

            network.increaseBackoff(node);
            endBackoff(node);

            // Two failures: the node is closed and removed everywhere.
            expect(network.getNodeAccountIdsForExecute()).to.deep.equal([
                new AccountId(4),
            ]);
            expect(network._nodes).to.not.include(node);
            expect(network._healthyNodes).to.not.include(node);
            expect(client.network).to.deep.equal({
                "127.0.0.1:50212": new AccountId(4),
            });
            expect(() => network.getNode(new AccountId(3))).to.throw(
                "NodeAccountId not recognized: 0.0.3",
            );
        });

        it("does not pick a closed node that was readmitted before it was closed", function () {
            const node = network.getNode(new AccountId(3));

            network.increaseBackoff(node);
            network.increaseBackoff(node);
            endBackoff(node);

            // With the default maxNodeAttempts (-1), the node is readmitted.
            expect(network.getNodeAccountIdsForExecute()).to.have.deep.members([
                new AccountId(3),
                new AccountId(4),
            ]);
            expect(network._healthyNodes).to.include(node);

            // Lowering maxNodeAttempts closes the node on the next request.
            client.setMaxNodeAttempts(2);

            expect(network.getNodeAccountIdsForExecute()).to.deep.equal([
                new AccountId(4),
            ]);
            expect(network._healthyNodes).to.deep.equal([
                network.getNode(new AccountId(4)),
            ]);
            expect(network.getNode().accountId.toString()).to.equal("0.0.4");
        });

        it("never closes a node when maxNodeAttempts is -1", function () {
            const node = network.getNode(new AccountId(3));

            expect(client.maxNodeAttempts).to.equal(-1);

            for (let i = 0; i < 5; i++) {
                network.increaseBackoff(node);
            }
            endBackoff(node);

            expect(node._badGrpcStatusCount).to.equal(5);
            expect(network.getNodeAccountIdsForExecute()).to.have.deep.members([
                new AccountId(3),
                new AccountId(4),
            ]);
            expect(network.getNode(new AccountId(3))).to.equal(node);
        });
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
