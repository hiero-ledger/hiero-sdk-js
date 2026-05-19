// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";

// Mock @grpc/grpc-js before importing NodeChannel
const {
    mockClose,
    mockWaitForReady,
    mockMakeUnaryRequest,
    mockMetadataSet,
    MockClient,
} = vi.hoisted(() => {
    const mockClose = vi.fn();
    const mockWaitForReady = vi.fn();
    const mockMakeUnaryRequest = vi.fn();
    const mockMetadataSet = vi.fn();

    const MockClient = vi.fn(function () {
        this.close = mockClose;
        this.waitForReady = mockWaitForReady;
        this.makeUnaryRequest = mockMakeUnaryRequest;
    });

    return {
        mockClose,
        mockWaitForReady,
        mockMakeUnaryRequest,
        mockMetadataSet,
        MockClient,
    };
});

vi.mock("@grpc/grpc-js", () => {
    return {
        Client: MockClient,
        credentials: {
            createSsl: vi.fn(() => "ssl-credentials"),
            createInsecure: vi.fn(() => "insecure-credentials"),
        },
        Metadata: vi.fn().mockImplementation(function () {
            this.set = mockMetadataSet;
        }),
    };
});

// Mock tls module
vi.mock("tls", () => ({
    default: {
        connect: vi.fn(),
    },
}));

import NodeChannel from "../../../src/channel/NodeChannel.js";
import GrpcServicesError from "../../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../../src/grpc/GrpcStatus.js";
import { Client, credentials } from "@grpc/grpc-js";
import tls from "tls";

/**
 * Clears the module-level clientCache inside NodeChannel by
 * creating a temporary channel and calling close() with a fake client.
 */
function clearClientCache(address) {
    const ch = new NodeChannel(address);
    // Force a fake client so close() will delete the cache entry
    ch._client = { close: vi.fn() };
    ch.close();
}

describe("NodeChannel", function () {
    beforeEach(function () {
        vi.clearAllMocks();
        // Clear cached clients that use valid addresses from previous tests
        clearClientCache("10.0.0.1:50211");
        clearClientCache("10.0.0.1:50212");
        clearClientCache("10.0.0.2:50211");
        clearClientCache("192.168.1.1:50211");
        clearClientCache("34.239.82.6:50211");
        clearClientCache("myhost.example.com:443");
    });

    // parseAddress
    describe("parseAddress", function () {
        it("should parse a valid host:port address", function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            expect(channel.nodeIp).to.equal("10.0.0.1");
            expect(channel.nodePort).to.equal("50211");
        });

        it("should parse address with hostname", function () {
            const channel = new NodeChannel("myhost.example.com:443");
            expect(channel.nodeIp).to.equal("myhost.example.com");
            expect(channel.nodePort).to.equal("443");
        });

        it("should throw on missing port", function () {
            expect(() => new NodeChannel("10.0.0.1")).to.throw(
                "Invalid address format. Expected format: 'IP:Port'",
            );
        });

        it("should throw on missing host", function () {
            expect(() => new NodeChannel(":50211")).to.throw(
                "Invalid address format. Expected format: 'IP:Port'",
            );
        });

        it("should throw on empty string", function () {
            expect(() => new NodeChannel("")).to.throw(
                "Invalid address format. Expected format: 'IP:Port'",
            );
        });
    });

    // bytesToPem
    describe("bytesToPem", function () {
        it("should convert certificate bytes to PEM format with proper headers", function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            // 48 bytes → 64 base64 chars → exactly one 64-char line
            const certBytes = Buffer.alloc(48, 0xab);
            const pem = channel.bytesToPem(certBytes);

            expect(pem).to.match(/^-----BEGIN CERTIFICATE-----\n/);
            expect(pem).to.match(/\n-----END CERTIFICATE-----$/);

            // Lines between headers should be at most 64 chars
            const body = pem
                .replace("-----BEGIN CERTIFICATE-----\n", "")
                .replace("\n-----END CERTIFICATE-----", "");
            for (const line of body.split("\n")) {
                expect(line.length).to.be.at.most(64);
            }
        });

        it("should produce valid base64 content that round-trips", function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            const original = Buffer.from(
                "test certificate data for round trip",
            );
            const pem = channel.bytesToPem(original);

            const base64Body = pem
                .replace("-----BEGIN CERTIFICATE-----\n", "")
                .replace("\n-----END CERTIFICATE-----", "")
                .replace(/\n/g, "");
            const decoded = Buffer.from(base64Body, "base64");
            expect(decoded).to.deep.equal(original);
        });

        it("should wrap long certificates into 64-char lines", function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            // 256 bytes → 344 base64 chars → multiple lines
            const certBytes = Buffer.alloc(256, 0xff);
            const pem = channel.bytesToPem(certBytes);

            const body = pem
                .replace("-----BEGIN CERTIFICATE-----\n", "")
                .replace("\n-----END CERTIFICATE-----", "");
            const lines = body.split("\n");
            expect(lines.length).to.be.greaterThan(1);
            // All lines except the last should be exactly 64 chars
            for (let i = 0; i < lines.length - 1; i++) {
                expect(lines[i].length).to.equal(64);
            }
        });
    });

    // _initializeClient
    describe("_initializeClient", function () {
        it("should use insecure credentials for non-50212 port", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            expect(Client).toHaveBeenCalledWith(
                "10.0.0.1:50211",
                "insecure-credentials",
                expect.any(Object),
            );
            expect(credentials.createInsecure).toHaveBeenCalled();
            expect(channel._client).to.not.be.null;
        });

        it("should use SSL credentials for port 50212", async function () {
            const channel = new NodeChannel("10.0.0.1:50212");

            // Stub _retrieveCertificate to avoid real TLS connection
            const fakePem =
                "-----BEGIN CERTIFICATE-----\nfake\n-----END CERTIFICATE-----";
            vi.spyOn(channel, "_retrieveCertificate").mockResolvedValue(
                fakePem,
            );

            await channel._initializeClient();

            expect(channel._retrieveCertificate).toHaveBeenCalled();
            expect(credentials.createSsl).toHaveBeenCalledWith(
                Buffer.from(fakePem),
            );
            expect(Client).toHaveBeenCalledWith(
                "10.0.0.1:50212",
                "ssl-credentials",
                expect.any(Object),
            );
        });

        it("should return cached client on second call (cache hit)", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            const firstClient = channel._client;
            const callCountAfterFirst = Client.mock.calls.length;

            // Second call should use cache
            await channel._initializeClient();

            expect(Client.mock.calls.length).to.equal(callCountAfterFirst);
            expect(channel._client).to.equal(firstClient);
        });

        it("should share cache across channel instances with same address", async function () {
            const channel1 = new NodeChannel("10.0.0.1:50211");
            await channel1._initializeClient();
            const callCountAfterFirst = Client.mock.calls.length;

            const channel2 = new NodeChannel("10.0.0.1:50211");
            await channel2._initializeClient();

            // Should not have created a new Client
            expect(Client.mock.calls.length).to.equal(callCountAfterFirst);
            expect(channel2._client).to.equal(channel1._client);
        });
    });

    // close
    describe("close", function () {
        it("should be a no-op when _client is null", function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            expect(channel._client).to.be.null;
            // Should not throw
            channel.close();
            expect(mockClose).not.toHaveBeenCalled();
        });

        it("should call _client.close() and clear cache when client exists", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();
            expect(channel._client).to.not.be.null;

            channel.close();

            expect(mockClose).toHaveBeenCalled();

            // Verify cache was cleared — a new init should create a new Client
            const callCountBefore = Client.mock.calls.length;
            const channel2 = new NodeChannel("10.0.0.1:50211");
            await channel2._initializeClient();
            expect(Client.mock.calls.length).to.equal(callCountBefore + 1);
        });
    });

    // _createUnaryClient
    describe("_createUnaryClient", function () {
        let channel;

        beforeEach(async function () {
            channel = new NodeChannel("10.0.0.1:50211");
            // Pre-populate so _initializeClient resolves from cache
            await channel._initializeClient();
        });

        it("should call callback with GrpcServicesError on waitForReady timeout", async function () {
            mockWaitForReady.mockImplementation((_deadline, callback) => {
                callback(new Error("Deadline exceeded"));
            });

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "getAccountInfo" },
                    new Uint8Array([1, 2, 3]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(GrpcServicesError);
            expect(err.name).to.equal("GrpcServiceError");
            expect(err.status).to.equal(GrpcStatus.Timeout);
            expect(err.message).to.include(GrpcStatus.Timeout.toString());
            expect(err.message).to.include(
                String(GrpcStatus.Timeout.valueOf()),
            );
        });

        it("should make unary request with correct path and metadata on success", async function () {
            mockWaitForReady.mockImplementation((_deadline, cb) => {
                cb(null); // ready
            });

            const fakeResponse = Buffer.from([10, 20, 30]);
            mockMakeUnaryRequest.mockImplementation(
                (_path, _serialize, _deserialize, _data, _metadata, cb) => {
                    cb(null, fakeResponse);
                },
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const { err, response } = await new Promise((resolve) => {
                rpcImpl(
                    { name: "getAccountInfo" },
                    new Uint8Array([1, 2, 3]),
                    (e, r) => resolve({ err: e, response: r }),
                );
            });

            expect(err).to.be.null;
            expect(response).to.deep.equal(fakeResponse);

            // Verify the gRPC path
            expect(mockMakeUnaryRequest).toHaveBeenCalledWith(
                "/proto.CryptoService/getAccountInfo",
                expect.any(Function),
                expect.any(Function),
                expect.any(Buffer),
                expect.any(Object),
                expect.any(Function),
            );

            // Verify user-agent metadata was set
            expect(mockMetadataSet).toHaveBeenCalledWith(
                "x-user-agent",
                expect.stringContaining("hiero-sdk-js"),
            );
        });

        it("should propagate gRPC errors from makeUnaryRequest", async function () {
            mockWaitForReady.mockImplementation((_deadline, cb) => {
                cb(null);
            });

            const grpcError = new Error(GrpcStatus.Unavailable.toString());
            grpcError.code = GrpcStatus.Unavailable.valueOf();
            grpcError.details = `node is ${GrpcStatus.Unavailable.toString()}`;
            mockMakeUnaryRequest.mockImplementation(
                (_path, _serialize, _deserialize, _data, _metadata, cb) => {
                    cb(grpcError, null);
                },
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "getAccountInfo" },
                    new Uint8Array([1, 2, 3]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.equal(grpcError);
        });

        it("should wrap non-Error rejection from _initializeClient", async function () {
            const channel2 = new NodeChannel("10.0.0.1:50211");

            // Stub _initializeClient to reject with a non-Error value
            vi.spyOn(channel2, "_initializeClient").mockRejectedValue(
                "string rejection",
            );

            const rpcImpl = channel2._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "getAccountInfo" },
                    new Uint8Array([1, 2, 3]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("An unexpected error occurred");
        });

        it("should pass through Error rejection from _initializeClient", async function () {
            const channel2 = new NodeChannel("10.0.0.1:50211");
            const initError = new GrpcServicesError(GrpcStatus.Unavailable);
            vi.spyOn(channel2, "_initializeClient").mockRejectedValue(
                initError,
            );

            const rpcImpl = channel2._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "getAccountInfo" },
                    new Uint8Array([1, 2, 3]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.equal(initError);
            expect(err).to.be.instanceOf(GrpcServicesError);
            expect(err.status).to.equal(GrpcStatus.Unavailable);
        });

        it("should enforce deadline from grpcDeadline", async function () {
            let capturedDeadline;

            mockWaitForReady.mockImplementation((deadline, cb) => {
                capturedDeadline = deadline;
                cb(null);
            });

            mockMakeUnaryRequest.mockImplementation(
                (_path, _s, _d, _data, _meta, cb) => cb(null, Buffer.alloc(0)),
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const now = Date.now();

            const err = await new Promise((resolve) => {
                rpcImpl({ name: "ping" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            expect(err).to.be.null;
            expect(capturedDeadline).to.be.instanceOf(Date);

            // The deadline should be within a reasonable window
            expect(capturedDeadline.getTime()).to.be.greaterThan(now);
            expect(capturedDeadline.getTime()).to.be.lessThanOrEqual(
                now + channel.grpcDeadline + 100,
            );
        });
    });

    // _retrieveCertificate
    describe("_retrieveCertificate", function () {
        it("should resolve with PEM when tls.connect succeeds", async function () {
            const channel = new NodeChannel("10.0.0.1:50212");
            const certRaw = Buffer.from("mock-cert-data");

            const mockSocket = {
                getPeerCertificate: vi.fn(() => ({ raw: certRaw })),
                end: vi.fn(),
                on: vi.fn().mockReturnThis(),
            };

            tls.connect.mockImplementation((_opts, callback) => {
                // Invoke the connect callback asynchronously
                process.nextTick(() => callback());
                return mockSocket;
            });

            const pem = await channel._retrieveCertificate();

            expect(pem).to.include("-----BEGIN CERTIFICATE-----");
            expect(pem).to.include("-----END CERTIFICATE-----");
            expect(mockSocket.end).toHaveBeenCalled();
            expect(tls.connect).toHaveBeenCalledWith(
                expect.objectContaining({
                    host: "10.0.0.1",
                    port: 50212,
                    rejectUnauthorized: false,
                }),
                expect.any(Function),
            );
        });

        it("should reject when certificate has no raw data", async function () {
            const channel = new NodeChannel("10.0.0.1:50212");

            const mockSocket = {
                getPeerCertificate: vi.fn(() => ({})),
                end: vi.fn(),
                on: vi.fn().mockReturnThis(),
            };

            tls.connect.mockImplementation((_opts, callback) => {
                process.nextTick(() => callback());
                return mockSocket;
            });

            await expect(channel._retrieveCertificate()).rejects.toThrow(
                "No certificate retrieved.",
            );
        });

        it("should reject when socket emits error", async function () {
            const channel = new NodeChannel("10.0.0.1:50212");
            const socketError = new Error("Connection refused");

            const mockSocket = {
                on: vi.fn(function (event, handler) {
                    if (event === "error") {
                        process.nextTick(() => handler(socketError));
                    }
                    return this;
                }),
                end: vi.fn(),
            };

            tls.connect.mockImplementation(() => {
                return mockSocket;
            });

            await expect(channel._retrieveCertificate()).rejects.toThrow(
                "Connection refused",
            );
        });
    });

    // Constructor integration
    describe("constructor", function () {
        it("should store address and parsed ip/port", function () {
            const channel = new NodeChannel("192.168.1.1:50211");
            expect(channel.address).to.equal("192.168.1.1:50211");
            expect(channel.nodeIp).to.equal("192.168.1.1");
            expect(channel.nodePort).to.equal("50211");
            expect(channel._client).to.be.null;
        });

        it("should accept a custom grpcDeadline", function () {
            const channel = new NodeChannel("10.0.0.1:50211", 5000);
            expect(channel.grpcDeadline).to.equal(5000);
        });
    });

    // ────────────────────────────────────────────
    // 8. Behaviors only testable in isolation
    //    (not covered by integration tests)
    // ────────────────────────────────────────────
    describe("node health and error contract", function () {
        it("should embed node account ID from ALL_NETWORK_IPS on timeout for SDK health tracking", async function () {
            // Integration tests rarely trigger timeouts, and you can't control
            // which node times out. This verifies the nodeAccountId lookup that
            // the SDK uses to mark nodes as unhealthy and rotate.
            const channel = new NodeChannel("34.239.82.6:50211");
            await channel._initializeClient();

            mockWaitForReady.mockImplementation((_deadline, cb) => {
                cb(new Error("Deadline exceeded"));
            });

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "cryptoGetBalance" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            expect(err).to.be.instanceOf(GrpcServicesError);
            expect(err.status).to.equal(GrpcStatus.Timeout);
            // ALL_NETWORK_IPS["34.239.82.6:"] maps to node 0.0.3
            expect(err.nodeAccountId).to.equal("0.0.3");
        });

        it("should produce errors compatible with GrpcServiceError._fromResponse", async function () {
            // Verifies the contract between NodeChannel and Executable:
            // raw gRPC errors must have { code, details } for _fromResponse to map them.
            // Integration tests only see the final mapped error, not the raw shape.
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            mockWaitForReady.mockImplementation((_d, cb) => cb(null));

            const rawGrpcError = new Error(
                `${GrpcStatus.Internal.valueOf()} ${GrpcStatus.Internal.toString()}: RST_STREAM`,
            );
            rawGrpcError.code = GrpcStatus.Internal.valueOf();
            rawGrpcError.details = "Received RST_STREAM with code 0";

            mockMakeUnaryRequest.mockImplementation(
                (_p, _s, _d, _data, _m, cb) => cb(rawGrpcError, null),
            );

            const rpcImpl = channel._createUnaryClient("NetworkService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "getVersionInfo" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            // Channel passes raw error through unchanged
            expect(err).to.equal(rawGrpcError);
            expect(err.code).to.equal(GrpcStatus.Internal.valueOf());
            expect(err.details).to.equal("Received RST_STREAM with code 0");

            // Executable calls _fromResponse on this shape — verify compatibility
            const mapped = GrpcServicesError._fromResponse(err);
            expect(mapped).to.be.instanceOf(GrpcServicesError);
            expect(mapped.status).to.equal(GrpcStatus.Internal);
        });

        it("should wrap non-Error rejections to prevent unhandled exception crashes", async function () {
            // This path only triggers if _initializeClient rejects with a
            // non-Error value (e.g. a thrown string/number). Integration tests
            // can never produce this because real gRPC always throws Error instances.
            const channel = new NodeChannel("10.0.0.1:50211");
            vi.spyOn(channel, "_initializeClient").mockRejectedValue(42);

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "test" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("An unexpected error occurred");
        });
    });

    describe("connection lifecycle (not exercised by integration)", function () {
        it("should re-establish connection after close by clearing cache", async function () {
            // Integration tests call close() once at teardown. This verifies
            // that the cache-clearing logic allows reconnection — critical for
            // the SDK's node-rotation strategy.
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            channel.close();
            expect(mockClose).toHaveBeenCalled();

            // Cache cleared: re-init creates a new gRPC Client
            await channel._initializeClient();
            expect(Client.mock.calls.length).to.equal(2);
        });

        it("should handle rapid close-and-reuse cycles without connection leaks", async function () {
            // Stress pattern: the SDK can close and re-init rapidly during
            // network updates or node rotation. Each cycle must cleanly tear
            // down the old client.
            const channel = new NodeChannel("10.0.0.1:50211");

            for (let i = 0; i < 5; i++) {
                await channel._initializeClient();
                channel.close();
            }

            expect(mockClose.mock.calls.length).to.equal(5);
            expect(Client.mock.calls.length).to.equal(5);
        });

        it("should allow one channel's close to invalidate cache for others", async function () {
            // The module-level cache is shared. When one channel closes and
            // clears the cache, a new channel for the same address must
            // create a fresh connection. This can't be tested in integration
            // because the SDK hides this behind Node/Client abstractions.
            const ch1 = new NodeChannel("10.0.0.1:50211");
            const ch2 = new NodeChannel("10.0.0.1:50211");

            await ch1._initializeClient();
            await ch2._initializeClient();
            expect(ch1._client).to.equal(ch2._client);

            ch1.close();

            const ch3 = new NodeChannel("10.0.0.1:50211");
            await ch3._initializeClient();
            expect(ch3._client).to.not.equal(ch2._client);
            expect(Client.mock.calls.length).to.equal(2);
        });
    });

    describe("TLS failure propagation", function () {
        it("should propagate TLS handshake failure through the RPC callback", async function () {
            // Integration tests always connect to live nodes with valid certs.
            // This tests what happens when a node's cert is unreachable —
            // the error must propagate cleanly to the RPC callback.
            const channel = new NodeChannel("10.0.0.1:50212");

            const mockSocket = {
                on: vi.fn(function (event, handler) {
                    if (event === "error") {
                        process.nextTick(() =>
                            handler(new Error("ECONNREFUSED 10.0.0.1:50212")),
                        );
                    }
                    return this;
                }),
                end: vi.fn(),
            };

            tls.connect.mockImplementation(() => mockSocket);

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "cryptoGetBalance" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.include("ECONNREFUSED");
        });
    });

    describe("gRPC channel configuration", function () {
        it("should pass keepalive and retry options for long-lived connection stability", async function () {
            // These options can't be asserted in integration tests — they affect
            // behavior over minutes (keepalive_time_ms=100s). Here we verify
            // the channel passes the correct config to @grpc/grpc-js.
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            const options = Client.mock.calls[0][2];
            expect(options["grpc.keepalive_time_ms"]).to.equal(100000);
            expect(options["grpc.keepalive_timeout_ms"]).to.equal(10000);
            expect(options["grpc.keepalive_permit_without_calls"]).to.equal(1);
            expect(options["grpc.enable_retries"]).to.equal(1);
        });
    });
});
