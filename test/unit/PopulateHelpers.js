// SPDX-License-Identifier: Apache-2.0

import { vi } from "vitest";
import { AccountId, ContractId, Client } from "../../src/index.js";
import EvmAddress from "../../src/EvmAddress.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "./utils/FakeHttpTransport.js";

const EVM_ADDRESS = "123f681646d4a755815f9cb19e1acc8565a0c2ac";
const BASE_URL = "https://mirror.example.com:443/api/v1";

/**
 * The populate helpers wait 3 s for the mirror node to catch up before
 * reading; run that wait on fake timers.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withoutTheGracePeriod(fn) {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
        const pending = fn();
        // The rejection, if any, lands while the clock advances; keep it
        // handled until it is awaited below.
        pending.catch(() => {});
        await vi.advanceTimersByTimeAsync(3000);
        return await pending;
    } finally {
        vi.useRealTimers();
    }
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

describe("mirror node populate helpers", function () {
    /** @type {FakeHttpTransport} */
    let fake;
    /** @type {Client} */
    let client;

    beforeEach(function () {
        fake = new FakeHttpTransport();
        client = new Client();
        client.setMirrorNetwork(["mirror.example.com:443"]);
        client.setMirrorNodeHttpConfig({ transport: fake });
    });

    afterEach(function () {
        client.close();
    });

    describe("AccountId.populateAccountNum", function () {
        it("surfaces a non-2xx status with the mirror node detail as the cause", async function () {
            fake.respond(errorResponse(404, "Not found"));
            const accountId = new AccountId(
                0,
                0,
                0,
                undefined,
                EvmAddress.fromString(EVM_ADDRESS),
            );

            const error = await caught(
                withoutTheGracePeriod(() =>
                    accountId.populateAccountNum(client),
                ),
            );

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/accounts/${EVM_ADDRESS}: HTTP 404: Error: Not found`,
            );
            expect(error.cause.message).to.equal("HTTP 404: Error: Not found");
            expect(accountId.num.toString()).to.equal("0");
        });

        it("rejects a body without an account", async function () {
            fake.respondJson(200, { evm_address: EVM_ADDRESS });
            const accountId = new AccountId(
                0,
                0,
                0,
                undefined,
                EvmAddress.fromString(EVM_ADDRESS),
            );

            const error = await caught(
                withoutTheGracePeriod(() =>
                    accountId.populateAccountNum(client),
                ),
            );

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/accounts/${EVM_ADDRESS}: response has no account`,
            );
        });
    });

    describe("AccountId.populateAccountEvmAddress", function () {
        it("surfaces a non-2xx status with the mirror node detail as the cause", async function () {
            fake.respond(errorResponse(400, "Invalid parameter: id"));
            const accountId = new AccountId(12345);

            const error = await caught(
                withoutTheGracePeriod(() =>
                    accountId.populateAccountEvmAddress(client),
                ),
            );

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/accounts/12345: HTTP 400: Error: Invalid parameter: id`,
            );
            expect(error.cause.message).to.equal(
                "HTTP 400: Error: Invalid parameter: id",
            );
            expect(accountId.evmAddress).to.be.null;
        });

        it("keeps the adapter's verdict as the cause when the budget runs out", async function () {
            fake.respond(errorResponse(503, "Unavailable"));
            client.setMirrorNodeHttpConfig({
                transport: fake,
                retryPolicy: { maxAttempts: 1 },
            });
            const accountId = new AccountId(12345);

            const error = await caught(
                withoutTheGracePeriod(() =>
                    accountId.populateAccountEvmAddress(client),
                ),
            );

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/accounts/12345: retries exhausted after 1 attempts. Last error: HTTP 503: Error: Unavailable`,
            );
            expect(error.cause.code).to.equal("retries-exhausted-error");
            expect(error.cause.response.statusCode).to.equal(503);
        });

        it("rejects a body without an evm_address", async function () {
            fake.respondJson(200, { account: "0.0.12345" });
            const accountId = new AccountId(12345);

            const error = await caught(
                withoutTheGracePeriod(() =>
                    accountId.populateAccountEvmAddress(client),
                ),
            );

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/accounts/12345: response has no evm_address`,
            );
        });
    });

    describe("ContractId.populateAccountNum", function () {
        it("populates the num from the mirror node's contract_id", async function () {
            fake.respondJson(200, {
                contract_id: "0.0.777",
                evm_address: `0x${EVM_ADDRESS}`,
            });
            const contractId = ContractId.fromEvmAddress(0, 0, EVM_ADDRESS);

            const populated = await contractId.populateAccountNum(client);

            expect(populated).to.equal(contractId);
            expect(contractId.num.toString()).to.equal("777");
            expect(fake.requests).to.have.length(1);
            expect(fake.requests[0].url).to.equal(
                `${BASE_URL}/contracts/${EVM_ADDRESS}`,
            );
            expect(fake.requests[0].method).to.equal("GET");
        });

        it("surfaces a non-2xx status with the mirror node detail as the cause", async function () {
            fake.respond(errorResponse(404, "Not found"));
            const contractId = ContractId.fromEvmAddress(0, 0, EVM_ADDRESS);

            const error = await caught(contractId.populateAccountNum(client));

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/contracts/${EVM_ADDRESS}: HTTP 404: Error: Not found`,
            );
            expect(error.cause).to.be.instanceOf(Error);
        });

        it("rejects a body without a contract_id", async function () {
            fake.respondJson(200, { evm_address: `0x${EVM_ADDRESS}` });
            const contractId = ContractId.fromEvmAddress(0, 0, EVM_ADDRESS);

            const error = await caught(contractId.populateAccountNum(client));

            expect(error.message).to.equal(
                `Failed to query ${BASE_URL}/contracts/${EVM_ADDRESS}: response has no contract_id`,
            );
        });
    });
});
