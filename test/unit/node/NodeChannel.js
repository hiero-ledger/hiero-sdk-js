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

    // ────────────────────────────────────────────
    // 1. parseAddress
    // ────────────────────────────────────────────
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

    // ────────────────────────────────────────────
    // 2. bytesToPem
    // ────────────────────────────────────────────
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

    // ────────────────────────────────────────────
    // 3. _initializeClient
    // ────────────────────────────────────────────
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

    // ────────────────────────────────────────────
    // 4. close
    // ────────────────────────────────────────────
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

    // ────────────────────────────────────────────
    // 5. _createUnaryClient
    // ────────────────────────────────────────────
    describe("_createUnaryClient", function () {
        let channel;

        beforeEach(async function () {
            channel = new NodeChannel("10.0.0.1:50211");
            // Pre-populate so _initializeClient resolves from cache
            await channel._initializeClient();
        });

        it("should call callback with GrpcServicesError on waitForReady timeout", async function () {
            mockWaitForReady.mockImplementation((_deadline, cb) => {
                cb(new Error("Deadline exceeded"));
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

    // ────────────────────────────────────────────
    // 6. _retrieveCertificate
    // ────────────────────────────────────────────
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

    // ────────────────────────────────────────────
    // 7. Constructor integration
    // ────────────────────────────────────────────
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
    // 8. Network capability: Full RPC lifecycle
    // ────────────────────────────────────────────
    describe("full RPC lifecycle", function () {
        it("should complete init → ready → request → response in sequence", async function () {
            const callOrder = [];

            const channel = new NodeChannel("10.0.0.1:50211");

            // Track initialization
            const origInit = channel._initializeClient.bind(channel);
            vi.spyOn(channel, "_initializeClient").mockImplementation(
                async () => {
                    callOrder.push("init");
                    await origInit();
                },
            );

            mockWaitForReady.mockImplementation((_deadline, cb) => {
                callOrder.push("waitForReady");
                cb(null);
            });

            const responsePayload = Buffer.from([0x08, 0x01]);
            mockMakeUnaryRequest.mockImplementation(
                (_path, _s, _d, _data, _meta, cb) => {
                    callOrder.push("makeUnaryRequest");
                    cb(null, responsePayload);
                },
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const { err, response } = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([0x0a, 0x02]),
                    (e, r) => resolve({ err: e, response: r }),
                );
            });

            expect(err).to.be.null;
            expect(response).to.deep.equal(responsePayload);
            expect(callOrder).to.deep.equal([
                "init",
                "waitForReady",
                "makeUnaryRequest",
            ]);
        });

        it("should route multiple services through the same gRPC client", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            mockWaitForReady.mockImplementation((_deadline, cb) => cb(null));
            mockMakeUnaryRequest.mockImplementation(
                (_path, _s, _d, _data, _meta, cb) =>
                    cb(null, Buffer.alloc(0)),
            );

            // Issue RPCs for different services through the same channel
            const services = [
                "CryptoService",
                "FileService",
                "ConsensusService",
                "TokenService",
                "SmartContractService",
            ];

            for (const svc of services) {
                const rpcImpl = channel._createUnaryClient(svc);
                await new Promise((resolve) => {
                    rpcImpl(
                        { name: "someMethod" },
                        new Uint8Array([]),
                        (e) => resolve(e),
                    );
                });
            }

            // All calls should use the same Client instance (only 1 created)
            expect(Client.mock.calls.length).to.equal(1);

            // Each service should have routed to the correct path
            const paths = mockMakeUnaryRequest.mock.calls.map(
                (call) => call[0],
            );
            expect(paths).to.deep.equal([
                "/proto.CryptoService/someMethod",
                "/proto.FileService/someMethod",
                "/proto.ConsensusService/someMethod",
                "/proto.TokenService/someMethod",
                "/proto.SmartContractService/someMethod",
            ]);
        });
    });

    // ────────────────────────────────────────────
    // 9. Network capability: Connection resilience
    // ────────────────────────────────────────────
    describe("connection resilience", function () {
        it("should re-establish connection after close and re-init", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();
            const firstClient = channel._client;

            // Simulate node going down — close the channel
            channel.close();
            expect(mockClose).toHaveBeenCalled();

            // Re-initialize creates a fresh client since cache was cleared
            await channel._initializeClient();
            expect(channel._client).to.not.be.null;
            expect(channel._client).to.not.equal(firstClient);
            expect(Client.mock.calls.length).to.equal(2);
        });

        it("should provide timeout error with node identity for health tracking", async function () {
            const channel = new NodeChannel("34.239.82.6:50211");
            await channel._initializeClient();

            mockWaitForReady.mockImplementation((_deadline, cb) => {
                cb(new Error("Deadline exceeded"));
            });

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([]),
                    (e) => resolve(e),
                );
            });

            // The error should carry the node account ID from ALL_NETWORK_IPS
            // so the SDK can mark this node as unhealthy
            expect(err).to.be.instanceOf(GrpcServicesError);
            expect(err.status).to.equal(GrpcStatus.Timeout);
            // nodeAccountId comes from ALL_NETWORK_IPS["34.239.82.6:"]
            expect(err.nodeAccountId).to.equal("0.0.3");
        });

        it("should handle rapid close-and-reuse without leaking connections", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");

            // Simulate rapid connect/disconnect cycles
            for (let i = 0; i < 5; i++) {
                await channel._initializeClient();
                channel.close();
            }

            // Each cycle should have called close() and created a new Client
            expect(mockClose.mock.calls.length).to.equal(5);
            // 5 new clients created (cache cleared each time)
            expect(Client.mock.calls.length).to.equal(5);
        });
    });

    // ────────────────────────────────────────────
    // 10. Network capability: TLS negotiation flow
    // ────────────────────────────────────────────
    describe("TLS negotiation flow", function () {
        it("should complete full TLS handshake → cert extraction → SSL client creation", async function () {
            const channel = new NodeChannel("10.0.0.1:50212");
            const certRaw = Buffer.alloc(128, 0xde);

            const mockSocket = {
                getPeerCertificate: vi.fn(() => ({ raw: certRaw })),
                end: vi.fn(),
                on: vi.fn().mockReturnThis(),
            };

            tls.connect.mockImplementation((_opts, callback) => {
                process.nextTick(() => callback());
                return mockSocket;
            });

            await channel._initializeClient();

            // Verify full flow: TLS connect → cert → PEM → SSL credentials → Client
            expect(tls.connect).toHaveBeenCalledWith(
                expect.objectContaining({
                    host: "10.0.0.1",
                    port: 50212,
                    rejectUnauthorized: false,
                }),
                expect.any(Function),
            );
            expect(mockSocket.getPeerCertificate).toHaveBeenCalled();
            expect(mockSocket.end).toHaveBeenCalled();
            expect(credentials.createSsl).toHaveBeenCalledWith(
                expect.any(Buffer),
            );

            // The SSL cert buffer passed should be a valid PEM
            const sslArg = credentials.createSsl.mock.calls[0][0];
            const pemStr = sslArg.toString();
            expect(pemStr).to.include("-----BEGIN CERTIFICATE-----");
            expect(pemStr).to.include("-----END CERTIFICATE-----");
        });

        it("should propagate TLS failure through RPC callback as Error", async function () {
            const channel = new NodeChannel("10.0.0.1:50212");

            const mockSocket = {
                on: vi.fn(function (event, handler) {
                    if (event === "error") {
                        process.nextTick(
                            () =>
                                handler(
                                    new Error("ECONNREFUSED 10.0.0.1:50212"),
                                ),
                        );
                    }
                    return this;
                }),
                end: vi.fn(),
            };

            tls.connect.mockImplementation(() => mockSocket);

            // The TLS failure should propagate through the RPC lifecycle
            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.include("ECONNREFUSED");
        });
    });

    // ────────────────────────────────────────────
    // 11. Network capability: Deadline semantics
    // ────────────────────────────────────────────
    describe("deadline semantics", function () {
        it("should use DEFAULT_GRPC_DEADLINE when no custom deadline set", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            let capturedDeadline;
            mockWaitForReady.mockImplementation((deadline, cb) => {
                capturedDeadline = deadline;
                cb(null);
            });
            mockMakeUnaryRequest.mockImplementation(
                (_p, _s, _d, _data, _m, cb) => cb(null, Buffer.alloc(0)),
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const now = Date.now();
            await new Promise((resolve) => {
                rpcImpl({ name: "ping" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            // DEFAULT_GRPC_DEADLINE = 10000ms
            const deadlineMs = capturedDeadline.getTime() - now;
            expect(deadlineMs).to.be.greaterThan(9900);
            expect(deadlineMs).to.be.lessThanOrEqual(10100);
        });

        it("should respect custom grpcDeadline propagated from Client", async function () {
            // Simulates NodeClient._createNetworkChannel() passing grpcDeadline
            const customDeadline = 3000;
            const channel = new NodeChannel("10.0.0.1:50211", customDeadline);
            await channel._initializeClient();

            let capturedDeadline;
            mockWaitForReady.mockImplementation((deadline, cb) => {
                capturedDeadline = deadline;
                cb(null);
            });
            mockMakeUnaryRequest.mockImplementation(
                (_p, _s, _d, _data, _m, cb) => cb(null, Buffer.alloc(0)),
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const now = Date.now();
            await new Promise((resolve) => {
                rpcImpl({ name: "ping" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            const deadlineMs = capturedDeadline.getTime() - now;
            expect(deadlineMs).to.be.greaterThan(2900);
            expect(deadlineMs).to.be.lessThanOrEqual(3100);
        });

        it("should allow runtime deadline change via setGrpcDeadline", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            // Change deadline at runtime (as Client.setGrpcDeadline would)
            channel.setGrpcDeadline(500);

            let capturedDeadline;
            mockWaitForReady.mockImplementation((deadline, cb) => {
                capturedDeadline = deadline;
                cb(null);
            });
            mockMakeUnaryRequest.mockImplementation(
                (_p, _s, _d, _data, _m, cb) => cb(null, Buffer.alloc(0)),
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const now = Date.now();
            await new Promise((resolve) => {
                rpcImpl({ name: "ping" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            const deadlineMs = capturedDeadline.getTime() - now;
            expect(deadlineMs).to.be.greaterThan(400);
            expect(deadlineMs).to.be.lessThanOrEqual(600);
        });
    });

    // ────────────────────────────────────────────
    // 12. Network capability: Cache coherence
    // ────────────────────────────────────────────
    describe("cache coherence", function () {
        it("should allow independent channels to share and invalidate cache", async function () {
            const ch1 = new NodeChannel("10.0.0.1:50211");
            const ch2 = new NodeChannel("10.0.0.1:50211");

            await ch1._initializeClient();
            await ch2._initializeClient();

            // Both point to same cached client
            expect(ch1._client).to.equal(ch2._client);

            // ch1 closes — removes from cache
            ch1.close();

            // ch2 still holds reference but cache is gone
            // A new channel must create a fresh client
            const ch3 = new NodeChannel("10.0.0.1:50211");
            await ch3._initializeClient();
            expect(ch3._client).to.not.equal(ch2._client);
            expect(Client.mock.calls.length).to.equal(2);
        });

        it("should maintain separate cache entries for different addresses", async function () {
            clearClientCache("10.0.0.2:50211");

            const ch1 = new NodeChannel("10.0.0.1:50211");
            const ch2 = new NodeChannel("10.0.0.2:50211");

            await ch1._initializeClient();
            await ch2._initializeClient();

            expect(ch1._client).to.not.equal(ch2._client);
            expect(Client.mock.calls.length).to.equal(2);

            // Closing one doesn't affect the other
            ch1.close();
            const ch3 = new NodeChannel("10.0.0.2:50211");
            await ch3._initializeClient();
            // ch3 gets cache hit from ch2's address
            expect(Client.mock.calls.length).to.equal(2);

            clearClientCache("10.0.0.2:50211");
        });

        it("should handle concurrent initialization for same address", async function () {
            const ch1 = new NodeChannel("10.0.0.1:50211");
            const ch2 = new NodeChannel("10.0.0.1:50211");

            // Both init concurrently
            await Promise.all([
                ch1._initializeClient(),
                ch2._initializeClient(),
            ]);

            // Both should have a client assigned
            expect(ch1._client).to.not.be.null;
            expect(ch2._client).to.not.be.null;
        });
    });

    // ────────────────────────────────────────────
    // 13. Network capability: gRPC channel options
    // ────────────────────────────────────────────
    describe("gRPC channel options", function () {
        it("should configure keepalive and retry options for connection stability", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            const options = Client.mock.calls[0][2];
            expect(options["grpc.keepalive_time_ms"]).to.equal(100000);
            expect(options["grpc.keepalive_timeout_ms"]).to.equal(10000);
            expect(options["grpc.keepalive_permit_without_calls"]).to.equal(1);
            expect(options["grpc.enable_retries"]).to.equal(1);
        });

        it("should override TLS target name for local development support", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            const options = Client.mock.calls[0][2];
            expect(options["grpc.ssl_target_name_override"]).to.equal(
                "127.0.0.1",
            );
            expect(options["grpc.default_authority"]).to.equal("127.0.0.1");
        });
    });

    // ────────────────────────────────────────────
    // 14. Network capability: Error model mapping
    // ────────────────────────────────────────────
    describe("error model mapping", function () {
        it("should map ready-timeout to SDK GrpcServiceError with Timeout status", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            mockWaitForReady.mockImplementation((_d, cb) =>
                cb(new Error("Deadline exceeded")),
            );

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "test" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            // This is the error that Executable uses to decide node health
            expect(err).to.be.instanceOf(GrpcServicesError);
            expect(err.status).to.equal(GrpcStatus.Timeout);
            expect(err.status.valueOf()).to.equal(17);
            expect(err.name).to.equal("GrpcServiceError");
        });

        it("should pass raw gRPC errors through for GrpcServiceError._fromResponse mapping", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            await channel._initializeClient();

            mockWaitForReady.mockImplementation((_d, cb) => cb(null));

            // Simulate what @grpc/grpc-js returns on server errors
            const rawGrpcError = new Error("13 INTERNAL: RST_STREAM");
            rawGrpcError.code = GrpcStatus.Internal.valueOf();
            rawGrpcError.details = "Received RST_STREAM with code 0";

            mockMakeUnaryRequest.mockImplementation(
                (_p, _s, _d, _data, _m, cb) => {
                    cb(rawGrpcError, null);
                },
            );

            const rpcImpl = channel._createUnaryClient("NetworkService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "getVersionInfo" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            // Raw error passes through — Executable._mapGrpcStatus handles conversion
            expect(err).to.equal(rawGrpcError);
            expect(err.code).to.equal(GrpcStatus.Internal.valueOf());
            expect(err.details).to.equal("Received RST_STREAM with code 0");

            // Verify it's compatible with GrpcServiceError._fromResponse
            const mapped = GrpcServicesError._fromResponse(err);
            expect(mapped).to.be.instanceOf(GrpcServicesError);
            expect(mapped.status).to.equal(GrpcStatus.Internal);
        });

        it("should wrap non-Error rejections to prevent unhandled exception crashes", async function () {
            const channel = new NodeChannel("10.0.0.1:50211");
            vi.spyOn(channel, "_initializeClient").mockRejectedValue(42);

            const rpcImpl = channel._createUnaryClient("CryptoService");
            const err = await new Promise((resolve) => {
                rpcImpl({ name: "test" }, new Uint8Array([]), (e) =>
                    resolve(e),
                );
            });

            // Non-Error values get wrapped so they don't crash callback consumers
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("An unexpected error occurred");
        });
    });
});
