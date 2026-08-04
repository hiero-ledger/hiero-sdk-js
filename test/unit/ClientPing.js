// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AccountId from "../../src/account/AccountId.js";
import NodeClient from "../../src/client/NodeClient.js";
import GrpcServiceError from "../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../src/grpc/GrpcStatus.js";

/**
 * @param {Record<string, string>} network
 * @returns {{ client: NodeClient, pings: import("vitest").Mock }}
 */
function clientWithStubbedChannels(network, ping = vi.fn(async () => {})) {
    const client = NodeClient.forNetwork(network, {
        scheduleNetworkUpdate: false,
    });

    for (const node of client._network._nodes) {
        node.getChannel = () => ({
            ping: (timeoutMs) => ping(node.address.toString(), timeoutMs),
        });
    }

    return { client, pings: ping };
}

describe("Client.ping", function () {
    afterEach(function () {
        vi.restoreAllMocks();
    });

    it("resolves when the node's channel is reachable", async function () {
        const { client, pings } = clientWithStubbedChannels({
            "127.0.0.1:50211": "0.0.3",
        });

        await client.ping("0.0.3");

        expect(pings).toHaveBeenCalledTimes(1);

        client.close();
    });

    it("passes the client's gRPC deadline to the channel", async function () {
        const { client, pings } = clientWithStubbedChannels({
            "127.0.0.1:50211": "0.0.3",
        });
        client.setGrpcDeadline(4321);

        await client.ping(new AccountId(3));

        expect(pings.mock.calls[0][1]).to.equal(4321);

        client.close();
    });

    it("rejects when the node is unreachable", async function () {
        const { client } = clientWithStubbedChannels(
            { "127.0.0.1:50211": "0.0.3" },
            vi.fn(() =>
                Promise.reject(new GrpcServiceError(GrpcStatus.Unavailable)),
            ),
        );

        let error = null;
        try {
            await client.ping("0.0.3");
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(error.status).to.deep.equal(GrpcStatus.Unavailable);

        client.close();
    });

    it("rejects for a node that is not part of the network", async function () {
        const { client, pings } = clientWithStubbedChannels({
            "127.0.0.1:50211": "0.0.3",
        });

        let error = null;
        try {
            await client.ping("0.0.99");
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(error.message).to.contain("0.0.99");
        // It must not silently fall back to some other node
        expect(pings).toHaveBeenCalledTimes(0);

        client.close();
    });

    it("rejects for an invalid node account ID", async function () {
        const { client } = clientWithStubbedChannels({
            "127.0.0.1:50211": "0.0.3",
        });

        let error = null;
        try {
            await client.ping("");
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");

        client.close();
    });

    it("pings every node in the network", async function () {
        const { client, pings } = clientWithStubbedChannels({
            "127.0.0.1:50211": "0.0.3",
            "127.0.0.1:50212": "0.0.4",
            "127.0.0.1:50213": "0.0.5",
        });

        await client.pingAll();

        expect(pings).toHaveBeenCalledTimes(3);

        client.close();
    });

    it("rejects from pingAll when any node is unreachable", async function () {
        const { client } = clientWithStubbedChannels(
            {
                "127.0.0.1:50211": "0.0.3",
                "127.0.0.1:50212": "0.0.4",
            },
            vi.fn((address) =>
                address.endsWith("50212")
                    ? Promise.reject(
                          new GrpcServiceError(GrpcStatus.Unavailable),
                      )
                    : Promise.resolve(),
            ),
        );

        let error = null;
        try {
            await client.pingAll();
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");

        client.close();
    });
});
