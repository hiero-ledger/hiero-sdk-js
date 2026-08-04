import WebChannel from "../../../src/channel/WebChannel.js";
import GrpcStatus from "../../../src/grpc/GrpcStatus.js";

describe("WebChannel", function () {
    let originalFetch;

    beforeEach(function () {
        originalFetch = globalThis.fetch;
    });

    afterEach(function () {
        globalThis.fetch = originalFetch;
    });

    it("times out a unary request the proxy never answers", async function () {
        // The health check answers, then the unary request hangs forever.
        let call = 0;
        globalThis.fetch = (_url, init) => {
            call += 1;
            if (call === 1) {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ "grpc-status": "0" }),
                });
            }
            // Hang until the caller's deadline aborts us, like a real fetch.
            return new Promise((_resolve, reject) => {
                init.signal.addEventListener("abort", () =>
                    reject(init.signal.reason),
                );
            });
        };

        const channel = new WebChannel("127.0.0.1:50211", 500);
        const client = channel._createUnaryClient("CryptoService");

        const error = await new Promise((resolve) => {
            client(
                { name: "createAccount" },
                new Uint8Array([1, 2, 3]),
                (err) => resolve(err),
            );
        });

        expect(error).to.not.be.null;
        expect(error.status).to.deep.equal(GrpcStatus.Timeout);
    });

    describe("ping", function () {
        it("resolves when the proxy answers with gRPC headers", async function () {
            globalThis.fetch = () =>
                Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ "grpc-status": "0" }),
                });

            const channel = new WebChannel("127.0.0.1:50211", 500);

            await channel.ping();
        });

        it("does not request any service endpoint", async function () {
            /** @type {string[]} */
            const urls = [];

            globalThis.fetch = (url) => {
                urls.push(url);
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ "grpc-status": "0" }),
                });
            };

            const channel = new WebChannel("127.0.0.1:50211", 500);

            await channel.ping();

            expect(urls).to.deep.equal(["http://127.0.0.1:50211"]);
        });

        it("rejects when the node is unreachable", async function () {
            globalThis.fetch = () => Promise.reject(new TypeError("failed"));

            const channel = new WebChannel("127.0.0.1:50211", 500);

            let error = null;
            try {
                await channel.ping();
            } catch (err) {
                error = err;
            }

            expect(error).to.not.be.null;
            expect(error.status).to.deep.equal(GrpcStatus.Unavailable);
        });

        it("ignores the cached readiness of a previously healthy channel", async function () {
            let healthy = true;

            globalThis.fetch = () =>
                healthy
                    ? Promise.resolve({
                          ok: true,
                          status: 200,
                          headers: new Headers({ "grpc-status": "0" }),
                      })
                    : Promise.reject(new TypeError("failed"));

            const channel = new WebChannel("127.0.0.1:50211", 500);

            await channel.ping();
            expect(channel._isReady).to.be.true;

            // The node goes away after the channel has been used successfully
            healthy = false;

            let error = null;
            try {
                await channel.ping();
            } catch (err) {
                error = err;
            }

            expect(error).to.not.be.null;
            expect(error.status).to.deep.equal(GrpcStatus.Unavailable);
        });
    });
});
