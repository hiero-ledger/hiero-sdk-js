import {
    TransactionReceiptQuery,
    Status,
    MaxAttemptsOrTimeoutError,
} from "../../../src/index.js";
import Mocker from "../Mocker.js";
import Long from "long";

const TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE = {
    transactionGetReceipt: {
        header: { nodeTransactionPrecheckCode: 0 },
        receipt: {
            status: 22, // SUCCESS
            accountId: {
                shardNum: Long.ZERO,
                realmNum: Long.ZERO,
                accountNum: Long.fromNumber(10),
            },
        },
    },
};

describe("NodeClient Mocking Integration Tests", function () {
    let client;
    let servers;

    afterEach(function () {
        if (client) {
            client.close();
        }
        if (servers) {
            servers.close();
        }
    });

    describe("grpcDeadline functionality", function () {
        it("should timeout when response takes longer than grpcDeadline", async function () {
            const slowResponse = {
                call: async () => {
                    // Simulate a response that takes longer than grpcDeadline
                    await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds
                    return TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE;
                },
            };

            ({ client, servers } = await Mocker.withResponses([
                [slowResponse],
            ]));
            client.setGrpcDeadline(1000); // 1 second deadline

            try {
                await new TransactionReceiptQuery()
                    .setTransactionId("0.0.3@4.5")
                    .setMaxAttempts(1)
                    .execute(client);
                expect.fail("Expected timeout error");
            } catch (error) {
                expect(error.message).to.include("DEADLINE_EXCEEDED");
            }
        });

        it("should succeed when response is faster than grpcDeadline", async function () {
            const fastResponse = {
                call: async () => {
                    // Simulate a fast response
                    await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms
                    return TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE;
                },
            };

            ({ client, servers } = await Mocker.withResponses([
                [fastResponse],
            ]));
            client.setGrpcDeadline(1000); // 1 second deadline

            const receipt = await new TransactionReceiptQuery()
                .setTransactionId("0.0.3@4.5")
                .setValidateStatus(false)
                .execute(client);

            expect(receipt.status.toString()).to.be.equal(
                Status.Success.toString(),
            );
        });

        it("should use request-level grpcDeadline over client-level when request level deadline is more than client level deadline", async function () {
            const slowResponse = {
                call: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds
                    return TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE;
                },
            };

            ({ client, servers } = await Mocker.withResponses([
                [slowResponse],
            ]));
            client.setGrpcDeadline(5000); // 5 second client deadline

            try {
                // Create a query with shorter deadline
                const query = new TransactionReceiptQuery()
                    .setTransactionId("0.0.3@4.5")
                    .setMaxAttempts(1)
                    .setGrpcDeadline(1000); // 1 second request deadline

                await query.execute(client);
                expect.fail("Expected timeout error");
            } catch (error) {
                expect(error.message).to.include("DEADLINE_EXCEEDED");
            }
        });

        it("should override client-level grpcDeadline in channel when request level deadline is less than client level deadline", async function () {
            const slowResponse = {
                call: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 500)); // 500 ms
                    return TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE;
                },
            };

            ({ client, servers } = await Mocker.withResponses([
                [slowResponse],
            ]));
            client.setGrpcDeadline(1); // 1 ms client deadline

            // Create a query with shorter deadline
            const query = new TransactionReceiptQuery()
                .setTransactionId("0.0.3@4.5")
                .setMaxAttempts(1)
                .setGrpcDeadline(1000); // 1 second request deadline

            await query.execute(client);
        });
    });

    describe("requestTimeout functionality", function () {
        it("should timeout entire operation when requestTimeout is exceeded", async function () {
            const slowResponse = {
                call: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds
                    return TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE;
                },
            };

            ({ client, servers } = await Mocker.withResponses([
                [slowResponse],
            ]));
            client.setRequestTimeout(1000); // 1 second total timeout
            client.setGrpcDeadline(500); // 500ms per request

            try {
                await new TransactionReceiptQuery()
                    .setTransactionId("0.0.3@4.5")
                    .setMaxAttempts(3) // 3 attempts total 1500 ms overall timeout
                    .execute(client);
                expect.fail("Expected timeout error");
            } catch (error) {
                console.log(error);
                expect(error).to.be.instanceOf(MaxAttemptsOrTimeoutError);
                expect(error.message).to.include("timeout exceeded");
            }
        });

        it("should succeed when operation completes within requestTimeout", async function () {
            const fastResponse = {
                call: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms
                    return TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE;
                },
            };

            ({ client, servers } = await Mocker.withResponses([
                [fastResponse],
            ]));
            client.setRequestTimeout(750); // 750ms total timeout
            client.setGrpcDeadline(650); // 650ms per request

            const receipt = await new TransactionReceiptQuery()
                .setTransactionId("0.0.3@4.5")
                .setValidateStatus(false)
                .execute(client);

            expect(receipt.status.toString()).to.be.equal(
                Status.Success.toString(),
            );
        });
    });
});
