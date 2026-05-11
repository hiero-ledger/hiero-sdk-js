// SPDX-License-Identifier: Apache-2.0
import NativeChannel from "../../src/channel/NativeChannel.js";
import GrpcServiceError from "../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../src/grpc/GrpcStatus.js";
import HttpError from "../../src/http/HttpError.js";

// minimal valid gRPC-Web DATA frame (header 0x00 + length 1 + 1 payload byte)
const VALID_GRPC_FRAME = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x01, 0x00]);

vi.mock("../../src/encoding/base64.native.js", () => ({
    encode: vi.fn(() => "bW9jaw=="),
    decode: vi.fn(() => VALID_GRPC_FRAME),
}));

// ─── helpers ──────────────────────────────────────────────────────────────

const makeFetchResponse = (status, grpcHeaders = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (key) => grpcHeaders[key] ?? null },
    blob: vi.fn().mockResolvedValue(new Blob()),
    text: vi.fn().mockResolvedValue(""),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
});

const futureDeadline = (ms = 30_000) => new Date(Date.now() + ms);
const pastDeadline = () => new Date(Date.now() - 1);

const invokeRpc = (
    channel,
    serviceName = "CryptoService",
    method = { name: "getAccountInfo" },
    requestData = new Uint8Array([1, 2, 3]),
) =>
    new Promise((resolve) => {
        const rpcImpl = channel._createUnaryClient(serviceName);
        rpcImpl(method, requestData, (err, data) => resolve({ err, data }));
    });

// ─── FileReader factory: fires events ASYNCHRONOUSLY, supports all 3 APIs ──

const makeFileReader = (dataUrl) =>
    class FileReaderStub {
        constructor() {
            this._listeners = { load: [], loadend: [], error: [] };
            this.result = null;
        }
        addEventListener(event, fn) {
            (this._listeners[event] ||= []).push(fn);
        }
        removeEventListener(event, fn) {
            const arr = this._listeners[event];
            if (arr) this._listeners[event] = arr.filter((f) => f !== fn);
        }
        // eslint-disable-next-line no-unused-vars
        readAsDataURL(_blob) {
            queueMicrotask(() => {
                this.result = dataUrl;
                const ev = { target: this };
                this.onload?.(ev);
                this.onloadend?.(ev);
                this._listeners.load.forEach((f) => f(ev));
                this._listeners.loadend.forEach((f) => f(ev));
            });
        }
    };

const OctetStreamFileReader = makeFileReader(
    "data:application/octet-stream;base64,AAAAAAAAAA==",
);
const GrpcWebProtoFileReader = makeFileReader(
    "data:application/grpc-web+proto;base64,AAAAAAAAAA==",
);
const UnknownMimeFileReader = makeFileReader("data:text/plain;base64,aGVsbG8=");

// ─── suite ────────────────────────────────────────────────────────────────

describe("NativeChannel", () => {
    let mockFetch;

    beforeEach(() => {
        mockFetch = vi.fn();
        vi.stubGlobal("fetch", mockFetch);
        vi.stubGlobal("FileReader", OctetStreamFileReader);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    describe("constructor", () => {
        it("stores the provided address in _address", () => {
            expect(new NativeChannel("example.com:443")._address).toBe(
                "example.com:443",
            );
        });
        it("initialises _isReady to false", () => {
            expect(new NativeChannel("example.com:443")._isReady).toBe(false);
        });
        it("stores a custom grpcDeadline when supplied", () => {
            expect(
                new NativeChannel("example.com:443", 5_000)._grpcDeadline,
            ).toBe(5_000);
        });
    });

    describe("close()", () => {
        it("does not throw", () => {
            expect(() =>
                new NativeChannel("example.com:443").close(),
            ).not.toThrow();
        });
        it("returns undefined (explicit no-op)", () => {
            expect(
                new NativeChannel("example.com:443").close(),
            ).toBeUndefined();
        });
    });

    describe("_waitForReady()", () => {
        it("returns without calling fetch when _isReady is already true", async () => {
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            await channel._waitForReady(futureDeadline());
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("uses https:// for non-localhost addresses", async () => {
            mockFetch.mockResolvedValueOnce(
                makeFetchResponse(200, { "grpc-status": "0" }),
            );
            await new NativeChannel(
                "mainnet-node00.mirrornode.hedera.com:443",
            )._waitForReady(futureDeadline());
            expect(mockFetch.mock.calls[0][0]).toMatch(/^https:\/\//);
        });

        it("uses http:// when address contains 'localhost'", async () => {
            mockFetch.mockResolvedValueOnce(
                makeFetchResponse(200, { "grpc-status": "0" }),
            );
            await new NativeChannel("localhost:50211")._waitForReady(
                futureDeadline(),
            );
            expect(mockFetch.mock.calls[0][0]).toMatch(/^http:\/\//);
        });

        it("uses http:// when address contains '127.0.0.1'", async () => {
            mockFetch.mockResolvedValueOnce(
                makeFetchResponse(200, { "grpc-status": "0" }),
            );
            await new NativeChannel("127.0.0.1:50211")._waitForReady(
                futureDeadline(),
            );
            expect(mockFetch.mock.calls[0][0]).toMatch(/^http:\/\//);
        });

        it("throws GrpcServiceError(Timeout) and skips fetch when deadline is past", async () => {
            const channel = new NativeChannel("example.com:443");
            const error = await channel
                ._waitForReady(pastDeadline())
                .catch((e) => e);
            expect(error).toBeInstanceOf(GrpcServiceError);
            expect(error.status).toBe(GrpcStatus.Timeout);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("sets _isReady = true when response has grpc-status header", async () => {
            mockFetch.mockResolvedValueOnce(
                makeFetchResponse(200, { "grpc-status": "0" }),
            );
            const channel = new NativeChannel("example.com:443");
            await channel._waitForReady(futureDeadline());
            expect(channel._isReady).toBe(true);
        });

        it("sets _isReady = true when response has grpc-message header", async () => {
            mockFetch.mockResolvedValueOnce(
                makeFetchResponse(200, { "grpc-message": "OK" }),
            );
            const channel = new NativeChannel("example.com:443");
            await channel._waitForReady(futureDeadline());
            expect(channel._isReady).toBe(true);
        });

        it("throws GrpcServiceError(Unavailable) when 200 but no gRPC headers", async () => {
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            const channel = new NativeChannel("example.com:443");
            const error = await channel
                ._waitForReady(futureDeadline())
                .catch((e) => e);
            expect(error).toBeInstanceOf(GrpcServiceError);
            expect(error.status).toBe(GrpcStatus.Unavailable);
        });

        it("throws GrpcServiceError(Timeout) when fetch rejects with AbortError", async () => {
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            mockFetch.mockRejectedValueOnce(abortError);
            const channel = new NativeChannel("example.com:443");
            const error = await channel
                ._waitForReady(futureDeadline())
                .catch((e) => e);
            expect(error).toBeInstanceOf(GrpcServiceError);
            expect(error.status).toBe(GrpcStatus.Timeout);
        });

        it("re-throws a GrpcServiceError from fetch unchanged", async () => {
            const original = new GrpcServiceError(GrpcStatus.Unavailable);
            mockFetch.mockRejectedValueOnce(original);
            const channel = new NativeChannel("example.com:443");
            const error = await channel
                ._waitForReady(futureDeadline())
                .catch((e) => e);
            expect(error).toBe(original);
        });

        it("throws GrpcServiceError(Unavailable) on a generic network error", async () => {
            mockFetch.mockRejectedValueOnce(new Error("Network failure"));
            const channel = new NativeChannel("example.com:443");
            const error = await channel
                ._waitForReady(futureDeadline())
                .catch((e) => e);
            expect(error).toBeInstanceOf(GrpcServiceError);
            expect(error.status).toBe(GrpcStatus.Unavailable);
        });
    });

    describe("_createUnaryClient()", () => {
        it("routes GrpcServiceError from _waitForReady to callback(error, null)", async () => {
            const grpcError = new GrpcServiceError(GrpcStatus.Timeout);
            mockFetch.mockRejectedValueOnce(grpcError);
            const { err, data } = await invokeRpc(
                new NativeChannel("example.com:443"),
            );
            expect(err).toBe(grpcError);
            expect(data).toBeNull();
        });

        it("builds URL as https://<address>/proto.<service>/<method> for remote hosts", async () => {
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            await invokeRpc(channel, "CryptoService", {
                name: "getAccountInfo",
            });
            expect(mockFetch.mock.calls[0][0]).toBe(
                "https://example.com:443/proto.CryptoService/getAccountInfo",
            );
        });

        it("builds URL as http://<address>/proto.<service>/<method> for localhost", async () => {
            const channel = new NativeChannel("localhost:50211");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            await invokeRpc(channel, "CryptoService", {
                name: "getAccountInfo",
            });
            expect(mockFetch.mock.calls[0][0]).toBe(
                "http://localhost:50211/proto.CryptoService/getAccountInfo",
            );
        });

        it("calls callback(HttpError, null) on non-OK HTTP response", async () => {
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(503, {}));
            const { err, data } = await invokeRpc(channel);
            expect(err).toBeInstanceOf(HttpError);
            expect(data).toBeNull();
        });

        it("decodes response with data:application/octet-stream;base64, prefix", async () => {
            vi.stubGlobal("FileReader", OctetStreamFileReader);
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            const { err, data } = await invokeRpc(channel);
            expect(err).toBeNull();
            expect(data).toBeInstanceOf(Uint8Array);
        });

        it("decodes response with data:application/grpc-web+proto;base64, prefix", async () => {
            vi.stubGlobal("FileReader", GrpcWebProtoFileReader);
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            const { err, data } = await invokeRpc(channel);
            expect(err).toBeNull();
            expect(data).toBeInstanceOf(Uint8Array);
        });

        it("calls callback(Error, null) with descriptive message on unknown MIME prefix", async () => {
            vi.stubGlobal("FileReader", UnknownMimeFileReader);
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            const { err, data } = await invokeRpc(channel);
            expect(err).toBeInstanceOf(Error);
            expect(err.message).toContain("application/octet-stream;base64");
            expect(err.message).toContain("application/grpc-web+proto;base64");
            expect(data).toBeNull();
        });

        it("calls callback(null, Uint8Array) on a fully successful round-trip", async () => {
            vi.stubGlobal("FileReader", OctetStreamFileReader);
            const channel = new NativeChannel("example.com:443");
            channel._isReady = true;
            mockFetch.mockResolvedValueOnce(makeFetchResponse(200, {}));
            const { err, data } = await invokeRpc(channel);
            expect(err).toBeNull();
            expect(data).toBeInstanceOf(Uint8Array);
        });
    });
});
