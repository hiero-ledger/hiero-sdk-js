// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import * as HieroProto from "@hiero-ledger/proto";
import { AccountId, Client, FileId } from "../../src/index.js";
import AddressBookQuery from "../../src/network/AddressBookQuery.js";
import AddressBookQueryWeb from "../../src/network/AddressBookQueryWeb.js";
import FakeHttpTransport, { errorResponse } from "./utils/FakeHttpTransport.js";

/**
 * Both address book queries override `execute()` and never run
 * `Executable._setupExecution`, so neither may rely on it for its backoff.
 * The gRPC `AddressBookQuery` falls back to `client.maxBackoff`; on `main`
 * the request-level `_maxBackoff` was hardcoded to 8000, and with it now
 * `null`, `Math.min(250 * 2 ** n, null)` would be `0` and every retry would
 * fire immediately. `AddressBookQueryWeb` goes through the mirror node HTTP
 * retry policy instead, whose `maxBackoff` caps a jittered wait.
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
        /**
         * @param {object} policy
         */
        function webClient(policy) {
            const client = new Client();
            client.setMirrorNetwork(["127.0.0.1:5551"]);
            client.setMirrorNodeHttpConfig({
                transport: new FakeHttpTransport()
                    .respond(errorResponse(503, "Unavailable"))
                    .respondJson(200, { nodes: [] }),
                retryPolicy: policy,
            });
            return client;
        }

        it("caps the jittered wait by the policy maxBackoff", async function () {
            const client = webClient({
                initialBackoff: 100000,
                maxBackoff: 100,
            });

            const book = await new AddressBookQueryWeb().execute(client);
            client.close();

            expect(book.nodeAddresses).to.have.length(0);
            const delays = retryDelays(setTimeoutSpy);
            expect(delays).to.have.length(1);
            expect(delays[0]).to.be.at.least(0);
            expect(delays[0]).to.be.below(100);
        });

        it("prefers a request-level maxBackoff over the policy's", async function () {
            const client = webClient({
                initialBackoff: 100000,
                maxBackoff: 100000,
            });

            await new AddressBookQueryWeb().setMaxBackoff(40).execute(client);
            client.close();

            const delays = retryDelays(setTimeoutSpy);
            expect(delays).to.have.length(1);
            expect(delays[0]).to.be.below(40);
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

describe("AddressBookQuery", function () {
    describe("constructor", function () {
        it("should default fileId and limit to null", function () {
            const query = new AddressBookQuery();

            expect(query.fileId).to.be.null;
            expect(query.limit).to.be.null;
        });

        it("should set the fields given in props", function () {
            const query = new AddressBookQuery({
                fileId: new FileId(0, 0, 102),
                limit: 5,
            });

            expect(query.fileId.toString()).to.equal("0.0.102");
            expect(query.limit).to.equal(5);
        });

        it("should accept a string fileId in props", function () {
            const query = new AddressBookQuery({ fileId: "0.0.102" });

            expect(query.fileId.toString()).to.equal("0.0.102");
        });
    });

    describe("setFileId", function () {
        it("should accept an instance or a string", function () {
            expect(
                new AddressBookQuery()
                    .setFileId(new FileId(0, 0, 102))
                    .fileId.toString(),
            ).to.equal("0.0.102");
            expect(
                new AddressBookQuery().setFileId("0.0.101").fileId.toString(),
            ).to.equal("0.0.101");
        });

        it("should store a copy of the instance", function () {
            const fileId = new FileId(0, 0, 102);

            expect(
                new AddressBookQuery().setFileId(fileId).fileId,
            ).to.not.equal(fileId);
        });

        it("should be chainable", function () {
            const query = new AddressBookQuery();

            expect(query.setFileId("0.0.102")).to.equal(query);
        });
    });

    describe("setLimit", function () {
        it("should set the limit and be chainable", function () {
            const query = new AddressBookQuery();

            expect(query.setLimit(5)).to.equal(query);
            expect(query.limit).to.equal(5);
        });
    });

    describe("setMaxAttempts", function () {
        it("should stop retrying after the attempts set", async function () {
            let calls = 0;
            const client = stubClient(100, (_onData, onError) => {
                calls += 1;
                onError(new Error("stream reset"));
            });
            const query = new AddressBookQuery();

            expect(query.setMaxAttempts(0)).to.equal(query);
            await expect(query.execute(client)).rejects.toThrow(
                "failed to query address book",
            );
            expect(calls).to.equal(1);
        });
    });

    describe("execute", function () {
        it("should collect the streamed node addresses and count down the limit", async function () {
            const nodeAddress = (num) =>
                HieroProto.proto.NodeAddress.encode({
                    nodeId: num,
                    nodeAccountId: new AccountId(0, 0, num)._toProtobuf(),
                    serviceEndpoint: [
                        {
                            ipAddressV4: Uint8Array.of(127, 0, 0, 1),
                            port: 50211,
                        },
                    ],
                }).finish();
            const client = stubClient(100, (onData, _onError, onEnd) => {
                onData(nodeAddress(3));
                onData(nodeAddress(4));
                onEnd();
            });
            const query = new AddressBookQuery()
                .setFileId("0.0.102")
                .setLimit(5);

            const book = await query.execute(client);

            expect(
                book.nodeAddresses.map((address) =>
                    address.accountId.toString(),
                ),
            ).to.deep.equal(["0.0.3", "0.0.4"]);
            expect(query.limit).to.equal(3);
        });
    });
});
