// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LocalProvider from "../../../src/LocalProvider.js";
import NodeClient from "../../../src/client/NodeClient.js";
import AccountId from "../../../src/account/AccountId.js";
import TransactionId from "../../../src/transaction/TransactionId.js";
import Hbar from "../../../src/Hbar.js";
import AccountBalance from "../../../src/account/AccountBalance.js";
import AccountInfoQuery from "../../../src/account/AccountInfoQuery.js";
import AccountRecordsQuery from "../../../src/account/AccountRecordsQuery.js";
import MirrorNodeAccountBalanceQuery from "../../../src/query/MirrorNodeAccountBalanceQuery.js";
import TransactionReceiptQuery from "../../../src/transaction/TransactionReceiptQuery.js";
import LedgerId from "../../../src/LedgerId.js";

describe("LocalProvider (Node)", function () {
    /** @type {LocalProvider[]} */
    let providers = [];

    /**
     * @param {LocalProvider} provider
     * @returns {LocalProvider}
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
        vi.unstubAllEnvs();
    });

    describe("constructor & static factory", function () {
        it("uses the provided client when props.client is given", function () {
            const client = NodeClient.forLocalNode({
                scheduleNetworkUpdate: false,
            });
            const provider = track(new LocalProvider({ client }));
            expect(provider.getLedgerId()).to.equal(client.ledgerId);
        });

        it("throws when HEDERA_NETWORK is not set and no client is provided", function () {
            vi.stubEnv("HEDERA_NETWORK", undefined);
            expect(() => new LocalProvider()).to.throw(
                "LocalProvider requires the `HEDERA_NETWORK` environment variable to be set",
            );
            expect(() => new LocalProvider({})).to.throw(
                "LocalProvider requires the `HEDERA_NETWORK` environment variable to be set",
            );
            expect(() => new LocalProvider(null)).to.throw(
                "LocalProvider requires the `HEDERA_NETWORK` environment variable to be set",
            );
        });

        it("creates a client for HEDERA_NETWORK when set", function () {
            vi.stubEnv("HEDERA_NETWORK", "local-node");
            const provider = track(new LocalProvider());
            expect(provider.getLedgerId()).to.equal(LedgerId.LOCAL_NODE);
        });

        it("wraps client via fromClient()", function () {
            const client = NodeClient.forLocalNode({
                scheduleNetworkUpdate: false,
            });
            const provider = track(LocalProvider.fromClient(client));
            expect(provider).to.be.instanceOf(LocalProvider);
            expect(provider.getLedgerId()).to.equal(client.ledgerId);
        });
    });

    describe("client delegation", function () {
        /** @type {NodeClient} */
        let client;
        /** @type {LocalProvider} */
        let provider;

        beforeEach(function () {
            client = NodeClient.forLocalNode({
                scheduleNetworkUpdate: false,
            });
            provider = track(new LocalProvider({ client }));
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

            it("waitForReceipt builds query with response nodeId and transactionId and executes it with client", async function () {
                const receipt = { status: "SUCCESS" };
                const execute = vi
                    .spyOn(TransactionReceiptQuery.prototype, "execute")
                    .mockResolvedValue(receipt);

                const response = {
                    nodeId: new AccountId(3),
                    transactionId: TransactionId.fromString(
                        "0.0.5@1234567890.000000000",
                    ),
                };
                const result = await provider.waitForReceipt(response);

                expect(result).to.equal(receipt);
                expect(execute).toHaveBeenCalledWith(client);
                expect(
                    execute.mock.contexts[0].nodeAccountIds[0].toString(),
                ).to.equal("0.0.3");
                expect(
                    execute.mock.contexts[0].transactionId.toString(),
                ).to.equal(response.transactionId.toString());
            });
        });

        describe("requests", function () {
            it("call executes request with client and returns result", async function () {
                const request = {
                    execute: vi.fn().mockResolvedValue("output-result"),
                };

                const result = await provider.call(request);

                expect(result).to.equal("output-result");
                expect(request.execute).toHaveBeenCalledWith(client);
            });
        });

        describe("lifecycle & logging", function () {
            it("close delegates to client close", function () {
                const spy = vi.spyOn(client, "close");
                provider.close();
                expect(spy).toHaveBeenCalled();
            });

            it("setLogger delegates to client setLogger", function () {
                const spy = vi.spyOn(client, "setLogger");
                const logger = { info: vi.fn() };
                provider.setLogger(logger);
                expect(spy).toHaveBeenCalledWith(logger);
            });
        });
    });
});
