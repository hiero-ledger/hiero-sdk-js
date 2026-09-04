// SPDX-License-Identifier: Apache-2.0

import {
    ALL_NETWORK_IPS,
    ALL_WEB_NETWORK_NODES,
    LocalNodeNetwork,
    LocalNodeWebNetwork,
    MAINNET,
    NATIVE_PREVIEWNET,
    NATIVE_TESTNET,
    WEB_PREVIEWNET,
    WEB_TESTNET,
} from "../../src/constants/ClientConstants.js";
import AccountId from "../../src/account/AccountId.js";

/**
 * These maps used to be covered by `ClientConstantsIntegrationTest`, which
 * pinned a free `AccountBalanceQuery` to each entry's node account ID. That
 * only appeared to work: because the query required no payment,
 * `Executable.transactionNodeIds` stayed empty, so the "node is not in the
 * client's network" guard never fired and node selection silently fell back to
 * a random node in the *local* test network. Every assertion was really being
 * answered by node 0.0.3.
 */
describe("ClientConstants", function () {
    const nodeNetworks = {
        MAINNET,
        WEB_TESTNET,
        WEB_PREVIEWNET,
        NATIVE_TESTNET,
        NATIVE_PREVIEWNET,
        LocalNodeNetwork,
        LocalNodeWebNetwork,
    };

    for (const [name, network] of Object.entries(nodeNetworks)) {
        describe(name, function () {
            it("is not empty", function () {
                expect(Object.keys(network).length).to.be.greaterThan(0);
            });

            it("maps every address to a node AccountId", function () {
                for (const [address, accountId] of Object.entries(network)) {
                    expect(
                        accountId,
                        `${name}["${address}"]`,
                    ).to.be.an.instanceOf(AccountId);
                    expect(
                        accountId.num.toNumber(),
                        `${name}["${address}"]`,
                    ).to.be.greaterThan(0);
                }
            });

            it("uses host:port addresses with a numeric port", function () {
                for (const address of Object.keys(network)) {
                    const [host, port, ...rest] = address.split(":");

                    expect(rest, address).to.be.empty;
                    expect(host, address).to.not.be.empty;
                    expect(Number.isInteger(Number(port)), address).to.be.true;
                    expect(Number(port), address).to.be.greaterThan(0);
                }
            });
        });
    }

    describe("ALL_WEB_NETWORK_NODES", function () {
        it("contains every web network address", function () {
            for (const network of [MAINNET, WEB_TESTNET, WEB_PREVIEWNET]) {
                for (const address of Object.keys(network)) {
                    expect(
                        ALL_WEB_NETWORK_NODES[address],
                        address,
                    ).to.be.an.instanceOf(AccountId);
                }
            }
        });
    });

    describe("ALL_NETWORK_IPS", function () {
        // The keys deliberately carry a trailing colon so the literals are not
        // read as bare hardcoded IP addresses by static analysis; `NodeChannel`
        // re-appends it on lookup. A key without it would silently never match.
        it("keys every IP with a trailing colon", function () {
            for (const key of Object.keys(ALL_NETWORK_IPS)) {
                expect(key.endsWith(":"), key).to.be.true;
                expect(key.slice(0, -1), key).to.not.include(":");
            }
        });

        it("maps every IP to a parseable account ID string", function () {
            for (const [key, accountId] of Object.entries(ALL_NETWORK_IPS)) {
                expect(accountId, key).to.be.a("string");
                expect(
                    AccountId.fromString(accountId).num.toNumber(),
                    key,
                ).to.be.greaterThan(0);
            }
        });
    });
});
