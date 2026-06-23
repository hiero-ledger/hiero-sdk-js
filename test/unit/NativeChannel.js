// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import GrpcServiceError from "../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../src/grpc/GrpcStatus.js";
import HttpError from "../../src/http/HttpError.js";
import NativeChannel from "../../src/channel/NativeChannel.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

/**
 * builds a mock fetch Response
 * @param {number} status
 * @param {Record<string, string|null>} grpcHeaders
 * @param {Blob} [blob]
 */
function mockResponse(status, grpcHeaders = {}, blob = new Blob()) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (key) => grpcHeaders[key] ?? null },
        blob: vi.fn().mockResolvedValue(blob),
    };
}

/**
 * creates a valid gRPC-web framed payload encoded as a data URL
 * The frame: 1 byte type (0x00) + 4 bytes length + payload
 * @param {Uint8Array} payload
 * @returns {string}
 */
function makeDataUrl(payload) {
    const frame = new Uint8Array(5 + payload.length);
    frame[0] = 0; // data frame

    new DataView(frame.buffer).setUint32(1, payload.length);
    frame.set(payload, 5);

    const base64 = btoa(String.fromCharCode(...frame));
    return `data:application/octet-stream;base64,${base64}`;
}

describe("NativeChannel", function () {
    beforeEach(function () {
        vi.clearAllMocks();
        vi.restoreAllMocks();
        vi.stubGlobal(
            "FileReader",
            class {
                readAsDataURL() {
                    queueMicrotask(() => this.onloadend?.());
                }
            },
        );
    });

    // Constructor
    describe("constructor", function () {
        it("should store the address", function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            expect(channel._address).to.equal("mainnet.example.com:443");
        });

        it("should initialize _isReady to false", function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            expect(channel._isReady).to.equal(false);
        });

        it("should accept an optional grpcDeadline", function () {
            const channel = new NativeChannel("mainnet.example.com:443", 5000);
            expect(channel._grpcDeadline).to.equal(5000);
        });
    });

    // close()
    describe("close", function () {
        it("should not throw and return undefined", function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            const result = channel.close();
            expect(result).to.be.undefined;
        });
    });

    // _waitForReady
    describe("_waitForReady", function () {
        it("should return immediately when _isReady is true (cached)", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            const deadline = new Date(Date.now() + 10000);
            await channel._waitForReady(deadline);

            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should use https for non-localhost addresses", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            mockFetch.mockResolvedValue(
                mockResponse(200, { "grpc-status": "0" }),
            );

            const deadline = new Date(Date.now() + 10000);
            await channel._waitForReady(deadline);

            expect(mockFetch).toHaveBeenCalledWith(
                "https://mainnet.example.com:443",
                expect.objectContaining({ method: "POST" }),
            );
        });

        it("should use http for localhost addresses", async function () {
            const channel = new NativeChannel("localhost:50211");
            mockFetch.mockResolvedValue(
                mockResponse(200, { "grpc-status": "0" }),
            );

            const deadline = new Date(Date.now() + 10000);
            await channel._waitForReady(deadline);

            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:50211",
                expect.objectContaining({ method: "POST" }),
            );
        });

        it("should use http for 127.0.0.1 addresses", async function () {
            const channel = new NativeChannel("127.0.0.1:50211");
            mockFetch.mockResolvedValue(
                mockResponse(200, { "grpc-status": "0" }),
            );

            const deadline = new Date(Date.now() + 10000);
            await channel._waitForReady(deadline);

            expect(mockFetch).toHaveBeenCalledWith(
                "http://127.0.0.1:50211",
                expect.objectContaining({ method: "POST" }),
            );
        });

        it("should throw GrpcServiceError(Timeout) when deadline is in the past", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            const deadline = new Date(Date.now() - 1000);

            await expect(channel._waitForReady(deadline)).rejects.toSatisfy(
                (err) => {
                    return (
                        err instanceof GrpcServiceError &&
                        err.status === GrpcStatus.Timeout
                    );
                },
            );

            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should set _isReady to true when response has grpc-status header", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            mockFetch.mockResolvedValue(
                mockResponse(200, { "grpc-status": "0" }),
            );

            const deadline = new Date(Date.now() + 10000);
            await channel._waitForReady(deadline);

            expect(channel._isReady).to.equal(true);
        });

        it("should set _isReady to true when response has grpc-message header", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            mockFetch.mockResolvedValue(
                mockResponse(200, { "grpc-message": "OK" }),
            );

            const deadline = new Date(Date.now() + 10000);
            await channel._waitForReady(deadline);

            expect(channel._isReady).to.equal(true);
        });

        it("should throw GrpcServiceError(Unavailable) when 200 but no gRPC headers", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            mockFetch.mockResolvedValue(mockResponse(200, {}));

            const deadline = new Date(Date.now() + 10000);

            await expect(channel._waitForReady(deadline)).rejects.toSatisfy(
                (err) => {
                    return (
                        err instanceof GrpcServiceError &&
                        err.status === GrpcStatus.Unavailable
                    );
                },
            );
        });

        it("should throw GrpcServiceError(Timeout) on AbortError", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            mockFetch.mockRejectedValue(abortError);

            const deadline = new Date(Date.now() + 10000);

            await expect(channel._waitForReady(deadline)).rejects.toSatisfy(
                (err) => {
                    return (
                        err instanceof GrpcServiceError &&
                        err.status === GrpcStatus.Timeout
                    );
                },
            );
        });

        it("should re-throw GrpcServiceError unchanged", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            const grpcError = new GrpcServiceError(GrpcStatus.Unavailable);
            mockFetch.mockRejectedValue(grpcError);

            const deadline = new Date(Date.now() + 10000);

            await expect(channel._waitForReady(deadline)).rejects.toEqual(
                grpcError,
            );
        });

        it("should throw GrpcServiceError(Unavailable) on generic network error", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

            const deadline = new Date(Date.now() + 10000);

            await expect(channel._waitForReady(deadline)).rejects.toSatisfy(
                (err) => {
                    return (
                        err instanceof GrpcServiceError &&
                        err.status === GrpcStatus.Unavailable
                    );
                },
            );
        });
    });

    // _createUnaryClient
    describe("_createUnaryClient", function () {
        it("should build the correct URL with service and method name", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            const dataUrl = makeDataUrl(new Uint8Array([10, 20, 30]));
            vi.stubGlobal(
                "FileReader",
                class {
                    readAsDataURL() {
                        this.result = dataUrl;
                        queueMicrotask(() => this.onloadend?.());
                    }
                },
            );

            mockFetch.mockResolvedValue(mockResponse(200, {}));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1, 2, 3]),
                    () => resolve(),
                );
            });

            expect(mockFetch).toHaveBeenCalledWith(
                "https://mainnet.example.com:443/proto.CryptoService/cryptoGetBalance",
                expect.objectContaining({ method: "POST" }),
            );
        });

        it("should use http for localhost in URL construction", async function () {
            const channel = new NativeChannel("localhost:50211");
            channel._isReady = true;

            const dataUrl = makeDataUrl(new Uint8Array([1]));
            vi.stubGlobal(
                "FileReader",
                class {
                    readAsDataURL() {
                        this.result = dataUrl;
                        queueMicrotask(() => this.onloadend?.());
                    }
                },
            );

            mockFetch.mockResolvedValue(mockResponse(200, {}));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            await new Promise((resolve) => {
                rpcImpl({ name: "cryptoGetBalance" }, new Uint8Array([1]), () =>
                    resolve(),
                );
            });

            expect(mockFetch).toHaveBeenCalledWith(
                "http://localhost:50211/proto.CryptoService/cryptoGetBalance",
                expect.any(Object),
            );
        });

        it("should callback with HttpError on non-OK response", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            const dataUrl = makeDataUrl(new Uint8Array([1]));
            vi.stubGlobal(
                "FileReader",
                class {
                    readAsDataURL() {
                        this.result = dataUrl;
                        queueMicrotask(() => this.onloadend?.());
                    }
                },
            );

            mockFetch.mockResolvedValue(mockResponse(503, {}));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(HttpError);
        });

        it("should decode response with application/octet-stream prefix", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            const payload = new Uint8Array([42, 43, 44]);
            const dataUrl = makeDataUrl(payload);
            vi.stubGlobal(
                "FileReader",
                class {
                    readAsDataURL() {
                        this.result = dataUrl;
                        queueMicrotask(() => this.onloadend?.());
                    }
                },
            );

            mockFetch.mockResolvedValue(mockResponse(200, {}));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const response = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1]),
                    (_e, r) => resolve(r),
                );
            });

            expect(response).to.be.instanceOf(Uint8Array);
            expect([...response]).to.deep.equal([42, 43, 44]);
        });

        it("should decode response with application/grpc-web+proto prefix", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            const payload = new Uint8Array([55, 66, 77]);
            const frame = new Uint8Array(5 + payload.length);
            frame[0] = 0;
            new DataView(frame.buffer).setUint32(1, payload.length);
            frame.set(payload, 5);
            const base64Str = btoa(String.fromCharCode(...frame));
            const dataUrl = `data:application/grpc-web+proto;base64,${base64Str}`;

            vi.stubGlobal(
                "FileReader",
                class {
                    readAsDataURL() {
                        this.result = dataUrl;
                        queueMicrotask(() => this.onloadend?.());
                    }
                },
            );

            mockFetch.mockResolvedValue(mockResponse(200, {}));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const response = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1]),
                    (_e, r) => resolve(r),
                );
            });

            expect(response).to.be.instanceOf(Uint8Array);
            expect([...response]).to.deep.equal([55, 66, 77]);
        });

        it("should throw Error when response has unknown prefix", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            vi.stubGlobal(
                "FileReader",
                class {
                    readAsDataURL() {
                        this.result = "data:text/plain;base64,AAAA";
                        queueMicrotask(() => this.onloadend?.());
                    }
                },
            );

            mockFetch.mockResolvedValue(mockResponse(200, {}));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.include(
                "Expected response data to be base64 encode",
            );
        });

        it("should propagate GrpcServiceError from _waitForReady via callback", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            // _isReady is false, so _waitForReady will be called

            // Make deadline expire immediately by using a very short deadline
            const originalDeadline = channel._grpcDeadline;
            channel._grpcDeadline = -1000; // force deadline in the past

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(GrpcServiceError);
            expect(err.status).to.equal(GrpcStatus.Timeout);

            channel._grpcDeadline = originalDeadline;
        });

        it("should propagate non-GrpcServiceError via callback", async function () {
            const channel = new NativeChannel("mainnet.example.com:443");
            channel._isReady = true;

            mockFetch.mockRejectedValue(new TypeError("Network failure"));

            const rpcImpl = channel._createUnaryClient("CryptoService");

            const err = await new Promise((resolve) => {
                rpcImpl(
                    { name: "cryptoGetBalance" },
                    new Uint8Array([1]),
                    (e) => resolve(e),
                );
            });

            expect(err).to.be.instanceOf(TypeError);
            expect(err.message).to.equal("Network failure");
        });
    });
});
