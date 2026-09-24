// SPDX-License-Identifier: Apache-2.0

import HttpMethod from "../../../src/http/HttpMethod.js";
import HttpRequest from "../../../src/http/HttpRequest.js";
import HttpResponse from "../../../src/http/HttpResponse.js";
import HttpTransportConfiguration from "../../../src/http/HttpTransportConfiguration.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../../src/http/HttpTransportError.js";
import HttpTransport from "../../../src/http/HttpTransport.js";
import {
    cancellableSleep,
    noCancellation,
} from "../../../src/http/cancellation.js";

describe("http types", function () {
    describe("HttpMethod", function () {
        it("is a closed, frozen set", function () {
            expect(Object.isFrozen(HttpMethod)).to.be.true;
            expect(Object.values(HttpMethod)).to.deep.equal([
                "GET",
                "HEAD",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS",
                "TRACE",
                "CONNECT",
            ]);
        });
    });

    describe("HttpRequest", function () {
        it("lowercases header names and is immutable", function () {
            const request = new HttpRequest({
                method: HttpMethod.GET,
                url: "https://mirror.example/api/v1/accounts",
                headers: { Accept: "application/json", "X-Trace": "1" },
            });

            expect(request.headers).to.deep.equal({
                accept: "application/json",
                "x-trace": "1",
            });
            expect(request.body).to.be.null;
            expect(request.contentType).to.be.null;
            expect(request.deadline).to.be.null;
            expect(Object.isFrozen(request)).to.be.true;
            expect(Object.isFrozen(request.headers)).to.be.true;
        });

        it("rejects a method outside the enumeration", function () {
            for (const method of ["get", "Get", "PROPFIND", undefined]) {
                expect(
                    () =>
                        new HttpRequest({
                            method,
                            url: "https://mirror.example/x",
                        }),
                    String(method),
                ).to.throw(TypeError, "HttpRequest.method");
            }
        });

        it("accepts only an absolute http(s) URL", function () {
            for (const url of [
                "/api/v1/accounts",
                "ftp://mirror.example/x",
                "https://mirror.example/with space",
                "",
            ]) {
                expect(
                    () => new HttpRequest({ method: "GET", url }),
                    url,
                ).to.throw(TypeError, "HttpRequest.url");
            }
            expect(
                new HttpRequest({
                    method: "GET",
                    url: "http://127.0.0.1:5551/x",
                }).url,
            ).to.equal("http://127.0.0.1:5551/x");
        });

        it("validates body, contentType and deadline", function () {
            const base = { method: "POST", url: "https://mirror.example/x" };
            expect(() => new HttpRequest({ ...base, body: "text" })).to.throw(
                TypeError,
                "body",
            );
            expect(() => new HttpRequest({ ...base, contentType: 5 })).to.throw(
                TypeError,
                "contentType",
            );
            expect(() => new HttpRequest({ ...base, deadline: -1 })).to.throw(
                TypeError,
                "deadline",
            );
            expect(
                () => new HttpRequest({ ...base, deadline: Infinity }),
            ).to.throw(TypeError, "deadline");
            const ok = new HttpRequest({
                ...base,
                body: Uint8Array.of(1),
                contentType: "application/protobuf",
                deadline: 0,
            });
            expect(ok.deadline).to.equal(0);
        });

        it("derives a changed copy by spreading", function () {
            const request = new HttpRequest({
                method: "GET",
                url: "https://mirror.example/x",
                headers: { accept: "application/json" },
            });
            const bounded = new HttpRequest({ ...request, deadline: 1000 });

            expect(bounded.deadline).to.equal(1000);
            expect(bounded.headers).to.deep.equal(request.headers);
            expect(request.deadline).to.be.null;
        });
    });

    describe("HttpResponse", function () {
        it("lowercases header names and keeps repeated values", function () {
            const response = new HttpResponse({
                statusCode: 200,
                headers: [
                    ["Retry-After", "7"],
                    ["X-Multi", "a"],
                    ["x-multi", "b"],
                ],
            });

            expect(response.headers).to.deep.equal({
                "retry-after": ["7"],
                "x-multi": ["a", "b"],
            });
            expect(response.header("RETRY-AFTER")).to.equal("7");
            expect(response.header("missing")).to.be.null;
            expect(response.body).to.have.length(0);
            expect(response.ok).to.be.true;
            expect(Object.isFrozen(response.headers["x-multi"])).to.be.true;
        });

        it("accepts a plain object with string or list values", function () {
            const response = new HttpResponse({
                statusCode: 503,
                headers: { "Content-Type": "text/plain", Via: ["a", "b"] },
            });

            expect(response.headers).to.deep.equal({
                "content-type": ["text/plain"],
                via: ["a", "b"],
            });
            expect(response.ok).to.be.false;
        });

        it("rejects an invalid status code or body", function () {
            expect(() => new HttpResponse({ statusCode: "200" })).to.throw(
                TypeError,
                "statusCode",
            );
            expect(
                () => new HttpResponse({ statusCode: 200, body: "x" }),
            ).to.throw(TypeError, "body");
        });
    });

    describe("HttpTransportConfiguration", function () {
        it("defaults every field", function () {
            const configuration = new HttpTransportConfiguration();

            expect(configuration.connectTimeout).to.equal(0);
            expect(configuration.maxRedirects).to.equal(5);
            expect(configuration.maxResponseBytes).to.equal(32 * 1024 * 1024);
            expect(configuration.defaultHeaders).to.deep.equal({});
            expect(Object.isFrozen(configuration)).to.be.true;
        });

        it("keeps every unnamed field at its default when one is changed", function () {
            const configuration = new HttpTransportConfiguration({
                connectTimeout: 2000,
            });
            const derived = new HttpTransportConfiguration({
                ...configuration,
                maxRedirects: 0,
                defaultHeaders: { "X-Env": "test" },
            });

            expect(configuration.maxRedirects).to.equal(5);
            expect(configuration.maxResponseBytes).to.equal(32 * 1024 * 1024);
            expect(derived.connectTimeout).to.equal(2000);
            expect(derived.maxRedirects).to.equal(0);
            expect(derived.maxResponseBytes).to.equal(32 * 1024 * 1024);
            expect(derived.defaultHeaders).to.deep.equal({ "x-env": "test" });
        });

        it("rejects out-of-range values", function () {
            expect(
                () => new HttpTransportConfiguration({ connectTimeout: -1 }),
            ).to.throw(RangeError, "connectTimeout");
            expect(
                () => new HttpTransportConfiguration({ maxRedirects: 1.5 }),
            ).to.throw(RangeError, "maxRedirects");
            expect(
                () => new HttpTransportConfiguration({ maxResponseBytes: 0 }),
            ).to.throw(RangeError, "maxResponseBytes");
        });

        it("returns an instance as is from `from()`", function () {
            const configuration = new HttpTransportConfiguration();
            expect(HttpTransportConfiguration.from(configuration)).to.equal(
                configuration,
            );
            expect(HttpTransportConfiguration.from(null)).to.be.instanceOf(
                HttpTransportConfiguration,
            );
        });
    });

    describe("HttpTransportError", function () {
        it("classifies retryability by code", function () {
            const retryable = [
                HttpTransportErrorCode.CONNECTION_ERROR,
                HttpTransportErrorCode.TIMEOUT_ERROR,
            ];
            for (const code of Object.values(HttpTransportErrorCode)) {
                const error = new HttpTransportError(code, "boom");
                expect(error.code).to.equal(code);
                expect(error.message).to.equal(`${code}: boom`);
                expect(error.name).to.equal("HttpTransportError");
                expect(error.retryable, code).to.equal(
                    retryable.includes(code),
                );
                expect(HttpTransportError.isRetryable(error), code).to.equal(
                    retryable.includes(code),
                );
                expect(HttpTransportError.hasCode(error, code)).to.be.true;
            }
        });

        it("rejects an unknown code", function () {
            expect(() => new HttpTransportError("dns-error", "x")).to.throw(
                TypeError,
                "unknown HttpTransportErrorCode",
            );
        });

        it("does not treat a plain error as retryable", function () {
            expect(HttpTransportError.isRetryable(new Error("ECONNRESET"))).to
                .be.false;
            expect(HttpTransportError.isRetryable(null)).to.be.false;
        });

        it("carries the native failure as cause", function () {
            const cause = new Error("connect ECONNREFUSED");
            const error = new HttpTransportError(
                HttpTransportErrorCode.CONNECTION_ERROR,
                cause.message,
                { cause },
            );
            expect(error.cause).to.equal(cause);
        });
    });

    describe("HttpTransport", function () {
        it("rejects roundTrip and accepts close by default", async function () {
            const transport = new HttpTransport();
            await expect(
                transport.roundTrip(
                    new HttpRequest({
                        method: "GET",
                        url: "https://x.example/",
                    }),
                    noCancellation(),
                ),
            ).rejects.toThrow("not implemented");
            expect(transport.close(0)).to.be.undefined;
        });
    });

    describe("cancellation", function () {
        it("noCancellation() is one never-aborted signal", function () {
            const signal = noCancellation();
            expect(signal.aborted).to.be.false;
            expect(noCancellation()).to.equal(signal);
        });

        it("cancellableSleep resolves after the delay", async function () {
            const started = Date.now();
            await cancellableSleep(20, [noCancellation()]);
            expect(Date.now() - started).to.be.at.least(15);
        });

        it("cancellableSleep rejects with the abort reason and releases its listeners", async function () {
            const controller = new AbortController();
            const reason = new Error("stop");
            const sleep = cancellableSleep(10000, [controller.signal, null]);
            controller.abort(reason);

            await expect(sleep).rejects.toBe(reason);
        });

        it("cancellableSleep rejects immediately on an already aborted signal", async function () {
            const controller = new AbortController();
            controller.abort();

            await expect(
                cancellableSleep(10000, [controller.signal]),
            ).rejects.toHaveProperty("name", "AbortError");
        });
    });
});
