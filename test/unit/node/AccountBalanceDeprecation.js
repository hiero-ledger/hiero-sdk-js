// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import { ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE } from "../../../src/account/AccountBalanceQuery.js";
import AccountId from "../../../src/account/AccountId.js";
import LocalProvider from "../../../src/LocalProvider.js";
import NodeClient from "../../../src/client/NodeClient.js";
import PrivateKey from "../../../src/PrivateKey.js";
import Wallet from "../../../src/Wallet.js";

/**
 * A client whose nodes throw if anything asks them for a channel, so a
 * network call made by any of these methods fails the test loudly.
 */
function clientWithExplodingChannels() {
    const client = NodeClient.forNetwork(
        { "127.0.0.1:50211": "0.0.3" },
        { scheduleNetworkUpdate: false },
    );

    const getChannel = vi.fn(() => {
        throw new Error("a network call was made");
    });

    for (const node of client._network._nodes) {
        node.getChannel = getChannel;
    }

    return { client, getChannel };
}

describe("account balance deprecation", function () {
    describe("LocalProvider.getAccountBalance", function () {
        it("rejects with the deprecation error and makes no network call", async function () {
            const { client, getChannel } = clientWithExplodingChannels();
            const provider = new LocalProvider({ client });

            let error = null;
            try {
                // eslint-disable-next-line deprecation/deprecation
                await provider.getAccountBalance(new AccountId(10));
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.equal(
                ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
            );
            expect(getChannel).toHaveBeenCalledTimes(0);

            client.close();
        });

        it("rejects rather than throwing synchronously", function () {
            const { client } = clientWithExplodingChannels();
            const provider = new LocalProvider({ client });

            // The `Provider` contract is `Promise<AccountBalance>`; callers
            // using `.catch()` must keep working.
            // eslint-disable-next-line deprecation/deprecation
            const result = provider.getAccountBalance(new AccountId(10));

            expect(result).to.be.an.instanceOf(Promise);

            return result
                .then(() => {
                    throw new Error("expected a rejection");
                })
                .catch((/** @type {Error} */ err) => {
                    expect(err.message).to.equal(
                        ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
                    );
                    client.close();
                });
        });
    });

    describe("Wallet.getAccountBalance", function () {
        it("rejects with the deprecation error and makes no network call", async function () {
            const { client, getChannel } = clientWithExplodingChannels();
            const wallet = new Wallet(
                new AccountId(10),
                PrivateKey.generateED25519(),
                new LocalProvider({ client }),
            );

            let error = null;
            try {
                // eslint-disable-next-line deprecation/deprecation
                await wallet.getAccountBalance();
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.equal(
                ACCOUNT_BALANCE_QUERY_DEPRECATION_MESSAGE,
            );
            expect(getChannel).toHaveBeenCalledTimes(0);

            client.close();
        });
    });
});
