// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WebChannel from "../../../src/channel/WebChannel.js";
import GrpcServiceError from "../../../src/grpc/GrpcServiceError.js";
import GrpcStatus from "../../../src/grpc/GrpcStatus.js";

/**
 * Builds a mock fetch Response object.
 * @param {object} opts
 * @param {number} [opts.status]
 * @param {string|null} [opts.grpcStatus]
 * @param {string|null} [opts.grpcMessage]
 * @param {ArrayBuffer} [opts.buffer]
 * @returns {Response-like}
 */
const mockResponse = ({
    status = 200,
    grpcStatus = null,
    grpcMessage = null,
    buffer = new ArrayBuffer(0),
} = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
        get: (key) => {
            if (key === "grpc-status") return grpcStatus;
            if (key === "grpc-message") return grpcMessage;
            return null;
        },
    },
    arrayBuffer: vi.fn().mockResolvedValue(buffer),
});

describe("WebChannel", function () {
    /** @type {import("vitest").Mock} */
    let mockFetch;

    beforeEach(function () {
        mockFetch = vi.fn();
        vi.stubGlobal("fetch", mockFetch);
    });

    afterEach(function () {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    // _shouldUseHttps
    describe("_shouldUseHttps", function () {
        it("should return false for localhost", function () {
            const channel = new WebChannel("localhost:8080");
            expect(channel._shouldUseHttps("localhost:8080")).to.be.false;
        });

        it("should return false for 127.0.0.1", function () {
            const channel = new WebChannel("127.0.0.1:50211");
            expect(channel._shouldUseHttps("127.0.0.1:50211")).to.be.false;
        });

        it("should return false for .cluster.local addresses", function () {
            const channel = new WebChannel("node.ns.svc.cluster.local:443");
            expect(channel._shouldUseHttps("node.ns.svc.cluster.local:443")).to
                .be.false;
        });

        it("should return true for public addresses", function () {
            const channel = new WebChannel("node00.swirldslabs.com:443");
            expect(channel._shouldUseHttps("node00.swirldslabs.com:443")).to.be
                .true;
        });
    });

    // _buildUrl
    describe("_buildUrl", function () {
        it("should prepend https:// for public addresses", function () {
            const channel = new WebChannel("node00.swirldslabs.com:443");
            expect(channel._buildUrl("node00.swirldslabs.com:443")).to.equal(
                "https://node00.swirldslabs.com:443",
            );
        });

        it("should prepend http:// for localhost", function () {
            const channel = new WebChannel("localhost:8080");
            expect(channel._buildUrl("localhost:8080")).to.equal(
                "http://localhost:8080",
            );
        });

        it("should prepend http:// for 127.0.0.1", function () {
            const channel = new WebChannel("127.0.0.1:50211");
            expect(channel._buildUrl("127.0.0.1:50211")).to.equal(
                "http://127.0.0.1:50211",
            );
        });

        it("should preserve existing http:// scheme", function () {
            const channel = new WebChannel("http://custom.example.com:443");
            expect(channel._buildUrl("http://custom.example.com:443")).to.equal(
                "http://custom.example.com:443",
            );
        });

        it("should preserve existing https:// scheme", function () {
            const channel = new WebChannel("https://custom.example.com:443");
            expect(
                channel._buildUrl("https://custom.example.com:443"),
            ).to.equal("https://custom.example.com:443");
        });
    });

    // close
    describe("close", function () {
        it("should be a no-op and not throw", function () {
            const channel = new WebChannel("localhost:8080");
            expect(() => channel.close()).to.not.throw();
        });
    });

    // _performHealthCheck
    describe("_performHealthCheck", function () {
        it("should throw Timeout when deadline has expired", async function () {
            const channel = new WebChannel("localhost:8080");
            const pastDeadline = new Date(Date.now() - 1000);

            try {
                await channel._performHealthCheck(pastDeadline);
                expect.fail("should have thrown");
            } catch (error) {
                expect(error).to.be.instanceOf(GrpcServiceError);
                expect(error.status).to.equal(GrpcStatus.Timeout);
            }
        });

        it("should set _isReady on 200 with gRPC headers", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockResolvedValue(
                mockResponse({ grpcStatus: "0", grpcMessage: "" }),
            );

            await channel._performHealthCheck(deadline);
            expect(channel._isReady).to.be.true;
        });

        it("should set _isReady on 3xx with gRPC headers", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockResolvedValue(
                mockResponse({
                    status: 301,
                    grpcStatus: "0",
                    grpcMessage: null,
                }),
            );

            await channel._performHealthCheck(deadline);
            expect(channel._isReady).to.be.true;
        });

        it("should throw Unavailable on 200 without gRPC headers", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockResolvedValue(mockResponse());

            try {
                await channel._performHealthCheck(deadline);
                expect.fail("should have thrown");
            } catch (error) {
                expect(error).to.be.instanceOf(GrpcServiceError);
                expect(error.status).to.equal(GrpcStatus.Unavailable);
            }
        });

        it("should throw Unavailable on non-OK status without gRPC headers", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockResolvedValue(mockResponse({ status: 500 }));

            try {
                await channel._performHealthCheck(deadline);
                expect.fail("should have thrown");
            } catch (error) {
                expect(error).to.be.instanceOf(GrpcServiceError);
                expect(error.status).to.equal(GrpcStatus.Unavailable);
            }
        });

        it("should throw Timeout on AbortError", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            mockFetch.mockRejectedValue(abortError);

            try {
                await channel._performHealthCheck(deadline);
                expect.fail("should have thrown");
            } catch (error) {
                expect(error).to.be.instanceOf(GrpcServiceError);
                expect(error.status).to.equal(GrpcStatus.Timeout);
            }
        });

        it("should rethrow GrpcServiceError as-is", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            const grpcError = new GrpcServiceError(GrpcStatus.Unavailable);
            mockFetch.mockRejectedValue(grpcError);

            try {
                await channel._performHealthCheck(deadline);
                expect.fail("should have thrown");
            } catch (error) {
                expect(error).to.equal(grpcError);
            }
        });

        it("should throw Unavailable on generic network error", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

            try {
                await channel._performHealthCheck(deadline);
                expect.fail("should have thrown");
            } catch (error) {
                expect(error).to.be.instanceOf(GrpcServiceError);
                expect(error.status).to.equal(GrpcStatus.Unavailable);
            }
        });
    });

    // _waitForReady
    describe("_waitForReady", function () {
        it("should return immediately if already ready", async function () {
            const channel = new WebChannel("localhost:8080");
            channel._isReady = true;
            const deadline = new Date(Date.now() + 10000);

            await channel._waitForReady(deadline);
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should deduplicate concurrent health checks", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockResolvedValue(
                mockResponse({ grpcStatus: "0", grpcMessage: "" }),
            );

            const p1 = channel._waitForReady(deadline);
            const p2 = channel._waitForReady(deadline);
            await Promise.all([p1, p2]);

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it("should clear _healthCheckPromise after completion", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockResolvedValue(
                mockResponse({ grpcStatus: "0", grpcMessage: "" }),
            );

            await channel._waitForReady(deadline);
            expect(channel._healthCheckPromise).to.be.null;
        });

        it("should clear _healthCheckPromise after failure", async function () {
            const channel = new WebChannel("localhost:8080");
            const deadline = new Date(Date.now() + 10000);

            mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

            try {
                await channel._waitForReady(deadline);
            } catch {
                // expected
            }
            expect(channel._healthCheckPromise).to.be.null;
        });
    });
});
