// SPDX-License-Identifier: Apache-2.0

import http from "http";
import https from "https";
import net from "net";
import zlib from "zlib";
import { getEventListeners } from "events";
import { vi } from "vitest";
import NodeHttpTransport from "../../../src/http/NodeHttpTransport.js";
import HttpRequest from "../../../src/http/HttpRequest.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../../src/http/HttpTransportError.js";
import { SDK_NAME, SDK_VERSION } from "../../../src/version.js";

/**
 * A throwaway self-signed certificate for `localhost` / `127.0.0.1`, used
 * only to stand up an untrusted HTTPS server in this suite.
 */
const SELF_SIGNED_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjPA8mE2mln+1A
vGCs3cgspWXEDPOg3oEXI6OS3NAoF13yeixO5ow8FKEp8rm4kyDCiWgV911XTWDs
wV9pRRP3FdVTfWOXpTNvVfHlaMIwGAtSiF4x3E2ejcXK+1EOZYNB/SXCCuojBSDe
B52ztqTVMtOoPH8Fiolmd2JdnhCC+vstWIlygog7aarc6Cyv5yALST34IgSkxeWh
2M/35MEx5dlK5KWeqh3PK6Xa7UVpOkFCmNETAug4UiuIpy20Xc/Ee/i41WhtPpUh
/6CHTbE8Z5nmgfzTIhcGDBOkj9RnSnWNJJEGa5MZGD4crAj/jYJlCgFwwzmMuVmA
vX4Wo1hFAgMBAAECggEAONExZqvwJH2/q75GGjWSNPQXMX/elzqLjV3S1E42yBWm
Fj3vSUFXQ5xcoojBm1ze1MfWKnsxCq+80nvWdYJdWi5H1Ck7bq/KcPDl41es6+ea
nU4pF0ra25r2Y1pJ0uyDnQb7ywhYifsBfzcAberfgfQQlykDf47Cl59rZjGcBrK+
KeXJZTOky5CE+IxTYZG5duVnxSSZUjBAsU+qEJo5E+qLdHOma5lPqawf5II5/vTX
yQN9XWxbITfpbmonUkuUfkGm+br/cMPQZvvoPFwPirhtudfQpghhSxCPkfLi+YTt
dnQAURnyOARkYxsJ+7Nq6qixnX3HO0QsSyAb7lwZWwKBgQDUxXh6MXn6ZFTSgeS9
J24RCjYbej5cXhBa5Rl2MlO+6Tv5tjiKfUDqcAfILvXKj06zy49Z1t9x3gCjZnPE
nhiZmK5CkmI6u5ddv055TLSheXJBdIWezquWyACeiTNokZdwufCMdkXESRIxjKRM
p0a8vy0cXjwaqatjsoZHIZ1vxwKBgQDEZh0mrlKJr38XyKidDtfdenUxvKKftdUm
tKQQlPEu1dLCD2v8+R1BdLkiazH7dUBVzx5bjkophfqSwH9gwUL/X7jvrXYfWUj6
2qaF7RwEWF+2S5OffC15GwQBFultEf4nMHqJUrJJURuv3CQ0uwSXmfuS5Opf7+e/
SKF9gdSPkwKBgBa1uQU50K4kFVWenZ5+3eWdtGa8ZnmPZKl++HfAKWYgGNGvXFuT
wOEE8h+wu3VSVHEmUfeh0pmhu2m1Xrfms/N482iRnUBtk1tjNuoFgOYXQ1WvLS/l
GTVvxXkmZcFMgOB8SCuF2C56KiH1w/eWhxtQQG1dtYaXA38Rp/lhoh8zAoGBAKr3
IUU81sjYptAzcuRVuYApS7+iMAbLqONquK9emJ1msXMRLbYnvVnvnAHkQrxdE0Yf
aJPWx6Rh5wC85aV6VzIrR7gMzhj4Blmo4PEQuSTnMVpla/qXhJY5+EBii4zQ7ud6
ghDslhrQqkNqZXIpoxO9jYwQDh65nombVkkFLd5VAoGAepZfTTLpZ+EMox0SxmDe
jSDE1QxPqhzmzaO+n9QAvNFfUnMoeREIkb5fumkgyRUTIMOD4Nh189Y51fUiGm9S
dwc5Ar7L5qT2++jJgMwAft0Hro8C9wOVZ/O88ssGFsbX91Kb0y2lj+d6qp8yR7UC
K36IQtIY8VunHQ0t5pb9RHo=
-----END PRIVATE KEY-----`;

const SELF_SIGNED_CERT = `-----BEGIN CERTIFICATE-----
MIIDJzCCAg+gAwIBAgIUdbuzKUytmg2KuESQ/i37YX++VuEwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MCAXDTI2MDkyNDEwMTkzOFoYDzIxMjYw
ODMxMTAxOTM4WjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQCjPA8mE2mln+1AvGCs3cgspWXEDPOg3oEXI6OS3NAo
F13yeixO5ow8FKEp8rm4kyDCiWgV911XTWDswV9pRRP3FdVTfWOXpTNvVfHlaMIw
GAtSiF4x3E2ejcXK+1EOZYNB/SXCCuojBSDeB52ztqTVMtOoPH8Fiolmd2JdnhCC
+vstWIlygog7aarc6Cyv5yALST34IgSkxeWh2M/35MEx5dlK5KWeqh3PK6Xa7UVp
OkFCmNETAug4UiuIpy20Xc/Ee/i41WhtPpUh/6CHTbE8Z5nmgfzTIhcGDBOkj9Rn
SnWNJJEGa5MZGD4crAj/jYJlCgFwwzmMuVmAvX4Wo1hFAgMBAAGjbzBtMB0GA1Ud
DgQWBBRR09Mp+w7XIKznPcbnLXIcSJUqHjAfBgNVHSMEGDAWgBRR09Mp+w7XIKzn
PcbnLXIcSJUqHjAPBgNVHRMBAf8EBTADAQH/MBoGA1UdEQQTMBGCCWxvY2FsaG9z
dIcEfwAAATANBgkqhkiG9w0BAQsFAAOCAQEAHiIoZ5b5gzm6l+4nHJ32ZqRvL1gk
6dCE1JIebop5DzF63kmSAGxzSlz+ienPNjDy+tKZUJPQKmKOS9JDaNDuBmSBAavn
2R/lt5rdbdJQTmNUhbu5xGheRzbJccDKqe/KXe1rr4T8GLCmW/zQOCx/ikXeexQn
ugERXZ2ZY163OHKn7Ga1A8zvENZhuVK4dzpXNEMV9wyhHre72cvwbPIiJVXDA3fH
WeyX34nXHMvwR3+GVl8D88h2xxmTVgkPbVJTLufF9pN/tGqcI9jxorJHA90pzJ16
tXHAWJo77PAASeAdAIxDsFQyNbe6qno9/4EjrDGbVvJzjVOkmUAvI/u2qA==
-----END CERTIFICATE-----`;

/** @type {Array<{close: (cb?: () => void) => unknown}>} */
let servers = [];
/** @type {NodeHttpTransport[]} */
let transports = [];
/** @type {Set<import("net").Socket>} */
const serverSockets = new Set();

/**
 * @template {import("net").Server} T
 * @param {T} server
 * @returns {Promise<{server: T, port: number, origin: string}>}
 */
function listen(server) {
    servers.push(server);
    // `server.close()` waits for every connection to end, and a server that
    // never reads (the silent TCP server below) never notices the client's
    // FIN. Track the sockets so cleanup can destroy them.
    server.on("connection", (socket) => {
        serverSockets.add(socket);
        socket.on("close", () => serverSockets.delete(socket));
    });
    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => {
            const address = /** @type {import("net").AddressInfo} */ (
                server.address()
            );
            resolve({
                server,
                port: address.port,
                origin: `http://127.0.0.1:${address.port}`,
            });
        });
    });
}

/**
 * @param {(req: http.IncomingMessage, res: http.ServerResponse) => void} handler
 */
function httpServer(handler) {
    return listen(http.createServer(handler));
}

/**
 * @param {ConstructorParameters<typeof import("../../../src/http/HttpTransportConfiguration.js").default>[0]} [configuration]
 * @returns {NodeHttpTransport}
 */
function transport(configuration) {
    const created = NodeHttpTransport.create(configuration);
    transports.push(created);
    return created;
}

/**
 * @param {string} url
 * @param {object} [props]
 * @returns {HttpRequest}
 */
function request(url, props = {}) {
    return new HttpRequest({ method: "GET", url, ...props });
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

/**
 * Poll until `condition` holds, for at most `timeoutMs`.
 *
 * @param {() => boolean} condition
 * @param {number} [timeoutMs]
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeoutMs = 5000) {
    const started = Date.now();
    while (!condition()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error("condition not met in time");
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

/**
 * `http.Agent` reads `HTTP_PROXY` and friends from a `proxyEnv` option
 * since Node 24.5 and 22.19.
 *
 * @returns {boolean}
 */
function agentSupportsProxyEnv() {
    const [major, minor] = process.versions.node.split(".").map(Number);
    return (
        major > 24 ||
        (major === 24 && minor >= 5) ||
        (major === 22 && minor >= 19)
    );
}

/**
 * @param {import("http").IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
function readBody(req) {
    return new Promise((resolve) => {
        /** @type {Buffer[]} */
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
    });
}

describe("NodeHttpTransport", function () {
    afterEach(async function () {
        for (const t of transports) {
            await t.close(0);
        }
        transports = [];
        for (const socket of serverSockets) {
            socket.destroy();
        }
        serverSockets.clear();
        await Promise.all(
            servers.map(
                (server) =>
                    new Promise((resolve) =>
                        server.close(() => resolve(undefined)),
                    ),
            ),
        );
        servers = [];
    });

    it("returns a 404 as a response rather than failing", async function () {
        const { origin } = await httpServer((req, res) => {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end('{"_status":{"messages":[{"message":"Not found"}]}}');
        });

        const response = await transport().roundTrip(
            request(`${origin}/api/v1/accounts/0.0.3`),
        );

        expect(response.statusCode).to.equal(404);
        expect(response.header("content-type")).to.equal("application/json");
        expect(response.body.toString()).to.include("Not found");
    });

    it("sends the identity header, the content type and the body, and no user-agent", async function () {
        /** @type {http.IncomingHttpHeaders} */
        let seen = {};
        let body = Buffer.alloc(0);
        const { origin } = await httpServer(async (req, res) => {
            seen = req.headers;
            body = await readBody(req);
            res.end("ok");
        });

        const sent = Uint8Array.of(1, 2, 3, 4);
        await transport({
            defaultHeaders: { "User-Agent": "custom", "X-Env": "test" },
        }).roundTrip(
            request(`${origin}/network/fees`, {
                method: "POST",
                body: sent,
                contentType: "application/protobuf",
                headers: { Accept: "application/json" },
            }),
        );

        expect(seen["x-user-agent"]).to.equal(`${SDK_NAME}/${SDK_VERSION}`);
        expect(seen["user-agent"]).to.be.undefined;
        expect(seen["x-env"]).to.equal("test");
        expect(seen["accept"]).to.equal("application/json");
        expect(seen["content-type"]).to.equal("application/protobuf");
        expect(seen["content-length"]).to.equal("4");
        expect([...body]).to.deep.equal([1, 2, 3, 4]);
    });

    it.skipIf(!agentSupportsProxyEnv())(
        "routes through the environment proxy when NODE_USE_ENV_PROXY is set, as Node's own agents do",
        async function () {
            // A forward proxy that answers every absolute-URI request itself.
            const { port } = await httpServer((req, res) => {
                res.setHeader("Content-Type", "text/plain");
                res.end(`via-proxy:${req.url}`);
            });
            const saved = {
                NODE_USE_ENV_PROXY: process.env.NODE_USE_ENV_PROXY,
                HTTP_PROXY: process.env.HTTP_PROXY,
                http_proxy: process.env.http_proxy,
                NO_PROXY: process.env.NO_PROXY,
                no_proxy: process.env.no_proxy,
            };
            process.env.NODE_USE_ENV_PROXY = "1";
            process.env.HTTP_PROXY = `http://127.0.0.1:${port}`;
            delete process.env.http_proxy;
            delete process.env.NO_PROXY;
            delete process.env.no_proxy;
            try {
                const response = await transport().roundTrip(
                    request("http://does-not-exist.invalid/x"),
                );
                expect(response.statusCode).to.equal(200);
                expect(response.body.toString()).to.equal(
                    "via-proxy:http://does-not-exist.invalid/x",
                );
            } finally {
                for (const [name, value] of Object.entries(saved)) {
                    if (value === undefined) {
                        delete process.env[name];
                    } else {
                        process.env[name] = value;
                    }
                }
            }
        },
    );

    it("fails with unknown-host-error and is not retryable", async function () {
        const error = await caught(
            transport().roundTrip(request("http://does-not-exist.invalid/x")),
        );

        expect(error).to.be.instanceOf(HttpTransportError);
        expect(error.code).to.equal(HttpTransportErrorCode.UNKNOWN_HOST_ERROR);
        expect(error.retryable).to.be.false;
    });

    it("fails with tls-error on an untrusted certificate", async function () {
        const { port } = await listen(
            https.createServer(
                { key: SELF_SIGNED_KEY, cert: SELF_SIGNED_CERT },
                (req, res) => res.end("ok"),
            ),
        );

        const error = await caught(
            transport().roundTrip(request(`https://127.0.0.1:${port}/x`)),
        );

        expect(error.code).to.equal(HttpTransportErrorCode.TLS_ERROR);
        expect(error.retryable).to.be.false;
    });

    it("fails with connection-error on a closed port and is retryable", async function () {
        const { port, server } = await httpServer((req, res) => res.end());
        await new Promise((resolve) => server.close(() => resolve(undefined)));
        servers = servers.filter((s) => s !== server);

        const error = await caught(
            transport().roundTrip(request(`http://127.0.0.1:${port}/x`)),
        );

        expect(error.code).to.equal(HttpTransportErrorCode.CONNECTION_ERROR);
        expect(error.retryable).to.be.true;
        expect(error.message).to.include("ECONNREFUSED");
    });

    it("honours connectTimeout when the handshake never completes", async function () {
        // Accepts the TCP connection and never speaks TLS.
        const { port } = await listen(net.createServer(() => {}));

        const started = Date.now();
        const error = await caught(
            transport({ connectTimeout: 100 }).roundTrip(
                request(`https://127.0.0.1:${port}/x`, { deadline: 10000 }),
            ),
        );

        expect(error.code).to.equal(HttpTransportErrorCode.TIMEOUT_ERROR);
        expect(error.message).to.include("connect timeout");
        expect(Date.now() - started).to.be.below(2000);
    });

    it("stops after maxRedirects hops and returns the last 3xx", async function () {
        let requests = 0;
        const { origin } = await httpServer((req, res) => {
            requests += 1;
            res.writeHead(302, { Location: "/again" });
            res.end();
        });

        const response = await transport().roundTrip(
            request(`${origin}/start`),
        );

        expect(response.statusCode).to.equal(302);
        expect(requests).to.equal(6);
    });

    it("drops caller headers on a cross-origin redirect and keeps them on a same-origin one", async function () {
        /** @type {http.IncomingHttpHeaders[]} */
        const seenB = [];
        const b = await httpServer((req, res) => {
            seenB.push(req.headers);
            res.end("b");
        });
        /** @type {http.IncomingHttpHeaders[]} */
        const seenA = [];
        const a = await httpServer((req, res) => {
            seenA.push(req.headers);
            if (req.url === "/start") {
                res.writeHead(302, { Location: "/same" });
                res.end();
            } else if (req.url === "/same") {
                res.writeHead(307, { Location: `${b.origin}/target` });
                res.end();
            } else {
                res.end("a");
            }
        });

        const response = await transport().roundTrip(
            request(`${a.origin}/start`, {
                headers: { Authorization: "Bearer test", "X-Custom": "1" },
            }),
        );

        expect(response.statusCode).to.equal(200);
        expect(response.body.toString()).to.equal("b");
        expect(seenA).to.have.length(2);
        expect(seenA[1].authorization).to.equal("Bearer test");
        expect(seenA[1]["x-custom"]).to.equal("1");
        expect(seenB).to.have.length(1);
        expect(seenB[0].authorization).to.be.undefined;
        expect(seenB[0]["x-custom"]).to.be.undefined;
        expect(seenB[0]["x-user-agent"]).to.equal(`${SDK_NAME}/${SDK_VERSION}`);
    });

    it("turns a 303 into a bodyless GET and keeps a POST body across a 307", async function () {
        /** @type {Array<{method: string | undefined, body: string}>} */
        const seen = [];
        const { origin } = await httpServer(async (req, res) => {
            seen.push({
                method: req.method,
                body: (await readBody(req)).toString(),
            });
            if (req.url === "/see-other") {
                res.writeHead(303, { Location: "/final" });
                res.end();
            } else if (req.url === "/temporary") {
                res.writeHead(307, { Location: "/final" });
                res.end();
            } else {
                res.end("done");
            }
        });
        const t = transport();
        const body = new TextEncoder().encode("payload");

        await t.roundTrip(
            request(`${origin}/see-other`, {
                method: "POST",
                body,
                contentType: "text/plain",
            }),
        );
        await t.roundTrip(
            request(`${origin}/temporary`, {
                method: "POST",
                body,
                contentType: "text/plain",
            }),
        );

        expect(seen.map((s) => s.method)).to.deep.equal([
            "POST",
            "GET",
            "POST",
            "POST",
        ]);
        expect(seen[1].body).to.equal("");
        expect(seen[3].body).to.equal("payload");
    });

    it("fails fast after close without opening a connection, and close is idempotent", async function () {
        let requests = 0;
        const { origin } = await httpServer((req, res) => {
            requests += 1;
            res.end();
        });
        const t = transport();
        await t.close(100);
        await t.close(100);

        const error = await caught(t.roundTrip(request(`${origin}/x`)));

        expect(t.closed).to.be.true;
        expect(error.code).to.equal(HttpTransportErrorCode.CLIENT_CLOSED_ERROR);
        expect(requests).to.equal(0);
    });

    it("drains an exchange in flight when the close timeout allows, without holding the process open", async function () {
        const { origin } = await httpServer((req, res) => {
            setTimeout(() => res.end("late"), 150);
        });
        const t = transport();
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

        const pending = t.roundTrip(request(`${origin}/slow`));
        await waitFor(() => t.inFlight === 1);
        const started = Date.now();
        await t.close(5000);
        const closedAfter = Date.now() - started;

        const response = await pending;
        expect(response.body.toString()).to.equal("late");
        expect(t.inFlight).to.equal(0);
        // The drain won the race; the grace timer must not keep the event
        // loop alive for the rest of the 5 s.
        expect(closedAfter).to.be.below(2000);
        const graceTimer = setTimeoutSpy.mock.results
            .filter((_, i) => setTimeoutSpy.mock.calls[i][1] === 5000)
            .map((result) => result.value)
            .pop();
        expect(graceTimer).to.not.be.undefined;
        expect(graceTimer.hasRef()).to.be.false;
        setTimeoutSpy.mockRestore();
    });

    it("lets a call in flight follow a redirect during the drain", async function () {
        const { origin } = await httpServer((req, res) => {
            if (req.url === "/start") {
                setTimeout(() => {
                    res.writeHead(302, { Location: "/final" });
                    res.end();
                }, 100);
            } else {
                setTimeout(() => res.end("final"), 100);
            }
        });
        const t = transport();

        const pending = t.roundTrip(request(`${origin}/start`));
        await waitFor(() => t.inFlight === 1);
        const closing = t.close(5000);

        const response = await pending;
        expect(response.statusCode).to.equal(200);
        expect(response.body.toString()).to.equal("final");
        await closing;
        expect(t.closed).to.be.true;
    });

    it("destroys the connection pool on close", async function () {
        const { origin } = await httpServer((req, res) => res.end("ok"));
        const t = transport();
        const httpAgent = /** @type {import("http").Agent} */ (
            /** @type {any} */ (t)._httpAgent
        );
        const destroyed = vi.spyOn(httpAgent, "destroy");

        await t.roundTrip(request(`${origin}/x`));
        // The keep-alive socket returns to the pool once the response ends.
        await waitFor(
            () => Object.values(httpAgent.freeSockets).flat().length === 1,
        );

        await t.close(0);

        expect(destroyed).toHaveBeenCalledTimes(1);
        // The agent forgets a destroyed socket on its `close` event.
        await waitFor(
            () =>
                Object.values(httpAgent.freeSockets).flat().length === 0 &&
                Object.values(httpAgent.sockets).flat().length === 0,
        );
    });

    it("aborts an exchange in flight once the close timeout elapses", async function () {
        /** @type {NodeJS.Timeout[]} */
        const timers = [];
        const { origin } = await httpServer((req, res) => {
            const timer = setTimeout(() => res.end("late"), 5000);
            timers.push(timer);
            res.on("close", () => clearTimeout(timer));
        });
        const t = transport();

        const pending = t.roundTrip(request(`${origin}/slow`));
        await waitFor(() => t.inFlight === 1);
        const started = Date.now();
        await t.close(50);
        const error = await caught(pending);

        expect(error.code).to.equal(HttpTransportErrorCode.CLIENT_CLOSED_ERROR);
        expect(Date.now() - started).to.be.below(1500);
        for (const timer of timers) clearTimeout(timer);
    });

    it("fails with cancelled-error when the caller aborts, releases the connection and its listener", async function () {
        let closedByClient = 0;
        const { origin } = await httpServer((req, res) => {
            const timer = setTimeout(() => res.end("late"), 5000);
            res.on("close", () => {
                clearTimeout(timer);
                if (!res.writableFinished) closedByClient += 1;
            });
        });
        const controller = new AbortController();
        const t = transport();

        const pending = t.roundTrip(
            request(`${origin}/slow`),
            controller.signal,
        );
        setTimeout(() => controller.abort(), 20);
        const error = await caught(pending);
        await waitFor(() => closedByClient === 1);

        expect(error.code).to.equal(HttpTransportErrorCode.CANCELLED_ERROR);
        expect(error.retryable).to.be.false;
        expect(closedByClient).to.equal(1);
        expect(getEventListeners(controller.signal, "abort")).to.have.length(0);
    });

    it("accumulates no listeners on a signal reused across exchanges", async function () {
        const { origin } = await httpServer((req, res) => res.end("ok"));
        const controller = new AbortController();
        const t = transport();

        for (let i = 0; i < 5; i++) {
            await t.roundTrip(request(`${origin}/${i}`), controller.signal);
        }

        expect(getEventListeners(controller.signal, "abort")).to.have.length(0);
    });

    it("keeps concurrent exchanges apart", async function () {
        const { origin } = await httpServer((req, res) => {
            // Answer with the numeric index from the path, after a random
            // delay, so a mixed-up response is detectable.
            const index = parseInt((req.url ?? "").split("/").pop() ?? "", 10);
            setTimeout(
                () => {
                    res.setHeader("Content-Type", "text/plain");
                    res.end(String(index));
                },
                10 + Math.random() * 30,
            );
        });
        const t = transport();

        const responses = await Promise.all(
            Array.from({ length: 10 }, (_, i) =>
                t.roundTrip(request(`${origin}/n/${i}`)),
            ),
        );

        responses.forEach((response, i) => {
            expect(response.body.toString()).to.equal(String(i));
        });
    });

    it("bounds the whole exchange with the deadline, body included, and releases the connection", async function () {
        let released = false;
        const { origin } = await httpServer((req, res) => {
            res.writeHead(200, { "Content-Type": "text/plain" });
            const drip = setInterval(() => res.write("x"), 50);
            res.on("close", () => {
                clearInterval(drip);
                released = true;
            });
        });

        const started = Date.now();
        const error = await caught(
            transport().roundTrip(request(`${origin}/drip`, { deadline: 300 })),
        );
        await waitFor(() => released);

        expect(error.code).to.equal(HttpTransportErrorCode.TIMEOUT_ERROR);
        expect(error.retryable).to.be.true;
        expect(Date.now() - started).to.be.below(2000);
        expect(released).to.be.true;
    });

    it("lowercases header names and keeps repeated values", async function () {
        const { origin } = await httpServer((req, res) => {
            res.setHeader("Retry-After", "7");
            res.setHeader("X-Multi", ["a", "b"]);
            res.end();
        });

        const response = await transport().roundTrip(request(`${origin}/x`));

        expect(response.headers["retry-after"]).to.deep.equal(["7"]);
        expect(response.headers["x-multi"]).to.deep.equal(["a", "b"]);
        expect(response.header("Retry-After")).to.equal("7");
    });

    it("decodes a compressed body", async function () {
        const { origin } = await httpServer((req, res) => {
            res.writeHead(200, { "Content-Encoding": "gzip" });
            res.end(zlib.gzipSync('{"compressed":true}'));
        });

        const response = await transport().roundTrip(request(`${origin}/x`));

        expect(response.body.toString()).to.equal('{"compressed":true}');
    });

    it("fails one chunk past maxResponseBytes without reading the remainder", async function () {
        let chunksWritten = 0;
        const total = 64;
        const chunk = Buffer.alloc(64 * 1024, 120);
        const { origin } = await httpServer((req, res) => {
            res.writeHead(200);
            const timer = setInterval(() => {
                if (chunksWritten >= total) {
                    clearInterval(timer);
                    res.end();
                    return;
                }
                chunksWritten += 1;
                res.write(chunk);
            }, 5);
            res.on("close", () => clearInterval(timer));
        });

        const error = await caught(
            transport({ maxResponseBytes: 100 * 1024 }).roundTrip(
                request(`${origin}/big`),
            ),
        );

        expect(error.code).to.equal(
            HttpTransportErrorCode.RESPONSE_TOO_LARGE_ERROR,
        );
        expect(error.retryable).to.be.false;
        expect(chunksWritten).to.be.below(total);
    });

    it("maps a malformed response and a dropped connection to connection-error", async function () {
        const garbage = await listen(
            net.createServer((socket) => {
                socket.end("HTTP/9.9 garbage\r\n\r\n");
            }),
        );
        const dropped = await listen(
            net.createServer((socket) => {
                socket.destroy();
            }),
        );

        const garbageError = await caught(
            transport().roundTrip(
                request(`http://127.0.0.1:${garbage.port}/x`),
            ),
        );
        const droppedError = await caught(
            transport().roundTrip(
                request(`http://127.0.0.1:${dropped.port}/x`),
            ),
        );

        expect(garbageError.code).to.equal(
            HttpTransportErrorCode.CONNECTION_ERROR,
        );
        expect(droppedError.code).to.equal(
            HttpTransportErrorCode.CONNECTION_ERROR,
        );
    });

    it("exposes its configuration", function () {
        const t = transport({ maxRedirects: 1 });
        expect(t.configuration.maxRedirects).to.equal(1);
        expect(t.closed).to.be.false;
        expect(t.inFlight).to.equal(0);
    });
});
