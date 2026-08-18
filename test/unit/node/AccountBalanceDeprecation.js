// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AccountId from "../../../src/account/AccountId.js";
import Hbar from "../../../src/Hbar.js";
import LocalProvider from "../../../src/LocalProvider.js";
import NodeClient from "../../../src/client/NodeClient.js";
import PrivateKey from "../../../src/PrivateKey.js";
import Wallet from "../../../src/Wallet.js";

/**
 * A client whose consensus nodes throw if anything asks them for a channel, so
 * a consensus-node call made by these methods fails the test loudly. The mirror
 * node is reached over HTTP, which is stubbed separately.
 */
function clientWithExplodingChannels() {
    // `forNetwork` configures consensus nodes only, so the mirror network has
    // to be set explicitly for the mirror-backed balance read to resolve a URL.
    const client = NodeClient.forNetwork(
        { "127.0.0.1:50211": "0.0.3" },
        { scheduleNetworkUpdate: false },
    ).setMirrorNetwork(["127.0.0.1:5551"]);

    const getChannel = vi.fn(() => {
        throw new Error("a consensus node call was made");
    });

    for (const node of client._network._nodes) {
        node.getChannel = getChannel;
    }

    return { client, getChannel };
}

describe("account balance via the mirror node", function () {
    /** @type {import("vitest").MockInstance} */
    let fetchMock;

    beforeEach(function () {
        fetchMock = vi.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve({
                        balances: [{ account: "0.0.10", balance: 12345 }],
                    }),
            }),
        );
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(function () {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe("LocalProvider.getAccountBalance", function () {
        it("returns the HBAR balance from the mirror node", async function () {
            const { client, getChannel } = clientWithExplodingChannels();
            const provider = new LocalProvider({ client });

            const balance = await provider.getAccountBalance(new AccountId(10));

            expect(balance.hbars.toTinybars().toNumber()).to.equal(12345);
            // Read over HTTP from the mirror node, not from a consensus node.
            expect(getChannel).toHaveBeenCalledTimes(0);
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][0]).to.include("/balances");

            client.close();
        });

        it("returns empty token maps, since the mirror balance is HBAR only", async function () {
            const { client } = clientWithExplodingChannels();
            const provider = new LocalProvider({ client });

            const balance = await provider.getAccountBalance(new AccountId(10));

            expect([...balance.tokens.keys()]).to.be.empty;
            expect([...balance.tokenDecimals.keys()]).to.be.empty;

            client.close();
        });

        it("reports a zero balance for an account the mirror node does not know", async function () {
            fetchMock.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ balances: [] }),
                }),
            );

            const { client } = clientWithExplodingChannels();
            const provider = new LocalProvider({ client });

            const balance = await provider.getAccountBalance(new AccountId(10));

            expect(balance.hbars.toTinybars().toNumber()).to.equal(0);

            client.close();
        });
    });

    describe("Wallet.getAccountBalance", function () {
        it("delegates to the provider", async function () {
            const { client, getChannel } = clientWithExplodingChannels();
            const wallet = new Wallet(
                new AccountId(10),
                PrivateKey.generateED25519(),
                new LocalProvider({ client }),
            );

            const balance = await wallet.getAccountBalance();

            expect(balance.hbars).to.be.an.instanceOf(Hbar);
            expect(balance.hbars.toTinybars().toNumber()).to.equal(12345);
            expect(getChannel).toHaveBeenCalledTimes(0);

            client.close();
        });

        it("throws when the wallet has no provider", function () {
            const wallet = new Wallet(
                new AccountId(10),
                PrivateKey.generateED25519(),
            );

            expect(() => wallet.getAccountBalance()).to.throw(
                "does not contain a provider",
            );
        });
    });
});
