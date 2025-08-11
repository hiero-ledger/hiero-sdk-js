import { vi } from "vitest";
import NodeMirrorChannel from "../../../src/channel/NodeMirrorChannel.js";
import GrpcStatus from "../../../src/grpc/GrpcStatus.js";

describe("NodeMirrorChannel", function () {
    let channel;

    beforeEach(function () {
        channel = new NodeMirrorChannel("localhost:50211");
    });

    it("should create a NodeMirrorChannel instance", function () {
        expect(channel).to.be.instanceof(NodeMirrorChannel);
        expect(channel._client).to.not.be.null;
    });

    /**
     *
     * This shows that:
     * - Only status.code == 0 triggers the end() callback
     * - All other status codes are ignored (no callback is triggered)
     * - The error() callback is only triggered by 'error' events, not 'status' events
     */
    it("should NOT trigger error callback for non-zero status codes", async function () {
        let errorCallbackTriggered = false;
        let endCallbackTriggered = false;

        // Mock the gRPC client to capture the event handlers
        const originalMakeServerStreamRequest =
            channel._client.makeServerStreamRequest;
        let statusHandler = null;
        let errorHandler = null;

        const mockStream = {
            on: vi.fn((eventType, handler) => {
                if (eventType === "status") {
                    statusHandler = handler;
                } else if (eventType === "error") {
                    errorHandler = handler;
                }
                return mockStream;
            }),
            cancel: vi.fn(),
        };

        channel._client.makeServerStreamRequest = vi.fn(() => mockStream);

        try {
            // Set up the server stream request with test callbacks
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([1, 2, 3]),
                () => {}, // data callback
                () => {
                    errorCallbackTriggered = true;
                }, // error callback
                () => {
                    endCallbackTriggered = true;
                }, // end callback
            );

            // Give the setup time to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Verify that the status and error handlers were registered
            expect(statusHandler).to.not.be.null;
            expect(errorHandler).to.not.be.null;

            // Test various non-zero status codes
            // These should NOT trigger the error callback
            statusHandler({ code: 1, details: GrpcStatus._fromValue(1) });
            statusHandler({ code: 2, details: GrpcStatus._fromValue(2) });
            statusHandler({ code: 3, details: GrpcStatus._fromValue(3) });
            statusHandler({ code: 4, details: GrpcStatus._fromValue(4) });
            statusHandler({ code: 5, details: GrpcStatus._fromValue(5) });
            statusHandler({ code: 13, details: GrpcStatus._fromValue(13) });
            statusHandler({ code: 14, details: GrpcStatus._fromValue(14) });

            // Allow time for any potential callbacks
            await new Promise((resolve) => setTimeout(resolve, 10));

            // KEY ASSERTION: Non-zero status codes should NOT trigger error callback
            expect(errorCallbackTriggered).to.be.false;

            // Also verify end callback was not triggered for non-zero codes
            expect(endCallbackTriggered).to.be.false;

            // Now test that status code 0 DOES trigger end callback
            statusHandler({ code: 0, details: "OK" });

            await new Promise((resolve) => setTimeout(resolve, 10));

            // Status code 0 should trigger end callback
            expect(endCallbackTriggered).to.be.true;

            // Error callback should still not be triggered
            expect(errorCallbackTriggered).to.be.false;
        } finally {
            // Restore the original function
            channel._client.makeServerStreamRequest =
                originalMakeServerStreamRequest;
        }
    });

    it("should trigger error callback for actual error events (not status events)", async function () {
        let errorCallbackTriggered = false;
        let capturedError = null;

        // Mock the gRPC client
        const originalMakeServerStreamRequest =
            channel._client.makeServerStreamRequest;
        let errorHandler = null;

        const mockStream = {
            on: vi.fn((eventType, handler) => {
                if (eventType === "error") {
                    errorHandler = handler;
                }
                return mockStream;
            }),
            cancel: vi.fn(),
        };

        channel._client.makeServerStreamRequest = vi.fn(() => mockStream);

        try {
            // Set up the server stream request
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([1, 2, 3]),
                () => {}, // data callback
                (error) => {
                    // error callback
                    errorCallbackTriggered = true;
                    capturedError = error;
                },
                () => {}, // end callback
            );

            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(errorHandler).to.not.be.null;

            // Trigger an actual error event
            const testError = new Error("Test gRPC connection error");
            testError.code = 14; // UNAVAILABLE
            errorHandler(testError);

            await new Promise((resolve) => setTimeout(resolve, 10));

            // Error events SHOULD trigger the error callback
            expect(errorCallbackTriggered).to.be.true;
            expect(capturedError).to.be.equal(testError);
            expect(capturedError.message).to.include(
                "Test gRPC connection error",
            );
        } finally {
            // Restore the original function
            channel._client.makeServerStreamRequest =
                originalMakeServerStreamRequest;
        }
    });

    afterEach(function () {
        if (channel) {
            channel.close();
        }
    });
});
