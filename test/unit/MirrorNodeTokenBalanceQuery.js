// SPDX-License-Identifier: Apache-2.0

import AccountId from "../../src/account/AccountId.js";
import MirrorNodeStatusError from "../../src/MirrorNodeStatusError.js";
import MirrorNodeTokenBalanceQuery from "../../src/query/MirrorNodeTokenBalanceQuery.js";
import Status from "../../src/Status.js";
import TokenId from "../../src/token/TokenId.js";
import { Client } from "../../src/index.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "./utils/FakeHttpTransport.js";

describe("MirrorNodeTokenBalanceQuery", function () {
    /** @type {FakeHttpTransport} */
    let fake;
    /** @type {Client} */
    let client;

    beforeEach(function () {
        fake = new FakeHttpTransport(() =>
            jsonResponse(200, {
                tokens: [{ token_id: "0.0.5005", balance: 1234, decimals: 2 }],
            }),
        );
        client = new Client();
        client.setMirrorNetwork(["localhost:5551"]);
        client.setMirrorNodeHttpConfig({
            transport: fake,
            retryPolicy: { maxAttempts: 3, initialBackoff: 1, maxBackoff: 1 },
        });
    });

    afterEach(function () {
        client.close();
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
                .execute(client);

            expect(fake.requests).to.have.length(1);
            expect(fake.requests[0].url).to.equal(
                "http://localhost:5551/api/v1/accounts/0.0.10/tokens?token.id=0.0.5005",
            );
            expect(fake.requests[0].method).to.equal("GET");
        });

        it("returns the balance and decimals", async function () {
            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(client);

            expect(balance.balance.toNumber()).to.equal(1234);
            expect(balance.decimals).to.equal(2);
            expect(balance.tokenId.toString()).to.equal("0.0.5005");
        });

        it("reports zero when the account holds no relationship with the token", async function () {
            fake.handler = () => jsonResponse(200, { tokens: [] });

            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(client);

            expect(balance.balance.toNumber()).to.equal(0);
            expect(balance.decimals).to.equal(0);
        });

        it("requires an account ID", async function () {
            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setTokenId("0.0.5005")
                    .execute(client);
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.include("accountId");
            expect(fake.requests).to.have.length(0);
        });

        it("requires a token ID", async function () {
            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setAccountId("0.0.10")
                    .execute(client);
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.include("tokenId");
            expect(fake.requests).to.have.length(0);
        });

        it("retries a 5xx and then succeeds", async function () {
            fake.handler = null;
            fake.respond(errorResponse(503, "boom")).respondJson(200, {
                tokens: [{ token_id: "0.0.5005", balance: 7, decimals: 0 }],
            });

            const balance = await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(client);

            expect(fake.requests).to.have.length(2);
            expect(balance.balance.toNumber()).to.equal(7);
        });

        it("throws MirrorNodeStatusError for an account the mirror node does not know", async function () {
            // This endpoint 404s for an unknown account, unlike `/balances`.
            fake.handler = () => errorResponse(404, "Not found");

            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setAccountId("0.0.10")
                    .setTokenId("0.0.5005")
                    .execute(client);
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an.instanceOf(MirrorNodeStatusError);
            expect(error.status).to.equal(Status.InvalidAccountId);
            // A 404 is not retried.
            expect(fake.requests).to.have.length(1);
        });

        it("throws on a 4xx without retrying", async function () {
            fake.handler = () => errorResponse(400, "bad id");

            let error = null;
            try {
                await new MirrorNodeTokenBalanceQuery()
                    .setAccountId("0.0.10")
                    .setTokenId("0.0.5005")
                    .execute(client);
            } catch (err) {
                error = err;
            }

            expect(error).to.be.an("Error");
            expect(error.message).to.include("HTTP 400: Error: bad id");
            expect(fake.requests).to.have.length(1);
        });

        it("rejects an empty or foreign body instead of reporting zero", async function () {
            for (const body of [
                undefined,
                {},
                { tokens: null },
                { tokens: "x" },
            ]) {
                fake.handler = () => jsonResponse(200, body);

                let error = null;
                try {
                    await new MirrorNodeTokenBalanceQuery()
                        .setAccountId("0.0.10")
                        .setTokenId("0.0.5005")
                        .execute(client);
                } catch (err) {
                    error = err;
                }

                expect(error, JSON.stringify(body)).to.not.be.null;
                expect(error.message).to.include(
                    "response has no tokens array",
                );
                expect(error).to.not.be.instanceOf(MirrorNodeStatusError);
            }
        });

        it("bounds the operation by the given requestTimeout", async function () {
            await new MirrorNodeTokenBalanceQuery()
                .setAccountId("0.0.10")
                .setTokenId("0.0.5005")
                .execute(client, 2500);

            expect(fake.requests[0].deadline).to.be.within(2400, 2500);
        });
    });
});
