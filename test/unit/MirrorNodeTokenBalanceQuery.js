// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AccountId from "../../src/account/AccountId.js";
import MirrorNodeTokenBalanceQuery from "../../src/query/MirrorNodeTokenBalanceQuery.js";
import TokenId from "../../src/token/TokenId.js";

/**
 * The minimum a client needs to expose for a mirror REST query.
 */
function stubClient() {
    return {
        mirrorRestApiBaseUrl: "http://localhost:5551/api/v1",
        requestTimeout: 10000,
        maxAttempts: 3,
        minBackoff: 1,
        maxBackoff: 2,
    };
}

/**
 * @param {object} body
 * @param {number} [status]
 */
function jsonResponse(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    };
}

describe("MirrorNodeTokenBalanceQuery", function () {
    /** @type {import("vitest").MockInstance} */
    let fetchMock;

    beforeEach(function () {
        fetchMock = vi.fn(() =>
            Promise.resolve(
                jsonResponse({
                    tokens: [
                        { token_id: "0.0.5005", balance: 1234, decimals: 2 },
                    ],
                }),
            ),
        );
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(function () {
        vi.unstubAllGlobals();
    });

    describe("setters", function () {
        it("accepts strings and instances", function () {
            const query = new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005");

            expect(query.accountId.toString()).to.equal("0.0.10");
            expect(query.tokenId.toString()).to.equal("0.0.5005");

            const fromInstances = new MirrorNodeTokenBalanceQuery()
                .setAccountId(new AccountId(10))
                .setTokenId(new TokenId(5005));

            expect(fromInstances.accountId.toString()).to.equal("0.0.10");
            expect(fromInstances.tokenId.toString()).to.equal("0.0.5005");
        });

        it("accepts both in the constructor", function () {
            const query = new MirrorNodeTokenBalanceQuery({
                accountId: "0.0.10",
                tokenId: "0.0.5005",
            });

            expect(query.accountId.toString()).to.equal("0.0.10");
            expect(query.tokenId.toString()).to.equal("0.0.5005");
        });
    });

    describe("execute", function () {
        it("issues one request to the account's tokens endpoint scoped by token", async function () {
            await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(stubClient());

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][0]).to.equal(
                "http://localhost:5551/api/v1/accounts/0.0.10/tokens?token.id=0.0.5005",
            );
            expect(fetchMock.mock.calls[0][1].method).to.equal("GET");
        });

        it("returns the balance and decimals", async function () {
            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(stubClient());

            expect(balance.balance.toNumber()).to.equal(1234);
            expect(balance.decimals).to.equal(2);
            expect(balance.tokenId.toString()).to.equal("0.0.5005");
        });

        it("reports zero when the account holds no relationship with the token", async function () {
            fetchMock.mockImplementation(() =>
                Promise.resolve(jsonResponse({ tokens: [] })),
            );

            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(stubClient());

            expect(balance.balance.toNumber()).to.equal(0);
            expect(balance.decimals).to.equal(0);
        });

        it("requires an account ID", async function () {
            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setTokenId("0.0.5005")
                    .execute(stubClient());
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.include("accountId");
            expect(fetchMock).toHaveBeenCalledTimes(0);
        });

        it("requires a token ID", async function () {
            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setAccountId("0.0.10")
                    .execute(stubClient());
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.include("tokenId");
            expect(fetchMock).toHaveBeenCalledTimes(0);
        });

        it("retries a 5xx and then succeeds", async function () {
            let calls = 0;
            fetchMock.mockImplementation(() => {
                calls += 1;
                return Promise.resolve(
                    calls === 1
                        ? jsonResponse({ _status: "boom" }, 503)
                        : jsonResponse({
                              tokens: [
                                  {
                                      token_id: "0.0.5005",
                                      balance: 7,
                                      decimals: 0,
                                  },
                              ],
                          }),
                );
            });

            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(stubClient());

            expect(calls).to.equal(2);
            expect(balance.balance.toNumber()).to.equal(7);
        });

        it("throws on a 4xx without retrying", async function () {
            fetchMock.mockImplementation(() =>
                Promise.resolve(jsonResponse({ _status: "bad id" }, 400)),
            );

            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setAccountId("0.0.10")
                    .setTokenId("0.0.5005")
                    .execute(stubClient());
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.include("HTTP 400");
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });
});
