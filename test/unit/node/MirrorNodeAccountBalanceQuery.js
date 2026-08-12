// SPDX-License-Identifier: Apache-2.0

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { AccountId } from "../../../src/index.js";
import MirrorNodeAccountBalanceQuery from "../../../src/query/MirrorNodeAccountBalanceQuery.js";
import NativeClient from "../../../src/client/NativeClient.js";

const MIRROR_HOST = "balance-mirror.example.com";
const BALANCES_URL = `https://${MIRROR_HOST}/api/v1/balances`;

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

    it("should send account.id and parse the hbar balance", async function () {
        let accountIdParam = null;

        server.use(
            http.get(BALANCES_URL, ({ request }) => {
                accountIdParam = new URL(request.url).searchParams.get(
                    "account.id",
                );
                return HttpResponse.json({
                    timestamp: "1234567890.000000001",
                    balances: [{ account: "0.0.123", balance: 123456789 }],
                    links: { next: null },
                });
            }),
        );

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(accountIdParam).to.equal("0.0.123");
        expect(balance.hbars.toTinybars().toString()).to.equal("123456789");
    });

    it("should return zero hbars when the account does not exist", async function () {
        let requests = 0;

        server.use(
            http.get(BALANCES_URL, () => {
                requests += 1;
                return HttpResponse.json({
                    timestamp: null,
                    balances: [],
                    links: { next: null },
                });
            }),
        );

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(requests).to.equal(1);
        expect(balance.hbars.toTinybars().toString()).to.equal("0");
    });

    it("should not retry a 400", async function () {
        let requests = 0;

        server.use(
            http.get(BALANCES_URL, () => {
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
            http.get(BALANCES_URL, () => {
                requests += 1;
                if (requests === 1) {
                    return new HttpResponse(null, { status: 503 });
                }
                return HttpResponse.json({
                    timestamp: "1234567890.000000001",
                    balances: [{ account: "0.0.123", balance: 42 }],
                    links: { next: null },
                });
            }),
        );

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(requests).to.equal(2);
        expect(balance.hbars.toTinybars().toString()).to.equal("42");
    });
});
