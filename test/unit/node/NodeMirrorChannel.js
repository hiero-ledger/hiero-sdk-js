// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import { EventEmitter } from "events";

const { mockClose, mockMakeServerStreamRequest, MockClient } = vi.hoisted(
    () => {
        const mockClose = vi.fn();
        const mockMakeServerStreamRequest = vi.fn();

        const MockClient = vi.fn(function () {
            this.close = mockClose;
            this.makeServerStreamRequest = mockMakeServerStreamRequest;
        });

        return {
            mockClose,
            mockMakeServerStreamRequest,
            MockClient,
        };
    },
);

vi.mock("@grpc/grpc-js", () => {
    return {
        Client: MockClient,
        credentials: {
            createSsl: vi.fn(() => "ssl-credentials"),
            createInsecure: vi.fn(() => "insecure-credentials"),
        },
    };
});

let NodeMirrorChannel;
let grpc;

describe("NodeMirrorChannel", function () {
    let mockStream;

    beforeAll(async function () {
        vi.resetModules();
        grpc = await import("@grpc/grpc-js");
        NodeMirrorChannel = (
            await import("../../../src/channel/NodeMirrorChannel.js")
        ).default;
    });

    beforeEach(function () {
        vi.clearAllMocks();
        mockStream = new EventEmitter();
        mockStream.cancel = vi.fn();
        mockMakeServerStreamRequest.mockReturnValue(mockStream);
    });

    // Constructor — credential selection
    describe("constructor", function () {
        it("should use SSL credentials for address ending in :50212", function () {
            new NodeMirrorChannel("mainnet-public.mirrornode.hedera.com:50212");

            expect(grpc.credentials.createSsl).toHaveBeenCalled();
            expect(grpc.credentials.createInsecure).not.toHaveBeenCalled();
            expect(MockClient).toHaveBeenCalledWith(
                "mainnet-public.mirrornode.hedera.com:50212",
                "ssl-credentials",
                expect.objectContaining({
                    "grpc.keepalive_time_ms": 90000,
                    "grpc.keepalive_timeout_ms": 5000,
                }),
            );
        });

        it("should use SSL credentials for address ending in :443", function () {
            new NodeMirrorChannel("mainnet-public.mirrornode.hedera.com:443");

            expect(grpc.credentials.createSsl).toHaveBeenCalled();
            expect(grpc.credentials.createInsecure).not.toHaveBeenCalled();
            expect(MockClient).toHaveBeenCalledWith(
                "mainnet-public.mirrornode.hedera.com:443",
                "ssl-credentials",
                expect.any(Object),
            );
        });

        it("should use insecure credentials for other ports", function () {
            new NodeMirrorChannel("localhost:50211");

            expect(grpc.credentials.createInsecure).toHaveBeenCalled();
            expect(grpc.credentials.createSsl).not.toHaveBeenCalled();
            expect(MockClient).toHaveBeenCalledWith(
                "localhost:50211",
                "insecure-credentials",
                expect.any(Object),
            );
        });

        it("should pass keepalive options to the gRPC client", function () {
            new NodeMirrorChannel("localhost:50211");

            const options = MockClient.mock.calls[0][2];
            expect(options["grpc.keepalive_time_ms"]).to.equal(90000);
            expect(options["grpc.keepalive_timeout_ms"]).to.equal(5000);
        });
    });

    // close
    describe("close", function () {
        it("should delegate to _client.close()", function () {
            const channel = new NodeMirrorChannel("localhost:50211");
            channel.close();

            expect(mockClose).toHaveBeenCalledTimes(1);
        });
    });

    // makeServerStreamRequest
    describe("makeServerStreamRequest", function () {
        let channel;

        beforeEach(function () {
            channel = new NodeMirrorChannel("localhost:50211");
        });

        it("should build the correct gRPC path", function () {
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([1, 2, 3]),
                vi.fn(),
                vi.fn(),
                vi.fn(),
            );

            expect(mockMakeServerStreamRequest).toHaveBeenCalledWith(
                "/com.hedera.mirror.api.proto.ConsensusService/subscribeTopic",
                expect.any(Function),
                expect.any(Function),
                expect.any(Buffer),
            );
        });

        it("should pass request data as Buffer", function () {
            const requestData = new Uint8Array([10, 20, 30]);
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                requestData,
                vi.fn(),
                vi.fn(),
                vi.fn(),
            );

            const passedBuffer = mockMakeServerStreamRequest.mock.calls[0][3];
            expect(Buffer.isBuffer(passedBuffer)).to.be.true;
            expect([...passedBuffer]).to.deep.equal([10, 20, 30]);
        });

        it("should call the data callback when stream emits 'data'", function () {
            const dataCallback = vi.fn();
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                dataCallback,
                vi.fn(),
                vi.fn(),
            );

            const payload = new Uint8Array([1, 2, 3, 4]);
            mockStream.emit("data", payload);

            expect(dataCallback).toHaveBeenCalledWith(payload);
        });

        it("should call end() when stream emits status with code 0", function () {
            const endCallback = vi.fn();
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                vi.fn(),
                vi.fn(),
                endCallback,
            );

            mockStream.emit("status", { code: 0 });

            expect(endCallback).toHaveBeenCalledTimes(1);
        });

        it("should NOT call end() for non-zero status codes", function () {
            const endCallback = vi.fn();
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                vi.fn(),
                vi.fn(),
                endCallback,
            );

            mockStream.emit("status", { code: 1 });
            mockStream.emit("status", { code: 2 });
            mockStream.emit("status", { code: 13 });
            mockStream.emit("status", { code: 14 });

            expect(endCallback).not.toHaveBeenCalled();
        });

        it("should call the error handler when stream emits 'error'", function () {
            const errorCallback = vi.fn();
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                vi.fn(),
                errorCallback,
                vi.fn(),
            );

            const streamError = new Error("stream failed");
            streamError.code = 14;
            mockStream.emit("error", streamError);

            expect(errorCallback).toHaveBeenCalledWith(streamError);
        });

        it("should return a cancel function that calls stream.cancel()", function () {
            const cancel = channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                vi.fn(),
                vi.fn(),
                vi.fn(),
            );

            expect(typeof cancel).to.equal("function");
            cancel();
            expect(mockStream.cancel).toHaveBeenCalledTimes(1);
        });

        it("should handle multiple data events", function () {
            const dataCallback = vi.fn();
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                dataCallback,
                vi.fn(),
                vi.fn(),
            );

            mockStream.emit("data", new Uint8Array([1]));
            mockStream.emit("data", new Uint8Array([2]));
            mockStream.emit("data", new Uint8Array([3]));

            expect(dataCallback).toHaveBeenCalledTimes(3);
        });

        it("should not trigger error callback for status events", function () {
            const errorCallback = vi.fn();
            channel.makeServerStreamRequest(
                "ConsensusService",
                "subscribeTopic",
                new Uint8Array([]),
                vi.fn(),
                errorCallback,
                vi.fn(),
            );

            // Non-zero status should not go through error handler
            mockStream.emit("status", { code: 14, details: "UNAVAILABLE" });

            expect(errorCallback).not.toHaveBeenCalled();
        });
    });
});
