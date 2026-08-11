// SPDX-License-Identifier: Apache-2.0

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { AccountId, TokenId } from "../../../src/index.js";
import MirrorNodeAccountBalanceQuery from "../../../src/query/MirrorNodeAccountBalanceQuery.js";
import NativeClient from "../../../src/client/NativeClient.js";

const MIRROR_HOST = "balance-mirror.example.com";
const ACCOUNTS_URL = `https://${MIRROR_HOST}/api/v1/accounts/0.0.123`;

const server = setupServer();

describe("MirrorNodeAccountBalanceQuery (wire)", function () {
    let client;

    beforeAll(() => {
        server.listen();
    });

    beforeEach(function () {
        client = NativeClient.forNetwork({
            "node.example.com:50211": new AccountId(3),
        });
        client.setMirrorNetwork([`${MIRROR_HOST}:443`]);
        // Keep the retry backoff short so the retry test stays fast.
        client.setMinBackoff(1).setMaxBackoff(1);
    });

    afterEach(function () {
        if (client) {
            client.close();
        }
        server.resetHandlers();
    });

    afterAll(() => {
        server.close();
    });

    it("should parse the hbar balance and accumulate every token page", async function () {
        let tokensRequests = 0;

        server.use(
            http.get(ACCOUNTS_URL, () =>
                HttpResponse.json({
                    account: "0.0.123",
                    balance: {
                        balance: 123456789,
                        tokens: [{ token_id: "0.0.999", balance: 1 }],
                    },
                }),
            ),
            http.get(`${ACCOUNTS_URL}/tokens`, ({ request }) => {
                tokensRequests += 1;
                const isSecondPage = new URL(request.url).searchParams.has(
                    "token.id",
                );

                if (isSecondPage) {
                    return HttpResponse.json({
                        tokens: [
                            { token_id: "0.0.333", balance: 9, decimals: 8 },
                        ],
                        links: { next: null },
                    });
                }

                return HttpResponse.json({
                    tokens: [
                        { token_id: "0.0.111", balance: 250, decimals: 3 },
                        { token_id: "0.0.222", balance: 7, decimals: 0 },
                    ],
                    links: {
                        next: "/api/v1/accounts/0.0.123/tokens?token.id=gt:0.0.222",
                    },
                });
            }),
        );

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(tokensRequests).to.equal(2);
        expect(balance.hbars.toTinybars().toString()).to.equal("123456789");
        expect(
            balance.tokens.get(TokenId.fromString("0.0.111")).toString(),
        ).to.equal("250");
        expect(
            balance.tokens.get(TokenId.fromString("0.0.222")).toString(),
        ).to.equal("7");
        expect(
            balance.tokens.get(TokenId.fromString("0.0.333")).toString(),
        ).to.equal("9");
        expect(
            balance.tokenDecimals.get(TokenId.fromString("0.0.111")),
        ).to.equal(3);
        expect(
            balance.tokenDecimals.get(TokenId.fromString("0.0.222")),
        ).to.equal(0);
        expect(
            balance.tokenDecimals.get(TokenId.fromString("0.0.333")),
        ).to.equal(8);
        expect(balance.tokens.get(TokenId.fromString("0.0.999"))).to.be.null;
    });

    it("should not retry a 404", async function () {
        let requests = 0;

        server.use(
            http.get(ACCOUNTS_URL, () => {
                requests += 1;
                return HttpResponse.json(
                    { _status: { messages: [{ message: "Not found" }] } },
                    { status: 404 },
                );
            }),
        );

        let message = "";
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        } catch (error) {
            message = error.message;
        }

        expect(requests).to.equal(1);
        expect(message).to.include("404");
        expect(message).to.include("Not found");
    });

    it("should not retry a 400", async function () {
        let requests = 0;

        server.use(
            http.get(ACCOUNTS_URL, () => {
                requests += 1;
                return HttpResponse.json(
                    {
                        _status: {
                            messages: [{ message: "Invalid parameter" }],
                        },
                    },
                    { status: 400 },
                );
            }),
        );

        let message = "";
        try {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        } catch (error) {
            message = error.message;
        }

        expect(requests).to.equal(1);
        expect(message).to.include("400");
        expect(message).to.include("Invalid parameter");
    });

    it("should retry a 503 and return the balance on the next attempt", async function () {
        let requests = 0;

        server.use(
            http.get(ACCOUNTS_URL, () => {
                requests += 1;
                if (requests === 1) {
                    return new HttpResponse(null, { status: 503 });
                }
                return HttpResponse.json({
                    account: "0.0.123",
                    balance: { balance: 42 },
                });
            }),
            http.get(`${ACCOUNTS_URL}/tokens`, () =>
                HttpResponse.json({ tokens: [], links: { next: null } }),
            ),
        );

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(requests).to.equal(2);
        expect(balance.hbars.toTinybars().toString()).to.equal("42");
        expect(balance.tokens.size).to.equal(0);
    });
});
