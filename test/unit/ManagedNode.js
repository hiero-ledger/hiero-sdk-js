// SPDX-License-Identifier: Apache-2.0

import Client from "../../src/client/Client.js";
import AccountId from "../../src/account/AccountId.js";

describe("ManagedNode", function () {
    let client;

    beforeEach(function () {
        client = new Client({ scheduleNetworkUpdate: false });
        client._network.setNetwork({ "127.0.0.1:50211": "0.0.3" });
        client.setNodeMinBackoff(1000).setNodeMaxBackoff(60000);
    });

    it("keeps min and max backoff when the node is cloned", function () {
        const node = client._network.getNode(new AccountId(3)).toSecure();

        expect(node.minBackoff).to.equal(1000);
        expect(node.maxBackoff).to.equal(60000);
    });

    it("setMaxBackoff does not raise the current backoff", function () {
        const node = client._network.getNode(new AccountId(3));
        node._currentBackoff = 1000;

        node.setMaxBackoff(120000);
        node.increaseBackoff();

        expect(node._currentBackoff).to.equal(2000);
    });

    it("nodes added later get the network min and max backoff", function () {
        client._network.setNetwork({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
        });
        const node = client._network.getNode(new AccountId(4));

        expect(node.minBackoff).to.equal(1000);
        expect(node.maxBackoff).to.equal(60000);
    });
});
