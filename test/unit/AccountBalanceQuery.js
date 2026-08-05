// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AccountBalanceQuery from "../../src/account/AccountBalanceQuery.js";
import AccountId from "../../src/account/AccountId.js";
import NodeClient from "../../src/client/NodeClient.js";

/**
 * A client whose nodes hand out a channel that throws as soon as any gRPC
 * service is touched, so that a single network call fails the test loudly.
 */

function clientWithExplodingChannels() {
    const client = NodeClient.forNetwork(
        { "127.0.0.1:50211": "0.0.3" },
        { scheduleNetworkUpdate: false },
    );

    let rpcAttempts = 0;

    const channel = new Proxy(
        { setGrpcDeadline: () => {} },
        {
            get(target, property) {
                if (property in target) {
                    return target[property];
                }

                rpcAttempts += 1;
                throw new Error(
                    `a network call was made: channel.${String(property)}`,
                );
            },
        },
    );

    const getChannel = vi.fn(() => channel);

    for (const node of client._network._nodes) {
        node.getChannel = getChannel;
    }

    return { client, getChannel, rpcAttempts: () => rpcAttempts };
}

const ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE =
    "Deprecated: AccountBalanceQuery is no longer supported. " +
    "Use MirrorNodeAccountBalanceQuery or the mirror node REST API " +
    "(GET /api/v1/accounts/{id}) to retrieve account balances.";

describe("AccountBalanceQuery", function () {
    /** @type {import("vitest").MockInstance} */
    let warn;

    beforeEach(function () {
        warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(function () {
        vi.restoreAllMocks();
    });

    it("warns that it is deprecated on construction", function () {
        new AccountBalanceQuery();

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).to.equal(
            ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
        );
    });

    it("warns when constructed with properties", function () {
        new AccountBalanceQuery({ accountId: new AccountId(10) });

        expect(warn).toHaveBeenCalledTimes(1);
    });

    it("warns when deserialized from protobuf", function () {
        AccountBalanceQuery._fromProtobuf({
            cryptogetAccountBalance: {
                accountID: new AccountId(10)._toProtobuf(),
            },
        });

        expect(warn).toHaveBeenCalledTimes(1);
    });

    it("rejects on execute without making a network call", async function () {
        const { client, getChannel, rpcAttempts } =
            clientWithExplodingChannels();

        let error = null;

        try {
            await new AccountBalanceQuery()
                .setAccountId(new AccountId(10))
                .execute(client);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(error.message).to.equal(
            ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
        );
        // The query never even reaches node selection
        expect(getChannel).toHaveBeenCalledTimes(0);
        expect(rpcAttempts()).to.equal(0);

        client.close();
    });

    it("rejects on execute even when node account IDs are set", async function () {
        const { client, getChannel, rpcAttempts } =
            clientWithExplodingChannels();

        let error = null;

        try {
            await new AccountBalanceQuery()
                .setAccountId(new AccountId(10))
                .setNodeAccountIds([new AccountId(3)])
                .execute(client);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(error.message).to.equal(
            ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
        );
        expect(getChannel).toHaveBeenCalledTimes(0);
        expect(rpcAttempts()).to.equal(0);

        client.close();
    });

    it("rejects on getCost without making a network call", async function () {
        const { client, rpcAttempts } = clientWithExplodingChannels();

        let error = null;

        try {
            await new AccountBalanceQuery()
                .setAccountId(new AccountId(10))
                .getCost(client);
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(rpcAttempts()).to.equal(0);

        client.close();
    });

    it("rejects on the internal execution path", async function () {
        const channel = {
            get crypto() {
                throw new Error("a network call was made");
            },
        };

        let error = null;

        try {
            await new AccountBalanceQuery()._execute(channel, {});
        } catch (err) {
            error = err;
        }

        expect(error).to.be.an("Error");
        expect(error.message).to.equal(
            ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
        );
    });
});
