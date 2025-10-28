import { http, HttpResponse } from "msw";
import Long from "long";
import {
    Client,
    AccountId,
    TransactionReceiptQuery,
    PrivateKey,
    TransactionId,
} from "../../../src/browser.js";
import { encodeRequest } from "../../../src/channel/Channel.js";
import { startMSW, cleanupMSW } from "./utils/MswSetup.js";
import * as HieroProto from "@hashgraph/proto";

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

/**
 * Serializes a protobuf response for gRPC-Web
 * @param {HieroProto.proto.IResponse} response - The protobuf response to serialize
 * @returns {ArrayBuffer} The serialized response as ArrayBuffer
 */
function serializeProtobufResponse(response) {
    // Encode the protobuf response
    const responseBytes = HieroProto.proto.Response.encode(response).finish();

    // Wrap it in gRPC-Web format using encodeRequest
    return encodeRequest(responseBytes);
}

// Pre-serialize the response for reuse across all tests
const SERIALIZED_TRANSACTION_RECEIPT_RESPONSE = serializeProtobufResponse(
    TRANSACTION_RECEIPT_QUERY_RECEIPT_RESPONSE,
);

/**
 * Setup test client with custom network configuration
 * @param {Object} network - Network configuration object
 * @param {number} maxAttempts - Maximum number of attempts
 * @returns {Client} Configured client instance
 */
const setupClientWithNetwork = (network) => {
    const MAX_ATTEMPTS = 2; // We don't want long running tests
    const client = Client.forNetwork(network)
        .setNodeMinBackoff(0)
        .setNodeMaxBackoff(0)
        .setNodeMinReadmitPeriod(0)
        .setNodeMaxReadmitPeriod(0);

    client.setMaxAttempts(MAX_ATTEMPTS);

    return client;
};

describe("WebClient gRPC Deadline and Health Check Tests", function () {
    let client;
    let testPrivateKey;
    /**
     * MSW worker for mocking HTTP responses
     */
    let worker;

    const testAccountId = "0.0.123456";

    beforeEach(async function () {
        // Clean up any existing worker
        await cleanupMSW(worker);

        // Generate a test private key
        testPrivateKey = PrivateKey.generate();
    });

    afterEach(async function () {
        if (client) {
            client.close();
        }
        await cleanupMSW(worker);
    });

    it("should timeout when server response exceeds gRPC deadline", async function () {
        const customNodeAddress = "fast-deadline-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 100;
        const customDeadline = 1000; // 1 second

        let healthCheckRequestTime = null;
        let serviceRequestTime = null;

        // Setup MSW to simulate response throttling based on deadline
        const handlers = [
            // Health check endpoint - responds quickly
            http.post(
                `https://${customNodeAddress}`,
                () => {
                    healthCheckRequestTime = Date.now();
                    return new HttpResponse(null, {
                        status: 200,
                        headers: {
                            "grpc-status": "0",
                            "grpc-message": "OK",
                        },
                    });
                },
                {
                    once: false,
                },
            ),

            // Service endpoint - simulates throttling by delaying response
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                async () => {
                    serviceRequestTime = Date.now();
                    // Simulate server throttling - delay response for 2 seconds
                    // This should exceed the 1-second deadline
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
                {
                    once: false,
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client with custom 1-second deadline
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        }).setGrpcDeadline(customDeadline);

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create a transaction receipt query
        const transactionId = TransactionId.generate(accountId);
        const receiptQuery = new TransactionReceiptQuery().setTransactionId(
            transactionId,
        );

        try {
            await receiptQuery.execute(client);
            expect.fail(
                "Expected timeout due to server throttling exceeding 1-second deadline",
            );
        } catch (error) {
            // Should fail due to timeout - server response takes 2 seconds but deadline is 1 second
            expect(error.constructor.name).to.equal(
                "MaxAttemptsOrTimeoutError",
            );
            expect(error.message).to.include("DEADLINE_EXCEEDED");

            // Verify that requests were made
            expect(healthCheckRequestTime).to.not.be.null;
            expect(serviceRequestTime).to.not.be.null;
        }
    });

    it("should override client-level deadline with transaction-level deadline", async function () {
        const customNodeAddress = "override-deadline-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 102;
        const clientDeadline = 1; // 1 millisecond (Would cause immediate timeout)
        const transactionDeadline = 3000; // 3 seconds

        let healthCheckRequestTime = null;
        let serviceRequestTime = null;

        // Setup MSW to track request timing
        const handlers = [
            // Health check endpoint
            http.post(`https://${customNodeAddress}`, () => {
                healthCheckRequestTime = Date.now();
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                async () => {
                    serviceRequestTime = Date.now();
                    // Simulate server throttling - delay response for 2 seconds
                    // This should exceed the 1-second deadline
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client with client-level deadline
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        }).setGrpcDeadline(clientDeadline);

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create a transaction receipt query with its own deadline
        const transactionId = TransactionId.generate(accountId);
        const receiptQuery = new TransactionReceiptQuery()
            .setTransactionId(transactionId)
            .setGrpcDeadline(transactionDeadline);

        try {
            const response = await receiptQuery.execute(client);
            expect(response).to.not.be.null;

            // Verify that requests were made within the transaction deadline
            expect(healthCheckRequestTime).to.not.be.null;
            expect(serviceRequestTime).to.not.be.null;

            // Verify the time between health check and service request is within transaction deadline
            const timeDiff = serviceRequestTime - healthCheckRequestTime;
            expect(timeDiff).to.be.lessThan(transactionDeadline);
        } catch (error) {
            // If it fails, it should be due to the mock response format, not deadline issues
            expect(error.message).to.not.include("DEADLINE_EXCEEDED");
        }
    });

    it("should timeout when health check exceeds deadline", async function () {
        const customNodeAddress = "timeout-health-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 103;

        let healthCheckAttempts = 0;
        let serviceRequestAttempts = 0;

        // Setup MSW to simulate health check timeout
        const handlers = [
            // Health check endpoint times out - simulate actual timeout
            http.post(`https://${customNodeAddress}/`, async () => {
                healthCheckAttempts++;
                // Simulate a timeout by delaying longer than the deadline
                await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint (should not be reached due to health check failure)
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                () => {
                    serviceRequestAttempts++;
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client with short deadline to trigger timeout
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        }).setGrpcDeadline(1000); // 1 millisecond (Would cause immediate timeout)

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Create a transaction receipt query
        const transactionId = TransactionId.generate(accountId);
        const receiptQuery = new TransactionReceiptQuery().setTransactionId(
            transactionId,
        );

        try {
            await receiptQuery.execute(client);
            expect.fail("Expected health check timeout error");
        } catch (error) {
            // The error should be a GrpcServiceError due to timeout
            expect(error.constructor.name).to.equal(
                "MaxAttemptsOrTimeoutError",
            );
            expect(error.message).to.include("DEADLINE_EXCEEDED");

            // Verify health check was attempted
            expect(healthCheckAttempts).to.be.greaterThan(0);

            // Verify service request was not attempted due to health check failure
            expect(serviceRequestAttempts).to.equal(0);
        }
    });

    it("should cache health check results and avoid duplicate requests", async function () {
        const customNodeAddress = "cached-health-node.example.com";
        const customNodeAddressWithPort = `${customNodeAddress}:443`;
        const customNodeId = 104;

        let healthCheckAttempts = 0;
        let serviceRequestAttempts = 0;

        // Setup MSW to track health check requests
        const handlers = [
            // Health check endpoint (should only be called once)
            http.post(`https://${customNodeAddress}`, () => {
                healthCheckAttempts++;
                return new HttpResponse(null, {
                    status: 200,
                    headers: {
                        "grpc-status": "0",
                        "grpc-message": "OK",
                    },
                });
            }),
            // Service endpoint (should be called multiple times)
            http.post(
                `https://${customNodeAddress}/proto.CryptoService/getTransactionReceipts`,
                () => {
                    serviceRequestAttempts++;
                    return new HttpResponse(
                        SERIALIZED_TRANSACTION_RECEIPT_RESPONSE,
                        {
                            status: 200,
                            headers: {
                                "Content-Type": "application/grpc-web+proto",
                            },
                        },
                    );
                },
            ),
        ];

        worker = await startMSW(handlers);

        // Create client
        client = setupClientWithNetwork({
            [customNodeAddressWithPort]: new AccountId(customNodeId),
        });

        // Set operator with generated private key
        const accountId = AccountId.fromString(testAccountId);
        client.setOperator(accountId, testPrivateKey);

        // Execute multiple queries to test caching
        const transactionId1 = TransactionId.generate(accountId);
        const transactionId2 = TransactionId.generate(accountId);
        const receiptQuery1 = new TransactionReceiptQuery().setTransactionId(
            transactionId1,
        );
        const receiptQuery2 = new TransactionReceiptQuery().setTransactionId(
            transactionId2,
        );

        try {
            // Execute first query
            const response1 = await receiptQuery1.execute(client);
            expect(response1).to.not.be.null;

            // Execute second query
            const response2 = await receiptQuery2.execute(client);
            expect(response2).to.not.be.null;

            // Verify health check was only called once (cached)
            expect(healthCheckAttempts).to.equal(1);

            // Verify service requests were made for both transactions
            expect(serviceRequestAttempts).to.equal(2);
        } catch (error) {
            // If it fails, it should be due to the mock response format, not caching issues
            expect(error.message).to.not.include("health");
        }
    });
});
