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
});
