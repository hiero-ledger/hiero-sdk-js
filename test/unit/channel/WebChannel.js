import WebChannel from "../../../src/channel/WebChannel.js";
import GrpcStatus from "../../../src/grpc/GrpcStatus.js";
import {
    encodeRequest,
    decodeUnaryResponse,
} from "../../../src/channel/Channel.js";
import { CLPR_RPC_CASES } from "../utils/ClprTransport.js";

describe("WebChannel", function () {
    let originalFetch;

    beforeEach(function () {
        originalFetch = globalThis.fetch;
    });

    afterEach(function () {
        globalThis.fetch = originalFetch;
    });

    it.each(CLPR_RPC_CASES)(
        "routes $method through ClprService and decodes the response",
        async function ({
            method,
            requestType,
            responseType,
            request,
            response,
        }) {
            const calls = [];
            const address = "http://127.0.0.1:50211";
            const responseFrame = encodeRequest(
                responseType.encode(response).finish(),
            );

            globalThis.fetch = (url, init) => {
                calls.push({ url, init });
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    headers: new Headers({ "grpc-status": "0" }),
                    arrayBuffer: () => Promise.resolve(responseFrame),
                });
            };

            const channel = new WebChannel("127.0.0.1:50211", 5000);
            try {
                const service = channel.clpr;
                const result = await service[method](request);

                expect(calls.map(({ url }) => url)).to.deep.equal([
                    address,
                    `${address}/proto.ClprService/${method}`,
                ]);
                expect(calls[1].init.method).to.equal("POST");
                expect(decodeUnaryResponse(calls[1].init.body)).to.deep.equal(
                    requestType.encode(request).finish(),
                );
                expect(result).to.be.instanceOf(responseType);
                expect(responseType.encode(result).finish()).to.deep.equal(
                    responseType.encode(response).finish(),
                );
                expect(channel.clpr).to.equal(service);
            } finally {
                channel.close();
            }
        },
    );

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
