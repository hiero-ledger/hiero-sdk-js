// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import MirrorNodeHttpClient, {
    bodyJson,
    bodyText,
    errorDetail,
    parseRetryAfter,
    statusMessage,
} from "../../../src/mirror_node/MirrorNodeHttpClient.js";
import MirrorNodeHttpError, {
    MirrorNodeHttpErrorCode,
} from "../../../src/mirror_node/MirrorNodeHttpError.js";
import MirrorNodeHttpRetryPolicy from "../../../src/mirror_node/MirrorNodeHttpRetryPolicy.js";
import MirrorNodeRestPath from "../../../src/mirror_node/MirrorNodeRestPath.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../../src/http/HttpTransportError.js";
import HttpResponse from "../../../src/http/HttpResponse.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "../utils/FakeHttpTransport.js";

const BASE_URL = "https://mirror.example/api/v1";

/**
 * @param {FakeHttpTransport} transport
 * @param {object} [policy]
 * @param {object} [options]
 * @returns {MirrorNodeHttpClient}
 */
function client(transport, policy = {}, options = {}) {
    return MirrorNodeHttpClient.create(
        BASE_URL,
        transport,
        new MirrorNodeHttpRetryPolicy({
            initialBackoff: 1,
            maxBackoff: 1,
            ...policy,
        }),
        { random: () => 0, ...options },
    );
}

/**
 * @param {Promise<unknown>} promise
 * @returns {Promise<any>}
 */
function caught(promise) {
    return promise.then(
        () => {
            throw new Error("expected the promise to reject");
        },
        (error) => error,
    );
}

describe("MirrorNodeHttpClient", function () {
    afterEach(function () {
        vi.useRealTimers();
    });

    it("resolves the path against the base URL by concatenation", async function () {
        const transport = new FakeHttpTransport().respondJson(200, {
            ok: true,
        });

        const http = MirrorNodeHttpClient.create(
            `${BASE_URL}/`,
            transport,
            MirrorNodeHttpRetryPolicy.DEFAULT,
        );
        const response = await http.get("/network/nodes?limit=1");

        expect(http.baseUrl).to.equal(BASE_URL);
        expect(response.statusCode).to.equal(200);
        expect(transport.requests[0].url).to.equal(
            `${BASE_URL}/network/nodes?limit=1`,
        );
        expect(transport.requests[0].method).to.equal("GET");
        expect(transport.requests[0].body).to.be.null;
    });

    it("accepts a MirrorNodeRestPath and rejects an invalid path before any request", async function () {
        const transport = new FakeHttpTransport().respondJson(200, {});
        const http = client(transport);

        await http.get(MirrorNodeRestPath.of("/balances"));
        const error = await caught(http.get("https://evil.example/x"));

        expect(transport.requests).to.have.length(1);
        expect(error).to.be.instanceOf(MirrorNodeHttpError);
        expect(error.code).to.equal(MirrorNodeHttpErrorCode.INVALID_PATH_ERROR);
    });

    it("layers headers: accept default, then caller headers, then endpoint headers", async function () {
        const transport = new FakeHttpTransport().respondJson(200, {});

        await client(
            transport,
            {},
            {
                requestHeaders: {
                    Authorization: "Bearer t",
                    Accept: "text/plain",
                },
            },
        ).get("/x", undefined, {
            "X-Endpoint": "1",
            accept: "application/json",
        });

        expect(transport.requests[0].headers).to.deep.equal({
            accept: "application/json",
            authorization: "Bearer t",
            "x-endpoint": "1",
        });
    });

    it("posts a body with its content type", async function () {
        const transport = new FakeHttpTransport().respondJson(200, {});
        const body = Uint8Array.of(9, 8, 7);

        await client(transport).post(
            "/network/fees",
            "application/protobuf",
            body,
        );

        expect(transport.requests[0].method).to.equal("POST");
        expect(transport.requests[0].body).to.equal(body);
        expect(transport.requests[0].contentType).to.equal(
            "application/protobuf",
        );
    });

    it("retries a 503 once and succeeds", async function () {
        const transport = new FakeHttpTransport()
            .respond(errorResponse(503, "Unavailable"))
            .respondJson(200, { ok: true });

        const response = await client(transport).get("/x");

        expect(response.statusCode).to.equal(200);
        expect(transport.requests).to.have.length(2);
    });

    it("returns a 400 as received without retrying", async function () {
        const transport = new FakeHttpTransport().respond(
            errorResponse(400, "Invalid parameter"),
        );

        const response = await client(transport).get("/x");

        expect(response.statusCode).to.equal(400);
        expect(errorDetail(response)).to.equal("Error: Invalid parameter");
        expect(transport.requests).to.have.length(1);
    });

    it("retries 408 and 429, but not 501", async function () {
        const transport = new FakeHttpTransport()
            .respond(errorResponse(408, "Request timeout"))
            .respond(errorResponse(429, "Too many requests"))
            .respond(errorResponse(501, "Not implemented"));

        const response = await client(transport).get("/x");

        expect(response.statusCode).to.equal(501);
        expect(transport.requests).to.have.length(3);
    });

    it("does not retry a failure outside the seven identifiers", async function () {
        const transport = new FakeHttpTransport().fail(
            new Error("proxy exploded"),
        );

        const error = await caught(client(transport).get("/x"));

        expect(error.message).to.equal("proxy exploded");
        expect(transport.requests).to.have.length(1);
    });

    it("does not retry a terminal transport error", async function () {
        for (const code of [
            HttpTransportErrorCode.UNKNOWN_HOST_ERROR,
            HttpTransportErrorCode.TLS_ERROR,
            HttpTransportErrorCode.RESPONSE_TOO_LARGE_ERROR,
            HttpTransportErrorCode.CANCELLED_ERROR,
            HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
        ]) {
            const transport = new FakeHttpTransport().fail(
                new HttpTransportError(code, "boom"),
            );

            const error = await caught(client(transport).get("/x"));

            expect(error.code, code).to.equal(code);
            expect(transport.requests, code).to.have.length(1);
        }
    });

    it("retries a connection-error and a timeout-error, surfacing the last one when exhausted", async function () {
        const transport = new FakeHttpTransport()
            .fail(
                new HttpTransportError(
                    HttpTransportErrorCode.CONNECTION_ERROR,
                    "refused",
                ),
            )
            .fail(
                new HttpTransportError(
                    HttpTransportErrorCode.TIMEOUT_ERROR,
                    "slow",
                ),
            )
            .fail(
                new HttpTransportError(
                    HttpTransportErrorCode.CONNECTION_ERROR,
                    "reset",
                ),
            );

        const error = await caught(
            client(transport, { maxAttempts: 3 }).get("/x"),
        );

        expect(error.code).to.equal(HttpTransportErrorCode.CONNECTION_ERROR);
        expect(error.message).to.include("reset");
        expect(transport.requests).to.have.length(3);
    });

    it("fails with retries-exhausted-error carrying the last response", async function () {
        const transport = new FakeHttpTransport(() =>
            errorResponse(503, "Unavailable"),
        );

        const error = await caught(
            client(transport, { maxAttempts: 3 }).get("/x"),
        );

        expect(error).to.be.instanceOf(MirrorNodeHttpError);
        expect(error.code).to.equal(
            MirrorNodeHttpErrorCode.RETRIES_EXHAUSTED_ERROR,
        );
        expect(error.response.statusCode).to.equal(503);
        expect(error.message).to.equal(
            "retries exhausted after 3 attempts. Last error: HTTP 503: Error: Unavailable",
        );
        expect(transport.requests).to.have.length(3);
    });

    it("waits out a Retry-After instead of the computed backoff", async function () {
        vi.useFakeTimers();
        const transport = new FakeHttpTransport()
            .respond(errorResponse(429, "Throttled", { "Retry-After": "2" }))
            .respondJson(200, { ok: true });
        // A backoff cap far below the header, so only the header explains
        // the wait.
        const pending = client(transport, {
            initialBackoff: 1,
            maxBackoff: 1,
        }).get("/x");

        await vi.advanceTimersByTimeAsync(1990);
        expect(transport.requests).to.have.length(1);
        await vi.advanceTimersByTimeAsync(20);
        expect(transport.requests).to.have.length(2);

        const response = await pending;
        expect(response.statusCode).to.equal(200);
    });

    it("honours an HTTP-date Retry-After", async function () {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-09-24T12:00:00Z"));
        const transport = new FakeHttpTransport()
            .respond(
                errorResponse(503, "Down", {
                    "retry-after": new Date(Date.now() + 3000).toUTCString(),
                }),
            )
            .respondJson(200, {});
        const pending = client(transport).get("/x");

        await vi.advanceTimersByTimeAsync(2500);
        expect(transport.requests).to.have.length(1);
        await vi.advanceTimersByTimeAsync(600);
        expect(transport.requests).to.have.length(2);
        await pending;
    });

    it("fails immediately with deadline-exceeded-error when Retry-After exceeds the remaining deadline", async function () {
        const transport = new FakeHttpTransport().respond(
            errorResponse(429, "Throttled", { "retry-after": "3600" }),
        );

        const error = await caught(
            client(transport, { totalDeadline: 1000 }).get("/x"),
        );

        expect(error.code).to.equal(
            MirrorNodeHttpErrorCode.DEADLINE_EXCEEDED_ERROR,
        );
        expect(error.response.statusCode).to.equal(429);
        expect(error.message).to.include("retry after 3600000 ms");
        expect(transport.requests).to.have.length(1);
    });

    it("ignores Retry-After on a 408, where only the computed backoff applies", async function () {
        const transport = new FakeHttpTransport()
            .respond(
                errorResponse(408, "Request timeout", {
                    "retry-after": "3600",
                }),
            )
            .respondJson(200, {});

        const response = await client(transport, { totalDeadline: 1000 }).get(
            "/x",
        );

        expect(response.statusCode).to.equal(200);
        expect(transport.requests).to.have.length(2);
    });

    it("aborts each stalled attempt at perAttemptTimeout and retries", async function () {
        const transport = new FakeHttpTransport()
            .hang()
            .hang()
            .respondJson(200, {});

        const started = Date.now();
        const response = await client(transport, {
            maxAttempts: 3,
            perAttemptTimeout: 30,
            totalDeadline: 10_000,
        }).get("/x");

        expect(response.statusCode).to.equal(200);
        expect(transport.requests).to.have.length(3);
        for (const request of transport.requests) {
            expect(request.deadline).to.equal(30);
        }
        // Two attempts stalled for 30 ms each before the third answered.
        expect(Date.now() - started).to.be.at.least(55);
        expect(Date.now() - started).to.be.below(2000);
    });

    it("draws the backoff with full jitter below the exponential cap", function () {
        const http = MirrorNodeHttpClient.create(
            BASE_URL,
            new FakeHttpTransport(),
            new MirrorNodeHttpRetryPolicy({
                initialBackoff: 250,
                maxBackoff: 8000,
            }),
        );

        const draws = Array.from({ length: 200 }, () => http.backoffFor(3));
        for (const draw of draws) {
            expect(draw).to.be.at.least(0);
            expect(draw).to.be.below(2000);
        }
        expect(new Set(draws).size).to.be.above(1);
        for (const [n, cap] of [
            [0, 250],
            [1, 500],
            [2, 1000],
            [5, 8000],
            [10, 8000],
        ]) {
            expect(
                MirrorNodeHttpClient.create(
                    BASE_URL,
                    new FakeHttpTransport(),
                    new MirrorNodeHttpRetryPolicy({
                        initialBackoff: 250,
                        maxBackoff: 8000,
                    }),
                    { random: () => 0.999999 },
                ).backoffFor(n),
                `n=${n}`,
            ).to.be.within(cap - 2, cap - 1);
        }
    });

    it("bounds each attempt by perAttemptTimeout and by the time left", async function () {
        let now = 1_000_000;
        const transport = new FakeHttpTransport(() => {
            now += 9_700;
            return errorResponse(503, "Down");
        });
        const http = client(
            transport,
            { maxAttempts: 3, perAttemptTimeout: 1000, totalDeadline: 10_000 },
            { now: () => now },
        );

        const error = await caught(http.get("/x"));

        expect(error.code).to.equal(
            MirrorNodeHttpErrorCode.DEADLINE_EXCEEDED_ERROR,
        );
        expect(transport.requests[0].deadline).to.equal(1000);
        // 300 ms remained when the second attempt started.
        expect(transport.requests[1].deadline).to.equal(300);
        expect(transport.requests).to.have.length(2);
    });

    it("uses the remaining time alone when perAttemptTimeout is 0, and no bound when both are 0", async function () {
        const bounded = new FakeHttpTransport().respondJson(200, {});
        await client(bounded, {
            perAttemptTimeout: 0,
            totalDeadline: 5000,
        }).get("/x");
        expect(bounded.requests[0].deadline).to.be.within(4900, 5000);

        const unbounded = new FakeHttpTransport().respondJson(200, {});
        const http = client(unbounded, {
            perAttemptTimeout: 0,
            totalDeadline: 0,
        });
        await http.get("/x");
        expect(unbounded.requests[0].deadline).to.be.null;
        expect(http.remainingTime).to.be.null;
    });

    it("fails with deadline-exceeded-error, not retries-exhausted-error, when the deadline ends the run", async function () {
        const transport = new FakeHttpTransport(() =>
            errorResponse(503, "Down"),
        );

        const error = await caught(
            client(
                transport,
                {
                    maxAttempts: 10,
                    initialBackoff: 250,
                    maxBackoff: 8000,
                    totalDeadline: 100,
                },
                { random: () => 0.99 },
            ).get("/x"),
        );

        expect(error.code).to.equal(
            MirrorNodeHttpErrorCode.DEADLINE_EXCEEDED_ERROR,
        );
        expect(error.message).to.equal(
            "request deadline of 100 ms exceeded. Last error: HTTP 503: Error: Down",
        );
        expect(transport.requests).to.have.length(1);
    });

    it("interrupts a backoff sleep on caller cancellation", async function () {
        const transport = new FakeHttpTransport(() =>
            errorResponse(503, "Down"),
        );
        const controller = new AbortController();

        const pending = client(
            transport,
            { initialBackoff: 10_000, maxBackoff: 10_000 },
            { random: () => 0.5 },
        ).get("/x", controller.signal);
        setTimeout(() => controller.abort(), 10);
        const error = await caught(pending);

        expect(error.code).to.equal(HttpTransportErrorCode.CANCELLED_ERROR);
        expect(transport.requests).to.have.length(1);
    });

    it("interrupts a backoff sleep and starts no attempt after the client closes", async function () {
        const transport = new FakeHttpTransport(() =>
            errorResponse(503, "Down"),
        );
        const closeController = new AbortController();

        const pending = client(
            transport,
            { initialBackoff: 10_000, maxBackoff: 10_000 },
            { random: () => 0.5, closeSignal: closeController.signal },
        ).get("/x");
        setTimeout(() => closeController.abort(), 10);
        const error = await caught(pending);

        expect(error.code).to.equal(HttpTransportErrorCode.CLIENT_CLOSED_ERROR);
        expect(transport.requests).to.have.length(1);

        const closed = await caught(
            client(transport, {}, { closeSignal: closeController.signal }).get(
                "/y",
            ),
        );
        expect(closed.code).to.equal(
            HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
        );
        expect(transport.requests).to.have.length(1);
    });

    it("replays a POST body byte for byte on retry", async function () {
        const transport = new FakeHttpTransport()
            .respond(errorResponse(503, "Down"))
            .respondJson(200, {});
        const body = Uint8Array.of(1, 2, 3);

        await client(transport).post(
            "/network/fees",
            "application/protobuf",
            body,
        );

        expect(transport.requests).to.have.length(2);
        for (const request of transport.requests) {
            expect(request.method).to.equal("POST");
            expect([...request.body]).to.deep.equal([1, 2, 3]);
            expect(request.contentType).to.equal("application/protobuf");
        }
    });

    it("logs each retry", async function () {
        const logger = { debug: vi.fn() };
        const transport = new FakeHttpTransport()
            .respond(errorResponse(503, "Down"))
            .respondJson(200, {});

        // @ts-ignore partial logger
        await client(transport, {}, { logger }).get("/x");

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug.mock.calls[0][0]).to.include("attempt 1");
        expect(logger.debug.mock.calls[0][0]).to.include(
            "HTTP 503: Error: Down",
        );
    });

    it("passes the caller's signal straight through to the transport", async function () {
        const transport = new FakeHttpTransport().respondJson(200, {});
        const controller = new AbortController();

        await client(transport).get("/x", controller.signal);

        expect(transport.signals[0]).to.equal(controller.signal);
    });

    it("rejects an invalid base URL", function () {
        expect(() =>
            MirrorNodeHttpClient.create(
                "mirror.example/api/v1",
                new FakeHttpTransport(),
                MirrorNodeHttpRetryPolicy.DEFAULT,
            ),
        ).to.throw(TypeError, "baseUrl");
    });

    describe("helpers", function () {
        it("parseRetryAfter handles delta-seconds, HTTP-dates and garbage", function () {
            const now = Date.parse("2026-09-24T12:00:00Z");
            const response = (value) =>
                new HttpResponse({
                    statusCode: 429,
                    headers: value == null ? {} : { "retry-after": value },
                });

            expect(parseRetryAfter(response("7"), now)).to.equal(7000);
            expect(parseRetryAfter(response(" 0 "), now)).to.equal(0);
            expect(
                parseRetryAfter(
                    response(new Date(now + 5000).toUTCString()),
                    now,
                ),
            ).to.be.within(4000, 5000);
            expect(
                parseRetryAfter(
                    response(new Date(now - 5000).toUTCString()),
                    now,
                ),
            ).to.equal(0);
            expect(parseRetryAfter(response("soon"), now)).to.be.null;
            expect(parseRetryAfter(response(null), now)).to.be.null;
        });

        it("bodyText and bodyJson decode the body", function () {
            expect(bodyText(jsonResponse(200, { a: 1 }))).to.equal('{"a":1}');
            expect(bodyJson(jsonResponse(200, { a: 1 }))).to.deep.equal({
                a: 1,
            });
            const empty = new HttpResponse({ statusCode: 204 });
            expect(bodyText(empty)).to.equal("");
            expect(bodyJson(empty)).to.be.null;
            expect(() =>
                bodyJson(
                    new HttpResponse({
                        statusCode: 200,
                        body: new TextEncoder().encode("<html>"),
                    }),
                ),
            ).to.throw(SyntaxError);
        });

        it("errorDetail prefers the mirror node envelope and truncates raw text", function () {
            expect(errorDetail(errorResponse(400, "Bad id"))).to.equal(
                "Error: Bad id",
            );
            expect(
                errorDetail(
                    jsonResponse(400, {
                        _status: { messages: [{ message: "Bad Request" }] },
                    }),
                ),
            ).to.equal("Bad Request");
            expect(errorDetail(jsonResponse(400, { other: true }))).to.equal(
                '{"other":true}',
            );
            const raw = new HttpResponse({
                statusCode: 502,
                body: new TextEncoder().encode("x".repeat(600)),
            });
            expect(errorDetail(raw)).to.have.length(500);
            expect(errorDetail(new HttpResponse({ statusCode: 500 }))).to.equal(
                "",
            );
        });

        it("statusMessage renders HTTP <status>[: detail]", function () {
            expect(statusMessage(errorResponse(404, "Not found"))).to.equal(
                "HTTP 404: Error: Not found",
            );
            expect(
                statusMessage(new HttpResponse({ statusCode: 503 })),
            ).to.equal("HTTP 503");
        });
    });
});
