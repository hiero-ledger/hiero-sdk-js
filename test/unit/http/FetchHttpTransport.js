// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import FetchHttpTransport from "../../../src/http/FetchHttpTransport.js";
import HttpRequest from "../../../src/http/HttpRequest.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../../src/http/HttpTransportError.js";
import { SDK_NAME, SDK_VERSION } from "../../../src/version.js";

const URL_ = "https://mirror.example/api/v1/accounts/0.0.3";

/**
 * @param {object} [props]
 * @returns {HttpRequest}
 */
function request(props = {}) {
    return new HttpRequest({ method: "GET", url: URL_, ...props });
}

/**
 * Behave like a real `fetch` against a server that never answers: reject
 * only when the abort signal fires, with an `AbortError`.
 *
 * @param {RequestInit} init
 * @returns {Promise<never>}
 */
function hangUntilAborted(init) {
    return new Promise((_, reject) => {
        const signal = /** @type {AbortSignal} */ (init.signal);
        signal.addEventListener("abort", () => {
            const error = new Error("This operation was aborted");
            error.name = "AbortError";
            reject(error);
        });
    });
}

/**
 * @param {unknown} promise
 * @returns {Promise<any>}
 */
function caught(promise) {
    return /** @type {Promise<any>} */ (promise).then(
        () => {
            throw new Error("expected the promise to reject");
        },
        (error) => error,
    );
}

describe("FetchHttpTransport", function () {
    /** @type {import("vitest").Mock} */
    let fetchMock;

    beforeEach(function () {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(function () {
        vi.unstubAllGlobals();
    });

    it("returns a 404 as a response rather than failing", async function () {
        fetchMock.mockResolvedValue(
            new Response('{"_status":{"messages":[{"message":"Not found"}]}}', {
                status: 404,
                headers: { "Content-Type": "application/json" },
            }),
        );

        const response = await FetchHttpTransport.create().roundTrip(request());

        expect(response.statusCode).to.equal(404);
        expect(response.ok).to.be.false;
        expect(response.header("content-type")).to.equal("application/json");
        expect(new TextDecoder().decode(response.body)).to.include("Not found");
    });

    it("sends the identity header, the content type, no user-agent, and bypasses caches", async function () {
        fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
        const body = Uint8Array.of(1, 2, 3);

        await FetchHttpTransport.create({
            defaultHeaders: {
                "User-Agent": "custom",
                "X-Env": "test",
                Accept: "text/plain",
            },
        }).roundTrip(
            request({
                method: "POST",
                body,
                contentType: "application/protobuf",
                headers: { Accept: "application/json" },
            }),
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).to.equal(URL_);
        expect(init.method).to.equal("POST");
        expect(init.body).to.equal(body);
        expect(init.cache).to.equal("no-store");
        expect(init.signal).to.be.instanceOf(AbortSignal);
        expect(init.headers).to.deep.equal({
            "x-env": "test",
            accept: "application/json",
            "content-type": "application/protobuf",
            "x-user-agent": `${SDK_NAME}/${SDK_VERSION}`,
        });
    });

    it("maps an opaque fetch network failure to connection-error", async function () {
        fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

        const error = await caught(
            FetchHttpTransport.create().roundTrip(request()),
        );

        expect(error).to.be.instanceOf(HttpTransportError);
        expect(error.code).to.equal(HttpTransportErrorCode.CONNECTION_ERROR);
        expect(error.retryable).to.be.true;
        expect(error.message).to.include("Failed to fetch");
    });

    it("classifies a Node fetch failure by its cause code", async function () {
        for (const [code, expected] of [
            ["ENOTFOUND", HttpTransportErrorCode.UNKNOWN_HOST_ERROR],
            ["CERT_HAS_EXPIRED", HttpTransportErrorCode.TLS_ERROR],
            ["ECONNREFUSED", HttpTransportErrorCode.CONNECTION_ERROR],
            ["UND_ERR_HEADERS_TIMEOUT", HttpTransportErrorCode.TIMEOUT_ERROR],
        ]) {
            const cause = new Error(`native ${code}`);
            // @ts-ignore system error code
            cause.code = code;
            fetchMock.mockRejectedValueOnce(
                new TypeError("fetch failed", { cause }),
            );

            const error = await caught(
                FetchHttpTransport.create().roundTrip(request()),
            );

            expect(error.code, code).to.equal(expected);
            expect(error.message).to.include(`native ${code}`);
        }
    });

    it("fails with timeout-error when the deadline elapses and aborts the fetch", async function () {
        fetchMock.mockImplementation((_, init) => hangUntilAborted(init));

        const started = Date.now();
        const error = await caught(
            FetchHttpTransport.create().roundTrip(request({ deadline: 30 })),
        );

        expect(error.code).to.equal(HttpTransportErrorCode.TIMEOUT_ERROR);
        expect(error.retryable).to.be.true;
        expect(Date.now() - started).to.be.below(2000);
        expect(fetchMock.mock.calls[0][1].signal.aborted).to.be.true;
    });

    it("fails with cancelled-error when the caller aborts, and releases its listener", async function () {
        fetchMock.mockImplementation((_, init) => hangUntilAborted(init));
        const controller = new AbortController();
        const added = vi.spyOn(controller.signal, "addEventListener");
        const removed = vi.spyOn(controller.signal, "removeEventListener");

        const pending = FetchHttpTransport.create().roundTrip(
            request(),
            controller.signal,
        );
        setTimeout(() => controller.abort(), 5);
        const error = await caught(pending);

        expect(error.code).to.equal(HttpTransportErrorCode.CANCELLED_ERROR);
        expect(error.retryable).to.be.false;
        expect(added).toHaveBeenCalledTimes(1);
        expect(removed).toHaveBeenCalledTimes(1);
    });

    it("fails with cancelled-error without calling fetch when already aborted", async function () {
        const controller = new AbortController();
        controller.abort();

        const error = await caught(
            FetchHttpTransport.create().roundTrip(request(), controller.signal),
        );

        expect(error.code).to.equal(HttpTransportErrorCode.CANCELLED_ERROR);
        expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it("fails fast after close, and close is idempotent", async function () {
        const transport = FetchHttpTransport.create();
        await transport.close(1000);
        await transport.close(1000);

        const error = await caught(transport.roundTrip(request()));

        expect(transport.closed).to.be.true;
        expect(error.code).to.equal(HttpTransportErrorCode.CLIENT_CLOSED_ERROR);
        expect(fetchMock).toHaveBeenCalledTimes(0);
    });

    it("aborts an exchange in flight on close with client-closed-error", async function () {
        fetchMock.mockImplementation((_, init) => hangUntilAborted(init));
        const transport = FetchHttpTransport.create();

        const pending = transport.roundTrip(request());
        await transport.close(1000);
        const error = await caught(pending);

        expect(error.code).to.equal(HttpTransportErrorCode.CLIENT_CLOSED_ERROR);
    });

    it("rejects a streamed body over maxResponseBytes without truncating", async function () {
        fetchMock.mockResolvedValue(
            new Response("x".repeat(20), { status: 200 }),
        );

        const error = await caught(
            FetchHttpTransport.create({ maxResponseBytes: 10 }).roundTrip(
                request(),
            ),
        );

        expect(error.code).to.equal(
            HttpTransportErrorCode.RESPONSE_TOO_LARGE_ERROR,
        );
        expect(error.retryable).to.be.false;
    });

    it("buffers then rejects an oversized body where the runtime cannot stream", async function () {
        fetchMock.mockResolvedValue({
            status: 200,
            headers: new Headers(),
            body: null,
            arrayBuffer: () => Promise.resolve(new Uint8Array(20).buffer),
        });

        const error = await caught(
            FetchHttpTransport.create({ maxResponseBytes: 10 }).roundTrip(
                request(),
            ),
        );

        expect(error.code).to.equal(
            HttpTransportErrorCode.RESPONSE_TOO_LARGE_ERROR,
        );
    });

    it("falls back to text() on a runtime with neither streams nor arrayBuffer()", async function () {
        fetchMock.mockResolvedValue({
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            text: () => Promise.resolve('{"ok":true}'),
        });

        const response = await FetchHttpTransport.create().roundTrip(request());

        expect(new TextDecoder().decode(response.body)).to.equal('{"ok":true}');
    });

    it("loses no value of a repeated header", async function () {
        fetchMock.mockResolvedValue(
            new Response("", {
                status: 200,
                headers: [
                    ["X-Multi", "a"],
                    ["X-Multi", "b"],
                ],
            }),
        );

        const response = await FetchHttpTransport.create().roundTrip(request());

        // A browser `Headers` joins repeated values into one string; Node
        // may keep them apart. Either way nothing is lost.
        expect(response.headers["x-multi"].join(", ")).to.equal("a, b");
    });

    it("runs concurrent exchanges independently", async function () {
        fetchMock.mockImplementation((url) =>
            Promise.resolve(new Response(String(url), { status: 200 })),
        );
        const transport = FetchHttpTransport.create();

        const responses = await Promise.all(
            [0, 1, 2, 3, 4].map((i) =>
                transport.roundTrip(request({ url: `${URL_}?i=${i}` })),
            ),
        );

        responses.forEach((response, i) => {
            expect(new TextDecoder().decode(response.body)).to.equal(
                `${URL_}?i=${i}`,
            );
        });
    });

    it("maps a platform AbortError or TimeoutError it did not cause", async function () {
        const abort = new Error("aborted elsewhere");
        abort.name = "AbortError";
        fetchMock.mockRejectedValueOnce(abort);
        let error = await caught(
            FetchHttpTransport.create().roundTrip(request()),
        );
        expect(error.code).to.equal(HttpTransportErrorCode.CANCELLED_ERROR);

        const timeout = new Error("timed out");
        timeout.name = "TimeoutError";
        fetchMock.mockRejectedValueOnce(timeout);
        error = await caught(FetchHttpTransport.create().roundTrip(request()));
        expect(error.code).to.equal(HttpTransportErrorCode.TIMEOUT_ERROR);
    });

    it("surfaces an unrecognised failure as it is", async function () {
        fetchMock.mockRejectedValue(new SyntaxError("boom"));

        const error = await caught(
            FetchHttpTransport.create().roundTrip(request()),
        );

        expect(error).to.be.instanceOf(SyntaxError);
        expect(HttpTransportError.isRetryable(error)).to.be.false;
    });

    it("exposes its configuration", function () {
        const transport = FetchHttpTransport.create({ maxRedirects: 2 });
        expect(transport.configuration.maxRedirects).to.equal(2);
        expect(transport.closed).to.be.false;
    });
});
