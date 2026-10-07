// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import { Client } from "../../src/index.js";
import AddressBookQueryWeb from "../../src/network/AddressBookQueryWeb.js";
import HttpResponse from "../../src/http/HttpResponse.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../src/http/HttpTransportError.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "./utils/FakeHttpTransport.js";

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
 * @param {FakeHttpTransport} fake
 * @param {object} [options]
 * @param {string} [options.mirror]
 * @param {object} [options.policy]
 * @param {object} [options.logger]
 * @returns {Client}
 */
function clientWith(fake, options = {}) {
    const client = new Client();
    client.setMirrorNetwork([options.mirror ?? "127.0.0.1:5551"]);
    client.setMirrorNodeHttpConfig({
        transport: fake,
        // Three attempts and a negligible backoff keep the suite fast.
        retryPolicy: {
            maxAttempts: 3,
            initialBackoff: 1,
            maxBackoff: 1,
            ...options.policy,
        },
    });
    if (options.logger != null) {
        // @ts-ignore a partial logger is enough for retry diagnostics
        client._logger = options.logger;
    }
    return client;
}

function query() {
    return new AddressBookQueryWeb().setFileId("0.0.102");
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

describe("AddressBookQueryWeb", function () {
    /** @type {Client[]} */
    let clients = [];

    /**
     * @param {FakeHttpTransport} fake
     * @param {object} [options]
     */
    function track(fake, options) {
        const client = clientWith(fake, options);
        clients.push(client);
        return client;
    }

    afterEach(function () {
        for (const client of clients) {
            client.close();
        }
        clients = [];
        vi.restoreAllMocks();
    });

    it("does not retry a 4xx and surfaces the mirror node detail", async function () {
        const fake = new FakeHttpTransport(() =>
            errorResponse(404, "Not found"),
        );

        const error = await caught(query().execute(track(fake)));

        expect(error.message).to.equal(
            "Failed to query address book: HTTP 404: Error: Not found",
        );
        expect(fake.requests).to.have.length(1);
    });

    it("does not retry a 404 whose body echoes the request path", async function () {
        // Real testnet mirror node body for an unmapped route.
        const fake = new FakeHttpTransport(() =>
            errorResponse(
                404,
                "No static resource api/v1/network/nodes for request '/api/v1/network/nodes'.",
            ),
        );

        const error = await caught(query().execute(track(fake)));

        expect(error.message).to.include("HTTP 404");
        expect(fake.requests).to.have.length(1);
    });

    it("does not retry a 400 whose detail mentions a timeout", async function () {
        const fake = new FakeHttpTransport(() =>
            errorResponse(400, "request timeout must be positive"),
        );

        const error = await caught(query().execute(track(fake)));

        expect(error.message).to.include("HTTP 400");
        expect(fake.requests).to.have.length(1);
    });

    it("does not retry a malformed body", async function () {
        const fake = new FakeHttpTransport(
            () =>
                new HttpResponse({
                    statusCode: 200,
                    body: new TextEncoder().encode("<html>"),
                }),
        );

        const error = await caught(query().execute(track(fake)));

        expect(error.message).to.match(/^Failed to query address book: /);
        expect(fake.requests).to.have.length(1);
    });

    it("retries a 5xx and succeeds on the next attempt", async function () {
        const fake = new FakeHttpTransport()
            .respond(errorResponse(503, "Unavailable"))
            .respondJson(200, { nodes: [node(0)] });

        const book = await query().execute(track(fake));

        expect(fake.requests).to.have.length(2);
        expect(book.nodeAddresses).to.have.length(1);
        expect(book.nodeAddresses[0].accountId.toString()).to.equal("0.0.3");
    });

    it("retries a transport connection failure", async function () {
        const fake = new FakeHttpTransport()
            .fail(
                new HttpTransportError(
                    HttpTransportErrorCode.CONNECTION_ERROR,
                    "Failed to fetch",
                ),
            )
            .fail(
                new HttpTransportError(
                    HttpTransportErrorCode.CONNECTION_ERROR,
                    "Load failed",
                ),
            )
            .respondJson(200, { nodes: [node(0)] });

        const book = await query().execute(track(fake));

        expect(fake.requests).to.have.length(3);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("logs each retry through the client logger", async function () {
        const logger = { debug: vi.fn(), trace: vi.fn(), warn: vi.fn() };
        const fake = new FakeHttpTransport()
            .respond(errorResponse(503, "Unavailable"))
            .respondJson(200, { nodes: [node(0)] });

        await query().execute(track(fake, { logger }));

        expect(logger.debug).toHaveBeenCalledTimes(1);
        expect(logger.debug.mock.calls[0][0]).to.include("attempt 1");
        expect(logger.debug.mock.calls[0][0]).to.include("HTTP 503");
    });

    it("retries a timeout", async function () {
        const fake = new FakeHttpTransport()
            .fail(
                new HttpTransportError(
                    HttpTransportErrorCode.TIMEOUT_ERROR,
                    "the deadline elapsed",
                ),
            )
            .respondJson(200, { nodes: [node(0)] });

        const book = await query().execute(track(fake));

        expect(fake.requests).to.have.length(2);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("gives up after maxAttempts tries on a persistent 5xx", async function () {
        const fake = new FakeHttpTransport(() =>
            errorResponse(503, "Unavailable"),
        );

        const error = await caught(
            query().setMaxAttempts(2).execute(track(fake)),
        );

        expect(error.message).to.equal(
            "Failed to query address book: retries exhausted after 2 attempts. Last error: HTTP 503: Error: Unavailable",
        );
        expect(fake.requests).to.have.length(2);
    });

    it("follows pagination and applies the retry budget per page", async function () {
        // maxAttempts 2 allows exactly one retry per page. One 5xx on each
        // page succeeds only if the budget is renewed per page; a shared
        // budget would be exhausted on the second page.
        const fake = new FakeHttpTransport()
            .respond(errorResponse(502, "Bad gateway"))
            .respondJson(200, {
                nodes: [node(0)],
                links: { next: "/api/v1/network/nodes?limit=1&node.id=gt:0" },
            })
            .respond(errorResponse(502, "Bad gateway"))
            .respondJson(200, { nodes: [node(1)], links: { next: null } });

        const book = await query().setMaxAttempts(2).execute(track(fake));

        expect(fake.requests).to.have.length(4);
        expect(fake.requests[0].url).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?file.id=0.0.102&limit=25",
        );
        expect(fake.requests[2].url).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?limit=1&node.id=gt:0",
        );
        expect(
            book.nodeAddresses.map((a) => a.accountId.toString()),
        ).to.deep.equal(["0.0.3", "0.0.4"]);
    });

    it("refuses a next link that names another host", async function () {
        const fake = new FakeHttpTransport().respondJson(200, {
            nodes: [node(0)],
            links: { next: "https://evil.example/api/v1/network/nodes" },
        });

        const error = await caught(query().execute(track(fake)));

        expect(error.message).to.include("must not name a host");
        expect(fake.requests).to.have.length(1);
    });

    it("bounds every request to 30 s by default", async function () {
        for (const requestTimeout of [undefined, 0, -5]) {
            const fake = new FakeHttpTransport()
                .respondJson(200, {
                    nodes: [node(0)],
                    links: {
                        next: "/api/v1/network/nodes?limit=1&node.id=gt:0",
                    },
                })
                .respondJson(200, { nodes: [node(1)] });

            await query().execute(track(fake), requestTimeout);

            expect(fake.requests).to.have.length(2);
            for (const request of fake.requests) {
                expect(request.deadline).to.equal(30000);
            }
        }
    });

    it("caps each attempt at the time left in requestTimeout", async function () {
        const fake = new FakeHttpTransport().respondJson(200, {
            nodes: [node(0)],
        });

        await query().execute(track(fake), 1234);

        expect(fake.requests[0].deadline).to.be.within(1200, 1234);
    });

    it("falls back to client.requestTimeout as the total budget", async function () {
        const fake = new FakeHttpTransport().respondJson(200, {
            nodes: [node(0)],
        });
        const client = track(fake);
        client.setRequestTimeout(5000);

        await query().execute(client, 0);

        expect(fake.requests[0].deadline).to.be.within(4900, 5000);
    });

    it("stops retrying when the total budget is exhausted", async function () {
        const fake = new FakeHttpTransport(() =>
            errorResponse(503, "Unavailable"),
        );
        // A backoff that cannot fit in the budget, so the second attempt is
        // never made.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const client = track(fake, {
            policy: { initialBackoff: 8000, maxBackoff: 8000 },
        });

        const error = await caught(query().execute(client, 50));

        expect(error.message).to.equal(
            "Failed to query address book: request deadline of 50 ms exceeded. Last error: HTTP 503: Error: Unavailable",
        );
        expect(fake.requests).to.have.length(1);
    });

    it("aborts a hung request after the attempt timeout and retries", async function () {
        const fake = new FakeHttpTransport()
            .hang()
            .respondJson(200, { nodes: [node(0)] });
        const client = track(fake, { policy: { perAttemptTimeout: 20 } });

        const book = await query().execute(client);

        expect(fake.requests).to.have.length(2);
        expect(fake.requests[0].deadline).to.equal(20);
        expect(book.nodeAddresses).to.have.length(1);
    });

    it("rejects instead of hanging when no mirror node is configured", async function () {
        const client = new Client();
        clients.push(client);
        client.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });

        const error = await caught(query().execute(client));

        expect(error.message).to.include(
            "Client has no mirror network configured",
        );
    });

    it("stops when the client closes mid-query", async function () {
        const fake = new FakeHttpTransport(() =>
            errorResponse(503, "Unavailable"),
        );
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const client = track(fake, {
            policy: { initialBackoff: 100000, maxBackoff: 100000 },
        });

        const pending = query().execute(client);
        setTimeout(() => client.close(), 20);
        const error = await caught(pending);

        expect(error.message).to.include(
            HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
        );
        expect(fake.requests).to.have.length(1);
    });

    it("targets the local REST port on a loopback mirror node whatever its configured port", async function () {
        const fake = new FakeHttpTransport().respondJson(200, { nodes: [] });

        await query().execute(track(fake, { mirror: "127.0.0.1:5600" }));

        expect(fake.requests[0].url).to.equal(
            "http://127.0.0.1:5551/api/v1/network/nodes?file.id=0.0.102&limit=25",
        );
    });

    it("draws every page and every retry from one total deadline", async function () {
        const fake = new FakeHttpTransport()
            .respondAfter(
                40,
                jsonResponse(200, {
                    nodes: [node(0)],
                    links: {
                        next: "/api/v1/network/nodes?limit=1&node.id=gt:0",
                    },
                }),
            )
            .respondAfter(40, errorResponse(503, "Unavailable"))
            .respondJson(200, { nodes: [node(1)] });
        // No per-attempt cap, so each request's deadline is the time left
        // in the call.
        const client = track(fake, { policy: { perAttemptTimeout: 0 } });

        const book = await query().execute(client, 5000);

        expect(book.nodeAddresses).to.have.length(2);
        expect(fake.requests).to.have.length(3);
        const deadlines = fake.requests.map((request) => request.deadline);
        expect(deadlines[0]).to.be.within(4900, 5000);
        expect(deadlines[1]).to.be.below(deadlines[0] - 30);
        expect(deadlines[2]).to.be.below(deadlines[1] - 30);
    });

    it("derives the base URL from the mirror node address and uses https off loopback", async function () {
        const fake = new FakeHttpTransport().respondJson(200, { nodes: [] });

        await query().execute(
            track(fake, { mirror: "mirror.example.com:443" }),
        );

        expect(fake.requests[0].url).to.equal(
            "https://mirror.example.com:443/api/v1/network/nodes?file.id=0.0.102&limit=25",
        );
    });
});
