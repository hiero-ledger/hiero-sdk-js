// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AddressBookQueryWeb from "../../src/network/AddressBookQueryWeb.js";

/**
 * The minimum a client needs to expose for the web address book query.
 * @param {number} [maxAttempts]
 * @param {object} [logger]
 * @param {object} [overrides]
 */
function stubClient(maxAttempts = 3, logger = null, overrides = {}) {
    return {
        _logger: logger,
        _mirrorNetwork: {
            getNextMirrorNode: () => ({
                address: { address: "127.0.0.1", port: 5551 },
            }),
        },
        _network: { ledgerId: null },
        maxAttempts,
        requestTimeout: 120000,
        isClientShutDown: false,
        ...overrides,
    };
}

/**
 * Run `fn` with `AbortSignal.timeout` removed, as on React Native and
 * browsers before Chrome 103 / Safari 16.
 * @param {() => Promise<void>} fn
 */
async function withoutAbortSignalTimeout(fn) {
    const original = AbortSignal.timeout;
    // @ts-ignore simulate a runtime without the static
    AbortSignal.timeout = undefined;
    try {
        await fn();
    } finally {
        AbortSignal.timeout = original;
    }
}

/**
 * @param {number} nodeId
 */
function node(nodeId) {
    return {
        node_id: nodeId,
        node_account_id: `0.0.${nodeId + 3}`,
        node_cert_hash: "0xabc",
        public_key: "302a300506032b6570032100aa",
        description: `node ${nodeId}`,
        stake: 1,
        grpc_proxy_endpoint: { domain_name: "node.example.com", port: 443 },
        service_endpoints: [],
    };
}

/**
 * @param {object} body
 * @param {number} [status]
 */
function jsonResponse(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    };
}

/**
 * @param {number} status
 * @param {string} detail
 */
function errorResponse(status, detail) {
    return jsonResponse(
        { _status: { messages: [{ message: "Error", detail }] } },
        status,
    );
}

/**
 * Behave like a real `fetch` against a server that never answers: reject
 * only when the abort signal fires, with the signal's own reason.
 * @param {AbortSignal} signal
 * @returns {Promise<never>}
 */
function hangUntilAborted(signal) {
    return new Promise((_, reject) => {
        signal.addEventListener("abort", () => {
            const fallback = new Error("This operation was aborted");
            fallback.name = "AbortError";
            reject(signal.reason ?? fallback);
        });
    });
}

function query() {
    // Keep the backoff negligible so retries do not slow the suite down.
    return new AddressBookQueryWeb().setFileId("0.0.102").setMaxBackoff(1);
}

describe("AddressBookQueryWeb", function () {
    /** @type {import("vitest").Mock} */
    let fetchMock;

    beforeEach(function () {
        fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(function () {
        vi.unstubAllGlobals();
    });

    it("does not retry a 4xx and surfaces the mirror node detail", async function () {
        fetchMock.mockResolvedValue(errorResponse(404, "Not found"));

        await expect(query().execute(stubClient())).rejects.toThrow(
            "Failed to query address book: HTTP 404: Error: Not found",
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry a 404 whose body echoes the request path", async function () {
        // Real testnet mirror node body for an unmapped route. The path
        // contains "network", which the transport regex would match if a
        // status message ever reached it.
        fetchMock.mockResolvedValue(
            errorResponse(
                404,
                "No static resource api/v1/network/nodes for request '/api/v1/network/nodes'.",
            ),
        );

        await expect(query().execute(stubClient())).rejects.toThrow("HTTP 404");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry a 400 whose detail mentions a timeout", async function () {
        fetchMock.mockResolvedValue(
            errorResponse(400, "request timeout must be positive"),
        );

        await expect(query().execute(stubClient())).rejects.toThrow("HTTP 400");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry a malformed body", async function () {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.reject(new SyntaxError("Unexpected token <")),
            text: () => Promise.resolve("<html>"),
        });

        await expect(query().execute(stubClient())).rejects.toThrow(
            "Failed to query address book: Unexpected token <",
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("retries a 5xx and succeeds on the next attempt", async function () {
        fetchMock
            .mockResolvedValueOnce(errorResponse(503, "Unavailable"))
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));

        const book = await query().execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(book.nodeAddresses).to.have.length(1);
        expect(book.nodeAddresses[0].accountId.toString()).to.equal("0.0.3");
    });

    it("retries a browser fetch network failure", async function () {
        fetchMock
            .mockRejectedValueOnce(new TypeError("Failed to fetch"))
            .mockRejectedValueOnce(new TypeError("Load failed"))
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));

        const book = await query().execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("logs each retry through the client logger", async function () {
        const logger = { debug: vi.fn(), trace: vi.fn(), warn: vi.fn() };
        fetchMock
            .mockResolvedValueOnce(errorResponse(503, "Unavailable"))
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));

        await query().execute(stubClient(3, logger));

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug.mock.calls[0][0]).to.include("attempt 1");
        expect(logger.debug.mock.calls[0][0]).to.include("HTTP 503");
    });

    it("retries a timeout", async function () {
        const timeout = new Error("The operation was aborted due to timeout");
        timeout.name = "TimeoutError";
        fetchMock
            .mockRejectedValueOnce(timeout)
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));

        const book = await query().execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("gives up after maxAttempts + 1 tries on a persistent 5xx", async function () {
        fetchMock.mockResolvedValue(errorResponse(503, "Unavailable"));

        await expect(query().execute(stubClient(2))).rejects.toThrow(
            "Failed to query address book after 3 attempts. Last error: HTTP 503: Error: Unavailable",
        );
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("follows pagination and applies the retry budget per page", async function () {
        // maxAttempts 1 allows exactly one retry per page. One 5xx on each
        // page succeeds only if the budget is renewed per page; a shared
        // budget would be exhausted on the second page.
        fetchMock
            .mockResolvedValueOnce(errorResponse(502, "Bad gateway"))
            .mockResolvedValueOnce(
                jsonResponse({
                    nodes: [node(0)],
                    links: {
                        next: "/api/v1/network/nodes?limit=1&node.id=gt:0",
                    },
                }),
            )
            .mockResolvedValueOnce(errorResponse(502, "Bad gateway"))
            .mockResolvedValueOnce(
                jsonResponse({ nodes: [node(1)], links: { next: null } }),
            );

        const book = await query().execute(stubClient(1));

        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchMock.mock.calls[0][0]).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?file.id=0.0.102&limit=25",
        );
        expect(fetchMock.mock.calls[2][0]).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?limit=1&node.id=gt:0",
        );
        expect(
            book.nodeAddresses.map((a) => a.accountId.toString()),
        ).to.deep.equal(["0.0.3", "0.0.4"]);
    });

    it("bounds every request to 30 s by default", async function () {
        const timeoutSpy = vi.spyOn(AbortSignal, "timeout");

        for (const requestTimeout of [undefined, 0, -5]) {
            timeoutSpy.mockClear();
            fetchMock.mockReset();
            fetchMock
                .mockResolvedValueOnce(
                    jsonResponse({
                        nodes: [node(0)],
                        links: {
                            next: "/api/v1/network/nodes?limit=1&node.id=gt:0",
                        },
                    }),
                )
                .mockResolvedValueOnce(jsonResponse({ nodes: [node(1)] }));

            await query().execute(stubClient(), requestTimeout);

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(timeoutSpy).toHaveBeenCalledTimes(2);
            for (const call of timeoutSpy.mock.calls) {
                expect(call[0]).to.equal(30000);
            }
            for (const call of fetchMock.mock.calls) {
                expect(call[1].signal).to.be.instanceOf(AbortSignal);
            }
        }
        timeoutSpy.mockRestore();
    });

    it("caps each attempt at the time left in requestTimeout", async function () {
        const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
        fetchMock.mockResolvedValue(jsonResponse({ nodes: [node(0)] }));

        await query().execute(stubClient(), 1234);

        expect(timeoutSpy).toHaveBeenCalledTimes(1);
        expect(timeoutSpy.mock.calls[0][0]).to.be.within(1200, 1234);
        timeoutSpy.mockRestore();
    });

    it("falls back to client.requestTimeout as the total budget", async function () {
        const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
        fetchMock.mockResolvedValue(jsonResponse({ nodes: [node(0)] }));

        await query().execute(stubClient(3, null, { requestTimeout: 5000 }), 0);

        expect(timeoutSpy.mock.calls[0][0]).to.be.within(4900, 5000);
        timeoutSpy.mockRestore();
    });

    it("stops retrying when the total budget is exhausted", async function () {
        fetchMock.mockResolvedValue(errorResponse(503, "Unavailable"));
        const q = query().setMaxBackoff(8000);

        await expect(q.execute(stubClient(100), 50)).rejects.toThrow(
            "Failed to query address book: request timeout of 50 ms exceeded. Last error: HTTP 503: Error: Unavailable",
        );
        // The first backoff (250 ms) would run past the 50 ms deadline, so
        // there is no second attempt.
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("aborts a hung request after the attempt timeout and retries", async function () {
        fetchMock
            .mockImplementationOnce((_, init) => hangUntilAborted(init.signal))
            .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));
        const q = query();
        q._attemptTimeoutMs = 20;

        const book = await q.execute(stubClient());

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("falls back to AbortController when AbortSignal.timeout is missing", async function () {
        await withoutAbortSignalTimeout(async () => {
            fetchMock
                .mockImplementationOnce((_, init) =>
                    hangUntilAborted(init.signal),
                )
                .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));
            const q = query();
            q._attemptTimeoutMs = 20;

            const book = await q.execute(stubClient());

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchMock.mock.calls[0][1].signal).to.be.instanceOf(
                AbortSignal,
            );
            expect(book.nodeAddresses).to.have.length(1);
        });
    });

    it("keeps the fallback timer armed while the body is read", async function () {
        await withoutAbortSignalTimeout(async () => {
            // Headers arrive, then the body stalls. Only the abort signal
            // can end the read.
            fetchMock
                .mockImplementationOnce((_, init) =>
                    Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => hangUntilAborted(init.signal),
                        text: () => hangUntilAborted(init.signal),
                    }),
                )
                .mockResolvedValueOnce(jsonResponse({ nodes: [node(0)] }));
            const q = query();
            q._attemptTimeoutMs = 20;

            const book = await q.execute(stubClient());

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(book.nodeAddresses).to.have.length(1);
        });
    });

    it("clears the fallback timer once the request settles", async function () {
        await withoutAbortSignalTimeout(async () => {
            vi.useFakeTimers();
            try {
                fetchMock.mockResolvedValue(jsonResponse({ nodes: [node(0)] }));

                await query().execute(stubClient());

                expect(vi.getTimerCount()).to.equal(0);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    it("rejects instead of hanging when no mirror node is configured", async function () {
        const client = stubClient(3, null, {
            _mirrorNetwork: { getNextMirrorNode: () => undefined },
        });

        await expect(query().execute(client)).rejects.toThrow(TypeError);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("stops retrying once the client is shut down", async function () {
        const client = stubClient();
        fetchMock.mockImplementation(() => {
            client.isClientShutDown = true;
            return Promise.resolve(errorResponse(503, "Unavailable"));
        });

        await expect(query().execute(client)).rejects.toThrow("HTTP 503");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
