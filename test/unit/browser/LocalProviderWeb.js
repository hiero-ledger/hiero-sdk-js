// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LocalProviderWeb from "../../../src/LocalProviderWeb.js";
import WebClient from "../../../src/client/WebClient.js";
import AccountId from "../../../src/account/AccountId.js";
import TransactionId from "../../../src/transaction/TransactionId.js";
import Hbar from "../../../src/Hbar.js";
import AccountBalance from "../../../src/account/AccountBalance.js";
import AccountInfoQuery from "../../../src/account/AccountInfoQuery.js";
import AccountRecordsQuery from "../../../src/account/AccountRecordsQuery.js";
import MirrorNodeAccountBalanceQuery from "../../../src/query/MirrorNodeAccountBalanceQuery.js";
import TransactionReceiptQuery from "../../../src/transaction/TransactionReceiptQuery.js";
import LedgerId from "../../../src/LedgerId.js";

describe("LocalProviderWeb (Browser)", function () {
    /** @type {LocalProviderWeb[]} */
    let providers = [];

    /**
     * @param {LocalProviderWeb} provider
     * @returns {LocalProviderWeb}
     */
    function track(provider) {
        providers.push(provider);
        return provider;
    }

    afterEach(function () {
        for (const provider of providers) {
            try {
                provider.close();
            } catch {
                // Ignore any error on close if client was already closed
            }
        }
        providers = [];
        vi.restoreAllMocks();
    });

    describe("constructor & static factory", function () {
        it("uses the provided client when props.client is given", function () {
            const client = WebClient.forLocalNode({
                scheduleNetworkUpdate: false,
            });
            const provider = track(new LocalProviderWeb({ client }));
            expect(provider.getLedgerId()).to.equal(client.ledgerId);
        });

        it("creates a client for props.networkName when provided", function () {
            const provider = track(
                new LocalProviderWeb({ networkName: "testnet" }),
            );
            expect(provider.getLedgerId()).to.equal(LedgerId.TESTNET);
        });

        it("creates a client for local-node by default when no props are given", function () {
            const provider1 = track(new LocalProviderWeb());
            expect(provider1.getLedgerId()).to.equal(LedgerId.LOCAL_NODE);

            const provider2 = track(new LocalProviderWeb({}));
            expect(provider2.getLedgerId()).to.equal(LedgerId.LOCAL_NODE);
        });

        it("wraps client via fromClient()", function () {
            const client = WebClient.forLocalNode({
                scheduleNetworkUpdate: false,
            });
            const provider = track(LocalProviderWeb.fromClient(client));
            expect(provider).to.be.instanceOf(LocalProviderWeb);
            expect(provider.getLedgerId()).to.equal(client.ledgerId);
        });
    });

    describe("client delegation", function () {
        /** @type {WebClient} */
        let client;
        /** @type {LocalProviderWeb} */
        let provider;

        beforeEach(function () {
            client = WebClient.forLocalNode({
                scheduleNetworkUpdate: false,
            });
            provider = track(new LocalProviderWeb({ client }));
        });

        describe("getters", function () {
            it("getLedgerId returns client's ledgerId", function () {
                expect(provider.getLedgerId()).to.equal(client.ledgerId);
            });

            it("getNetwork returns client's network", function () {
                expect(provider.getNetwork()).to.deep.equal(client.network);
            });

            it("getMirrorNetwork returns client's mirrorNetwork", function () {
                expect(provider.getMirrorNetwork()).to.deep.equal(
                    client.mirrorNetwork,
                );
            });
        });

        describe("queries", function () {
            it("getAccountBalance builds query, executes it, and returns AccountBalance", async function () {
                const hbars = new Hbar(42);
                const execute = vi
                    .spyOn(MirrorNodeAccountBalanceQuery.prototype, "execute")
                    .mockResolvedValue({ hbars });

                const accountId = new AccountId(5);
                const balance = await provider.getAccountBalance(
                    accountId,
                    3000,
                );

                expect(balance).to.be.instanceOf(AccountBalance);
                expect(balance.hbars).to.equal(hbars);
                expect([...balance.tokens.keys()]).to.be.empty;
                expect([...balance.tokenDecimals.keys()]).to.be.empty;

                expect(execute).toHaveBeenCalledWith(client, 3000);
                expect(execute.mock.contexts[0].accountId.toString()).to.equal(
                    "0.0.5",
                );
            });

            it("getAccountBalance works without requestTimeout", async function () {
                const hbars = new Hbar(10);
                const execute = vi
                    .spyOn(MirrorNodeAccountBalanceQuery.prototype, "execute")
                    .mockResolvedValue({ hbars });

                const balance = await provider.getAccountBalance("0.0.5");

                expect(balance).to.be.instanceOf(AccountBalance);
                expect(balance.hbars).to.equal(hbars);
                expect(execute).toHaveBeenCalledWith(client, undefined);
                expect(execute.mock.contexts[0].accountId.toString()).to.equal(
                    "0.0.5",
                );
            });

            it("getAccountInfo builds query and executes it with client", async function () {
                const info = { accountId: new AccountId(5) };
                const execute = vi
                    .spyOn(AccountInfoQuery.prototype, "execute")
                    .mockResolvedValue(info);

                const result = await provider.getAccountInfo("0.0.5");

                expect(result).to.equal(info);
                expect(execute).toHaveBeenCalledWith(client);
                expect(execute.mock.contexts[0].accountId.toString()).to.equal(
                    "0.0.5",
                );
            });

            it("getAccountRecords builds query and executes it with client", async function () {
                const records = [{ memo: "test record" }];
                const execute = vi
                    .spyOn(AccountRecordsQuery.prototype, "execute")
                    .mockResolvedValue(records);

                const result = await provider.getAccountRecords("0.0.5");

                expect(result).to.equal(records);
                expect(execute).toHaveBeenCalledWith(client);
                expect(execute.mock.contexts[0].accountId.toString()).to.equal(
                    "0.0.5",
                );
            });

            it("getTransactionReceipt builds query and executes it with client", async function () {
                const receipt = { status: "SUCCESS" };
                const execute = vi
                    .spyOn(TransactionReceiptQuery.prototype, "execute")
                    .mockResolvedValue(receipt);

                const txId = TransactionId.fromString(
                    "0.0.5@1234567890.000000000",
                );
                const result = await provider.getTransactionReceipt(txId);

                expect(result).to.equal(receipt);
                expect(execute).toHaveBeenCalledWith(client);
                expect(
                    execute.mock.contexts[0].transactionId.toString(),
                ).to.equal(txId.toString());
            });

            it("waitForReceipt calls response.getReceipt with client", async function () {
                const receipt = { status: "SUCCESS" };
                const response = {
                    getReceipt: vi.fn().mockResolvedValue(receipt),
                };

                const result = await provider.waitForReceipt(response);

                expect(result).to.equal(receipt);
                expect(response.getReceipt).toHaveBeenCalledWith(client);
            });
        });

        describe("requests", function () {
            it("sendTransaction executes transaction with client and returns result", async function () {
                const transactionResponse = { transactionId: "0.0.5@1234" };
                const transaction = {
                    execute: vi.fn().mockResolvedValue(transactionResponse),
                };

                const result = await provider.sendTransaction(transaction);

                expect(result).to.equal(transactionResponse);
                expect(transaction.execute).toHaveBeenCalledWith(client);
            });

            it("sendQuery executes query with client and returns result", async function () {
                const queryResponse = { value: "query-data" };
                const query = {
                    execute: vi.fn().mockResolvedValue(queryResponse),
                };

                const result = await provider.sendQuery(query);

                expect(result).to.equal(queryResponse);
                expect(query.execute).toHaveBeenCalledWith(client);
            });

            it("call executes request with client and returns result", async function () {
                const request = {
                    execute: vi.fn().mockResolvedValue("output-result"),
                };

                const result = await provider.call(request);

                expect(result).to.equal("output-result");
                expect(request.execute).toHaveBeenCalledWith(client);
            });
        });

        describe("lifecycle", function () {
            it("close delegates to client close", function () {
                const spy = vi.spyOn(client, "close");
                provider.close();
                expect(spy).toHaveBeenCalled();
            });
        });
    });
});
