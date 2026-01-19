import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
    AccountId,
    TransferTransaction,
    Hbar,
    PrivateKey,
} from "../../../src/index.js";
import FeeEstimateQuery from "../../../src/query/FeeEstimateQuery.js";
import FeeEstimateMode from "../../../src/query/enums/FeeEstimateMode.js";
import NativeClient from "../../../src/client/NativeClient.js";

/**
 * Mock fee estimate response matching FeeEstimateResponseJSON format
 */
const MOCK_FEE_ESTIMATE_RESPONSE = {
    mode: "STATE",
    network: {
        multiplier: 1,
        subtotal: 100000,
    },
    node: {
        baseFee: 50000,
        extras: [],
    },
    service: {
        baseFee: 25000,
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
    notes: ["Test note"],
    total: 175500,
};

const server = setupServer();

describe("Transaction.feeEstimateQuery()", function () {
    let client;
    let testPrivateKey;
    const testAccountId = "0.0.123456";
    const customNodeAddress = "fee-estimate-node.example.com";
    const customNodeAddressWithPort = `${customNodeAddress}:50211`;
    const customNodeId = 3;

    beforeAll(() => {
        server.listen();
    });

    beforeEach(function () {
        testPrivateKey = PrivateKey.generate();

        // Create client with custom network
        client = NativeClient.forNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        });

        // Set a custom mirror network
        client.setMirrorNetwork([`${customNodeAddress}:443`]);

        // Set operator
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);
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

    describe("feeEstimateQuery method", function () {
        it("should return a FeeEstimateQuery instance with the transaction set", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const query = transaction.feeEstimateQuery();

            expect(query).to.be.instanceOf(FeeEstimateQuery);
            expect(query.transaction).to.equal(transaction);
            expect(query.mode).to.equal(FeeEstimateMode.STATE);
        });

        it("should allow chaining setMode after feeEstimateQuery", function () {
            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const query = transaction
                .feeEstimateQuery()
                .setMode(FeeEstimateMode.INTRINSIC);

            expect(query).to.be.instanceOf(FeeEstimateQuery);
            expect(query.transaction).to.equal(transaction);
            expect(query.mode).to.equal(FeeEstimateMode.INTRINSIC);
        });
    });

    describe("execute with mocked mirror node", function () {
        it("should execute fee estimate query and return FeeEstimateResponse", async function () {
            let requestReceived = false;
            let requestUrl = "";
            let requestMethod = "";
            let requestContentType = "";

            server.use(
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
            );

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const response = await transaction
                .feeEstimateQuery()
                .execute(client);

            // Verify request was made correctly
            expect(requestReceived).to.be.true;
            expect(requestMethod).to.equal("POST");
            expect(requestContentType).to.equal("application/protobuf");
            expect(requestUrl).to.include("mode=STATE");

            // Verify response was parsed correctly
            expect(response).to.not.be.null;
            expect(response.networkFee.multiplier).to.equal(1);
            expect(Number(response.networkFee.subtotal)).to.equal(100000);
            expect(Number(response.nodeFee.base)).to.equal(50000);
            expect(Number(response.serviceFee.base)).to.equal(25000);
            expect(response.serviceFee.extras).to.have.length(1);
            expect(response.serviceFee.extras[0].name).to.equal("storage");
            expect(response.notes).to.have.length(1);
            expect(response.notes[0]).to.equal("Test note");
            expect(Number(response.total)).to.equal(175500);
        });

        it("should use INTRINSIC mode when set", async function () {
            let requestUrl = "";

            server.use(
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    ({ request }) => {
                        requestUrl = request.url;
                        return HttpResponse.json({
                            ...MOCK_FEE_ESTIMATE_RESPONSE,
                            mode: "INTRINSIC",
                        });
                    },
                ),
            );

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            await transaction
                .feeEstimateQuery()
                .setMode(FeeEstimateMode.INTRINSIC)
                .execute(client);

            expect(requestUrl).to.include("mode=INTRINSIC");
        });

        it("should handle HTTP errors gracefully", async function () {
            server.use(
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    () => {
                        return new HttpResponse(null, { status: 500 });
                    },
                ),
            );

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            try {
                await transaction.feeEstimateQuery().execute(client);
                expect.fail("Expected error to be thrown");
            } catch (error) {
                expect(error.message).to.include("Failed to estimate fees");
                expect(error.message).to.include("HTTP error");
            }
        });

        it("should handle network errors gracefully", async function () {
            server.use(
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    () => {
                        return HttpResponse.error();
                    },
                ),
            );

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            try {
                await transaction.feeEstimateQuery().execute(client);
                expect.fail("Expected error to be thrown");
            } catch (error) {
                expect(error.message).to.include("Failed to estimate fees");
            }
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
            server.use(
                http.post(
                    new RegExp(
                        `https://${customNodeAddress}.*?/api/v1/network/fees`,
                    ),
                    () => {
                        return HttpResponse.json({
                            mode: "STATE",
                            network: {
                                multiplier: 1,
                                subtotal: 50000,
                            },
                            node: {
                                baseFee: 25000,
                                extras: [],
                            },
                            service: {
                                baseFee: 12500,
                                extras: [],
                            },
                            notes: [],
                            total: 87500,
                        });
                    },
                ),
            );

            const transaction = new TransferTransaction()
                .addHbarTransfer(new AccountId(1001), new Hbar(-10))
                .addHbarTransfer(new AccountId(1002), new Hbar(10));

            const response = await transaction
                .feeEstimateQuery()
                .execute(client);

            expect(response.nodeFee.extras).to.have.length(0);
            expect(response.serviceFee.extras).to.have.length(0);
            expect(response.notes).to.have.length(0);
        });
    });
});
