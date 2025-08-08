import { vi } from "vitest";
import NodeMirrorChannel from "../../../src/channel/NodeMirrorChannel.js";

describe("NodeMirrorChannel", function () {
    let channel;

    beforeEach(function () {
        channel = new NodeMirrorChannel("localhost:50211");
    });

    afterEach(function () {
        if (channel) {
            channel.close();
        }
    });

    it("should create a NodeMirrorChannel instance", function () {
        expect(channel).to.be.instanceof(NodeMirrorChannel);
        expect(channel._client).to.not.be.null;
    });

    it("should use SSL credentials for secure ports (50212, 443)", function () {
        const sslChannel1 = new NodeMirrorChannel("test.hedera.com:50212");
        const sslChannel2 = new NodeMirrorChannel("test.hedera.com:443");

        expect(sslChannel1._client).to.not.be.null;
        expect(sslChannel2._client).to.not.be.null;

        sslChannel1.close();
        sslChannel2.close();
    });

    it("should use insecure credentials for other ports", function () {
        const insecureChannel = new NodeMirrorChannel("test.hedera.com:50211");
        expect(insecureChannel._client).to.not.be.null;
        insecureChannel.close();
    });

    it("makeServerStreamRequest should return a cancel function", function () {
        const cancelFn = channel.makeServerStreamRequest(
            "ConsensusService",
            "subscribeTopic",
            new Uint8Array([1, 2, 3]),
            () => {}, // data callback
            () => {}, // error callback
            () => {}, // end callback
        );

        expect(typeof cancelFn).to.be.equal("function");
    });

    it("should close the underlying gRPC client", function () {
        const spy = vi.spyOn(channel._client, "close");

        channel.close();

        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
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
            statusHandler({ code: 1, details: "CANCELLED" });
            statusHandler({ code: 2, details: "UNKNOWN" });
            statusHandler({ code: 3, details: "INVALID_ARGUMENT" });
            statusHandler({ code: 4, details: "DEADLINE_EXCEEDED" });
            statusHandler({ code: 5, details: "NOT_FOUND" });
            statusHandler({ code: 13, details: "INTERNAL" });
            statusHandler({ code: 14, details: "UNAVAILABLE" });

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

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(errorHandler).to.not.be.null;

            // Trigger an actual error event
            const testError = new Error("Test gRPC connection error");
            testError.code = 14; // UNAVAILABLE
            errorHandler(testError);

            await new Promise(resolve => setTimeout(resolve, 10));

            // Error events SHOULD trigger the error callback
            expect(errorCallbackTriggered).to.be.true;
            expect(capturedError).to.be.equal(testError);
            expect(capturedError.message).to.include(
                "Test gRPC connection error",
            );

        } finally {
            // Restore the original function
            channel._client.makeServerStreamRequest = originalMakeServerStreamRequest;
        }
    });

    it("should construct correct gRPC service path", function () {
        const spy = vi
            .spyOn(channel._client, "makeServerStreamRequest")
            .mockReturnValue({
                on: vi.fn().mockReturnThis(),
                cancel: vi.fn(),
            });

        channel.makeServerStreamRequest(
            "ConsensusService",
            "subscribeTopic",
            new Uint8Array([1, 2, 3]),
            () => {},
            () => {},
            () => {},
        );

        expect(spy).toHaveBeenCalledWith(
            "/com.hedera.mirror.api.proto.ConsensusService/subscribeTopic",
            expect.any(Function),
            expect.any(Function),
            expect.any(Buffer),
        );

        spy.mockRestore();
    });
});
