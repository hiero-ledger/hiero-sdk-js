// SPDX-License-Identifier: Apache-2.0

import { http, HttpResponse } from "msw";
import {
    Client,
    AccountId,
    TransferTransaction,
    Hbar,
    PrivateKey,
} from "../../../src/browser.js";
import FeeEstimateQuery from "../../../src/query/FeeEstimateQuery.js";
import FeeEstimateMode from "../../../src/query/enums/FeeEstimateMode.js";
import { startMSW, cleanupMSW } from "./utils/MswSetup.js";

/**
 * Mock fee estimate response matching FeeEstimateResponseJSON per HIP-1261.
 */
const MOCK_FEE_ESTIMATE_RESPONSE = {
    high_volume_multiplier: 1,
    network: {
        multiplier: 1,
        subtotal: 100000,
    },
    node: {
        base: 50000,
        extras: [],
    },
    service: {
        base: 25000,
        extras: [
            {
                name: "storage",
                included: 100,
                count: 150,
                charged: 50,
                fee_per_unit: 10,
                subtotal: 500,
            },
        ],
    },
    total: 175500,
};

describe("Transaction.estimateFee() Browser Tests", function () {
    let client;
    let testPrivateKey;
    let worker;
    const testAccountId = "0.0.123456";
    const customNodeAddress = "fee-estimate-node.example.com";
    const customNodeAddressWithPort = `${customNodeAddress}:443`;
    const customNodeId = 3;

    beforeEach(function () {
        testPrivateKey = PrivateKey.generate();

        client = Client.forNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        });

        client.setMirrorNetwork([`${customNodeAddress}:443`]);

        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);
    });

    afterEach(async function () {
        if (client) {
            client.close();
        }
        await cleanupMSW(worker);
    });

    describe("feeEstimateQuery method", function () {
        it("should return a FeeEstimateQuery instance with the transaction set and INTRINSIC default", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const query = transaction.estimateFee();

            expect(query).to.be.instanceOf(FeeEstimateQuery);
            expect(query.transaction).to.equal(transaction);
            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
        });

        it("should allow chaining setMode after feeEstimateQuery", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const query = transaction
                .estimateFee()
                .setMode(FeeEstimateMode.STATE);

            expect(query).to.be.instanceOf(FeeEstimateQuery);
            expect(query.transaction).to.equal(transaction);
            expect(query.mode).to.equal(FeeEstimateMode.STATE);
        });
    });

    describe("execute with mocked mirror node", function () {
        it("should execute fee estimate query and return FeeEstimateResponse with INTRINSIC default", async function () {
            let requestReceived = false;
            let requestUrl = "";
            let requestMethod = "";
            let requestContentType = "";

            const handlers = [
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    ({ request }) => {
                        requestReceived = true;
                        requestUrl = request.url;
                        requestMethod = request.method;
                        requestContentType =
                            request.headers.get("Content-Type") || "";

                        return HttpResponse.json(MOCK_FEE_ESTIMATE_RESPONSE);
                    },
                ),
            ];

            worker = await startMSW(handlers);

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const response = await transaction
                .estimateFee()
                .execute(client);

            expect(requestReceived).to.be.true;
            expect(requestMethod).to.equal("POST");
            expect(requestContentType).to.equal("application/protobuf");
            // Default mode per HIP-1261 is INTRINSIC.
            expect(requestUrl).to.include("mode=INTRINSIC");
            // No throttle set => no high_volume_throttle param.
            expect(requestUrl).to.not.include("high_volume_throttle");

            expect(response).to.not.be.null;
            expect(response.highVolumeMultiplier.toNumber()).to.equal(1);
            expect(response.networkFee.multiplier).to.equal(1);
            expect(Number(response.networkFee.subtotal)).to.equal(100000);
            expect(Number(response.nodeFee.base)).to.equal(50000);
            expect(Number(response.serviceFee.base)).to.equal(25000);
            expect(response.serviceFee.extras).to.have.length(1);
            expect(response.serviceFee.extras[0].name).to.equal("storage");
            expect(Number(response.total)).to.equal(175500);
        });

        it("should send STATE mode when explicitly set", async function () {
            let requestUrl = "";

            const handlers = [
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    ({ request }) => {
                        requestUrl = request.url;
                        return HttpResponse.json(MOCK_FEE_ESTIMATE_RESPONSE);
                    },
                ),
            ];

            worker = await startMSW(handlers);

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            await transaction
                .estimateFee()
                .setMode(FeeEstimateMode.STATE)
                .execute(client);

            expect(requestUrl).to.include("mode=STATE");
        });

        it("should include high_volume_throttle query param when set", async function () {
            let requestUrl = "";

            const handlers = [
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    ({ request }) => {
                        requestUrl = request.url;
                        return HttpResponse.json({
                            ...MOCK_FEE_ESTIMATE_RESPONSE,
                            high_volume_multiplier: 2,
                        });
                    },
                ),
            ];

            worker = await startMSW(handlers);

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const response = await transaction
                .estimateFee()
                .setHighVolumeThrottle(5000)
                .execute(client);

            expect(requestUrl).to.include("high_volume_throttle=5000");
            expect(response.highVolumeMultiplier.toNumber()).to.be.at.least(1);
        });

        it("should fail fast on HTTP 400 (malformed transaction) without retry", async function () {
            let attempts = 0;
            const handlers = [
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    () => {
                        attempts += 1;
                        return new HttpResponse(null, { status: 400 });
                    },
                ),
            ];

            worker = await startMSW(handlers);

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            let caught = null;
            try {
                await transaction.estimateFee().execute(client);
            } catch (error) {
                caught = error;
            }
            expect(caught).to.not.be.null;
            expect(caught.message).to.include("Failed to estimate fees");
            expect(caught.message).to.include("HTTP 400");
            expect(attempts).to.equal(1);
        });

        it("should retry on HTTP 503 then succeed", async function () {
            let attempts = 0;
            const handlers = [
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    () => {
                        attempts += 1;
                        if (attempts < 2) {
                            return new HttpResponse(null, { status: 503 });
                        }
                        return HttpResponse.json(MOCK_FEE_ESTIMATE_RESPONSE);
                    },
                ),
            ];

            worker = await startMSW(handlers);

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const response = await transaction
                .estimateFee()
                .execute(client);

            expect(attempts).to.be.at.least(2);
            expect(Number(response.total)).to.equal(175500);
        });

        it("should reject when transaction is not set", async function () {
            const query = new FeeEstimateQuery();

            try {
                await query.execute(client);
                expect.fail("Expected error to be thrown");
            } catch (error) {
                expect(error.message).to.equal(
                    "FeeEstimateQuery requires a transaction",
                );
            }
        });

        it("should handle response with empty extras", async function () {
            const handlers = [
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    () => {
                        return HttpResponse.json({
                            high_volume_multiplier: 1,
                            network: {
                                multiplier: 1,
                                subtotal: 50000,
                            },
                            node: {
                                base: 25000,
                                extras: [],
                            },
                            service: {
                                base: 12500,
                                extras: [],
                            },
                            total: 87500,
                        });
                    },
                ),
            ];

            worker = await startMSW(handlers);

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const response = await transaction
                .estimateFee()
                .execute(client);

            expect(response.nodeFee.extras).to.have.length(0);
            expect(response.serviceFee.extras).to.have.length(0);
        });
    });
});
