// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import AddressBookQuery from "../../src/network/AddressBookQuery.js";
import AddressBookQueryWeb from "../../src/network/AddressBookQueryWeb.js";

/**
 * Both address book queries override `execute()` and never run
 * `Executable._setupExecution`, so they must fall back to `client.maxBackoff`
 * themselves. On `main` the request-level `_maxBackoff` was hardcoded to
 * 8000; with it now `null`, `Math.min(250 * 2 ** n, null)` would be `0` and
 * every retry would fire immediately. These tests pin the delay to the
 * client value.
 */

/**
 * @param {number} maxBackoff
 * @param {(onData: Function, onError: Function, onEnd: Function) => void} [stream]
 */
function stubClient(maxBackoff, stream = () => {}) {
    return {
        _logger: null,
        _mirrorNetwork: {
            getNextMirrorNode: () => ({
                address: { address: "127.0.0.1", port: 5551 },
                getChannel: () => ({
                    makeServerStreamRequest: (
                        _service,
                        _method,
                        _request,
                        onData,
                        onError,
                        onEnd,
                    ) => stream(onData, onError, onEnd),
                }),
            }),
        },
        _network: { ledgerId: null },
        maxAttempts: 3,
        maxBackoff,
        isClientShutDown: false,
    };
}

function okResponse() {
    const body = {
        nodes: [
            {
                node_id: 0,
                node_account_id: "0.0.3",
                node_cert_hash: "0xabc",
                public_key: "302a300506032b6570032100aa",
                description: "node 0",
                stake: 1,
                grpc_proxy_endpoint: {
                    domain_name: "node.example.com",
                    port: 443,
                },
                service_endpoints: [],
            },
        ],
    };
    return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
    };
}

function failedResponse() {
    return {
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(""),
    };
}

/**
 * Delays passed to `setTimeout` by the retry loop. The abort-signal timers
 * used by `fetch` in Node do not go through the global `setTimeout`.
 * @param {import("vitest").MockInstance} spy
 * @returns {number[]}
 */
function retryDelays(spy) {
    return spy.mock.calls.map((call) => call[1]);
}

describe("address book query backoff", function () {
    /** @type {import("vitest").MockInstance} */
    let setTimeoutSpy;

    beforeEach(function () {
        setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    });

    afterEach(function () {
        setTimeoutSpy.mockRestore();
        vi.unstubAllGlobals();
    });

    describe("AddressBookQueryWeb", function () {
        it("uses client.maxBackoff when the request sets none", async function () {
            vi.stubGlobal(
                "fetch",
                vi
                    .fn()
                    .mockResolvedValueOnce(failedResponse())
                    .mockResolvedValueOnce(okResponse()),
            );

            const book = await new AddressBookQueryWeb().execute(
                stubClient(100),
            );

            expect(book.nodeAddresses).to.have.length(1);
            const delays = retryDelays(setTimeoutSpy);
            expect(delays).to.have.length(1);
            expect(delays[0]).to.be.above(0);
            expect(delays[0]).to.be.at.most(100);
        });

        it("prefers a request-level maxBackoff over the client's", async function () {
            vi.stubGlobal(
                "fetch",
                vi
                    .fn()
                    .mockResolvedValueOnce(failedResponse())
                    .mockResolvedValueOnce(okResponse()),
            );

            await new AddressBookQueryWeb()
                .setMaxBackoff(40)
                .execute(stubClient(100));

            expect(retryDelays(setTimeoutSpy)).to.deep.equal([40]);
        });
    });

    describe("AddressBookQuery", function () {
        it("uses client.maxBackoff when the request sets none", async function () {
            let calls = 0;
            const client = stubClient(100, (_onData, onError, onEnd) => {
                calls += 1;
                if (calls === 1) {
                    onError(new Error("stream reset"));
                } else {
                    onEnd();
                }
            });

            const book = await new AddressBookQuery().execute(client);

            expect(calls).to.equal(2);
            expect(book.nodeAddresses).to.have.length(0);
            const delays = retryDelays(setTimeoutSpy);
            expect(delays).to.have.length(1);
            expect(delays[0]).to.be.above(0);
            expect(delays[0]).to.be.at.most(100);
        });

        it("prefers a request-level maxBackoff over the client's", async function () {
            let calls = 0;
            const client = stubClient(100, (_onData, onError, onEnd) => {
                calls += 1;
                if (calls === 1) {
                    onError(new Error("stream reset"));
                } else {
                    onEnd();
                }
            });

            await new AddressBookQuery().setMaxBackoff(40).execute(client);

            expect(retryDelays(setTimeoutSpy)).to.deep.equal([40]);
        });
    });
});
