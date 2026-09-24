// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import {
    Client,
    MirrorNodeAccountBalanceQuery,
    MirrorNodeTokenBalanceQuery,
    RegisteredNodeAddressBookQuery,
    MirrorNodeHttpConfig,
    MirrorNodeHttpRetryPolicy,
    HttpTransportError,
    HttpTransportErrorCode,
} from "../../src/index.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "./utils/FakeHttpTransport.js";

const BALANCES = {
    timestamp: "1.0",
    balances: [{ account: "0.0.123", balance: 42 }],
    links: { next: null },
};

/**
 * @param {string[]} [mirrors]
 * @returns {Client}
 */
function clientFor(mirrors = ["mirror.example.com:443"]) {
    const client = new Client();
    client.setMirrorNetwork(mirrors);
    return client;
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

describe("Client mirror node HTTP configuration", function () {
    /** @type {Client[]} */
    let clients = [];

    /**
     * @param {string[]} [mirrors]
     */
    function track(mirrors) {
        const client = clientFor(mirrors);
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

    it("never returns a null configuration, and the getter and setter agree", function () {
        const client = track();

        const config = client.getMirrorNodeHttpConfig();
        expect(config).to.be.instanceOf(MirrorNodeHttpConfig);
        expect(config.transport).to.be.null;
        expect(config.retryPolicy.equals(MirrorNodeHttpRetryPolicy.DEFAULT)).to
            .be.true;
        expect(client.mirrorNodeHttpConfig).to.equal(config);

        const explicit = new MirrorNodeHttpConfig({
            retryPolicy: { maxAttempts: 2 },
        });
        expect(client.setMirrorNodeHttpConfig(explicit)).to.equal(client);
        expect(client.getMirrorNodeHttpConfig()).to.equal(explicit);
    });

    it("set replaces rather than merges", function () {
        const client = track();
        client.setMirrorNodeHttpConfig({ retryPolicy: { maxAttempts: 2 } });
        client.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });

        expect(
            client.getMirrorNodeHttpConfig().retryPolicy.maxAttempts,
        ).to.equal(5);
    });

    it("rejects the reserved identity headers", function () {
        const client = track();
        for (const name of ["User-Agent", "X-User-Agent"]) {
            expect(
                () =>
                    client.setMirrorNodeHttpConfig({
                        requestHeaders: { [name]: "x" },
                    }),
                name,
            ).to.throw("is reserved");
        }
    });

    it("builds no transport until the first mirror REST call, then shares one", async function () {
        const client = track();
        /** @type {FakeHttpTransport[]} */
        const created = [];
        vi.spyOn(client, "_createDefaultHttpTransport").mockImplementation(
            () => {
                const fake = new FakeHttpTransport((request) =>
                    request.url.includes("/tokens")
                        ? jsonResponse(200, { tokens: [] })
                        : jsonResponse(200, BALANCES),
                );
                created.push(fake);
                return fake;
            },
        );

        expect(created).to.have.length(0);
        expect(client._ownedMirrorNodeHttpTransport).to.be.null;

        await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);
        await new MirrorNodeTokenBalanceQuery()
            .setAccountId("0.0.123")
            .setTokenId("0.0.5")
            .execute(client);

        expect(created).to.have.length(1);
        expect(created[0].requests).to.have.length(2);
        // The getter reports what was supplied, not what was resolved.
        expect(client.getMirrorNodeHttpConfig().transport).to.be.null;
    });

    it("uses an injected transport and never constructs the default", async function () {
        const client = track();
        const fake = new FakeHttpTransport().respondJson(200, BALANCES);
        const spy = vi.spyOn(client, "_createDefaultHttpTransport");
        client.setMirrorNodeHttpConfig({ transport: fake });

        const balance = await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(balance.hbars.toTinybars().toNumber()).to.equal(42);
        expect(spy).toHaveBeenCalledTimes(0);
        expect(fake.requests[0].url).to.equal(
            "https://mirror.example.com:443/api/v1/balances?account.id=0.0.123",
        );
    });

    it("resolves the policy field by field: query setter beats client beats default", async function () {
        const client = track();
        const fake = new FakeHttpTransport(() => errorResponse(503, "Down"));
        client.setMirrorNodeHttpConfig({
            transport: fake,
            retryPolicy: {
                maxAttempts: 2,
                perAttemptTimeout: 7000,
                initialBackoff: 1,
                maxBackoff: 1,
            },
        });

        const error = await caught(
            new RegisteredNodeAddressBookQuery()
                .setMaxAttempts(3)
                .execute(client),
        );

        expect(error.message).to.include("retries exhausted after 3 attempts");
        expect(fake.requests).to.have.length(3);
        for (const request of fake.requests) {
            expect(request.deadline).to.equal(7000);
        }
    });

    it("does not close an injected transport", function () {
        const client = track();
        const fake = new FakeHttpTransport();
        client.setMirrorNodeHttpConfig({ transport: fake });

        client.close();

        expect(fake.closed).to.be.false;
        expect(fake.closeCalls).to.have.length(0);
    });

    it("closes the transport it built with a 5 s grace period, and later calls fail fast", async function () {
        const client = track();
        const fake = new FakeHttpTransport(() => jsonResponse(200, BALANCES));
        vi.spyOn(client, "_createDefaultHttpTransport").mockReturnValue(fake);
        await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        client.close();

        expect(fake.closed).to.be.true;
        expect(fake.closeCalls).to.deep.equal([5000]);
        expect(client._ownedMirrorNodeHttpTransport).to.be.null;
        const error = await caught(
            new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client),
        );
        expect(error.message).to.include(
            HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
        );
    });

    it("close without a mirror REST call is a no-op", function () {
        expect(() => clientFor().close()).to.not.throw();
    });

    it("interrupts a backoff in progress when the client closes", async function () {
        const client = track();
        const fake = new FakeHttpTransport(() => errorResponse(503, "Down"));
        client.setMirrorNodeHttpConfig({
            transport: fake,
            retryPolicy: { initialBackoff: 100_000, maxBackoff: 100_000 },
        });
        vi.spyOn(Math, "random").mockReturnValue(0.5);

        const pending = new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);
        setTimeout(() => client.close(), 20);
        const error = await caught(pending);

        expect(error.message).to.include(
            HttpTransportErrorCode.CLIENT_CLOSED_ERROR,
        );
        expect(fake.requests).to.have.length(1);
    });

    it("chooses the base URL round-robin per call and pins it for every page", async function () {
        const client = track([
            "a.example.com:443",
            "b.example.com:443",
            "c.example.com:443",
        ]);
        const fake = new FakeHttpTransport((request) => {
            if (request.url.includes("registered-nodes")) {
                return request.url.includes("gt:1")
                    ? jsonResponse(200, {
                          registered_nodes: [],
                          links: { next: null },
                      })
                    : jsonResponse(200, {
                          registered_nodes: [],
                          links: {
                              next: "/api/v1/network/registered-nodes?limit=1&registerednode.id=gt:1",
                          },
                      });
            }
            return jsonResponse(200, BALANCES);
        });
        client.setMirrorNodeHttpConfig({ transport: fake });

        for (let i = 0; i < 3; i++) {
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client);
        }
        await new RegisteredNodeAddressBookQuery().setLimit(1).execute(client);

        const hosts = fake.requests.map(
            (request) => new URL(request.url).hostname,
        );
        // Three calls, three different nodes; the order the client holds the
        // nodes in is its own business.
        expect(new Set(hosts.slice(0, 3)).size).to.equal(3);
        // The fourth call wraps around, and both of its pages hit that node.
        expect(hosts[3]).to.equal(hosts[0]);
        expect(hosts[4]).to.equal(hosts[3]);
        expect(fake.requests[4].url).to.equal(
            `https://${hosts[4]}:443/api/v1/network/registered-nodes?limit=1&registerednode.id=gt:1`,
        );
    });

    it("inherits requestTimeout as the total deadline unless the policy or the call sets one", function () {
        const client = track();
        client.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });
        client.setRequestTimeout(5000);

        expect(
            client._mirrorNodeHttpClient().retryPolicy.totalDeadline,
        ).to.equal(5000);
        expect(client._mirrorNodeHttpClient().remainingTime).to.be.within(
            4900,
            5000,
        );
        expect(
            client._mirrorNodeHttpClient({ totalDeadline: 1000 }).retryPolicy
                .totalDeadline,
        ).to.equal(1000);
        expect(
            client._mirrorNodeHttpClient({ totalDeadline: 0 }).retryPolicy
                .totalDeadline,
        ).to.equal(5000);

        client.setMirrorNodeHttpConfig({
            transport: new FakeHttpTransport(),
            retryPolicy: { totalDeadline: 3000 },
        });
        expect(
            client._mirrorNodeHttpClient().retryPolicy.totalDeadline,
        ).to.equal(3000);
    });

    it("sends the caller headers on every mirror request", async function () {
        const client = track();
        const fake = new FakeHttpTransport().respondJson(200, BALANCES);
        client.setMirrorNodeHttpConfig({
            transport: fake,
            requestHeaders: { Authorization: "Bearer test" },
        });

        await new MirrorNodeAccountBalanceQuery()
            .setAccountId("0.0.123")
            .execute(client);

        expect(fake.requests[0].headers.authorization).to.equal("Bearer test");
        expect(fake.requests[0].headers.accept).to.equal("application/json");
    });

    it("surfaces the mirror node detail rather than the raw body", async function () {
        const client = track();
        client.setMirrorNodeHttpConfig({
            transport: new FakeHttpTransport().respond(
                errorResponse(400, "Invalid parameter: account.id"),
            ),
        });

        const error = await caught(
            new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client),
        );

        expect(error.message).to.include(
            "HTTP 400: Error: Invalid parameter: account.id",
        );
        expect(error.message).to.not.include("_status");
    });

    it("ignores the gRPC retry knobs on the client", function () {
        const client = track();
        client.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });
        client.setMaxAttempts(50).setMinBackoff(1).setMaxBackoff(1);

        const policy = client._mirrorNodeHttpClient().retryPolicy;
        expect(policy.maxAttempts).to.equal(5);
        expect(policy.initialBackoff).to.equal(250);
        expect(policy.maxBackoff).to.equal(8000);
    });

    it("uses the startup budget on a loopback mirror node unless a policy is set", function () {
        const local = track(["127.0.0.1:5551"]);
        local.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });
        let policy = local._mirrorNodeHttpClient().retryPolicy;
        expect(policy.maxAttempts).to.equal(15);
        expect(policy.totalDeadline).to.equal(90_000);
        expect(policy.perAttemptTimeout).to.equal(30_000);

        local.setMirrorNodeHttpConfig({
            transport: new FakeHttpTransport(),
            retryPolicy: { maxAttempts: 4 },
        });
        policy = local._mirrorNodeHttpClient().retryPolicy;
        expect(policy.maxAttempts).to.equal(4);
        expect(policy.totalDeadline).to.equal(local.requestTimeout);

        const hosted = track();
        hosted.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });
        policy = hosted._mirrorNodeHttpClient().retryPolicy;
        expect(policy.maxAttempts).to.equal(5);
        expect(policy.totalDeadline).to.equal(hosted.requestTimeout);
    });

    it("resolves the local port per endpoint family in one place", function () {
        const local = track(["127.0.0.1:5600"]);
        local.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });
        expect(
            local._mirrorNodeHttpClient({ family: "rest" }).baseUrl,
        ).to.equal("http://127.0.0.1:5551/api/v1");
        expect(
            local._mirrorNodeHttpClient({ family: "rest-java" }).baseUrl,
        ).to.equal("http://127.0.0.1:8084/api/v1");
        expect(
            local._mirrorNodeHttpClient({ family: "web3" }).baseUrl,
        ).to.equal("http://127.0.0.1:8545/api/v1");

        const hosted = track(["mirror.example.com:443"]);
        hosted.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });
        for (const family of ["rest", "rest-java", "web3"]) {
            expect(
                hosted._mirrorNodeHttpClient({ family }).baseUrl,
                family,
            ).to.equal("https://mirror.example.com:443/api/v1");
        }
    });

    it("rejects a mirror REST call when no mirror network is configured", async function () {
        const client = new Client();
        clients.push(client);
        client.setMirrorNodeHttpConfig({ transport: new FakeHttpTransport() });

        const error = await caught(
            new MirrorNodeAccountBalanceQuery()
                .setAccountId("0.0.123")
                .execute(client),
        );

        expect(error.message).to.include(
            "Client has no mirror network configured",
        );
    });

    it("exposes the transport error type for callers that match on it", function () {
        expect(
            new HttpTransportError(HttpTransportErrorCode.TIMEOUT_ERROR, "x")
                .retryable,
        ).to.be.true;
    });
});
