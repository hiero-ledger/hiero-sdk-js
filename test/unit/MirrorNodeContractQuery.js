// SPDX-License-Identifier: Apache-2.0

import { AccountId } from "../../src/exports.js";
import { Client } from "../../src/index.js";
import MirrorNodeContractQuery from "../../src/query/MirrorNodeContractQuery.js";
import MirrorNodeContractCallQuery from "../../src/query/MirrorNodeContractCallQuery.js";
import MirrorNodeContractEstimateQuery from "../../src/query/MirrorNodeContractEstimateQuery.js";
import ContractFunctionParameters from "../../src/contract/ContractFunctionParameters.js";
import HttpTransportError, {
    HttpTransportErrorCode,
} from "../../src/http/HttpTransportError.js";
import FakeHttpTransport, {
    errorResponse,
    jsonResponse,
} from "./utils/FakeHttpTransport.js";

describe("MirrorNodeContractQuery", function () {
    const SENDER = new AccountId(1);
    const CONTRACT_EVM_ADDRESS = "0000000000000000000000000000000000000001";
    const CONTRACT_ID = new AccountId(1);
    const FUNCTION_NAME = "getMessage";
    const FUNCTION_SELECTOR = new Uint8Array([206, 109, 65, 222]); // getMessage()
    const VALUE = 100;
    const GAS_LIMIT = 100;
    const GAS_PRICE = 100;
    const BLOCK_NUMBER = 100;

    it("should set query parameters", function () {
        const query = new MirrorNodeContractQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setFunction(FUNCTION_NAME)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE)
            .setContractId(CONTRACT_ID);

        expect(query.sender).to.be.instanceOf(AccountId);
        expect(query.contractEvmAddress).to.be.equal(CONTRACT_EVM_ADDRESS);
        expect(query.callData).to.be.deep.equal(FUNCTION_SELECTOR);
        expect(query.value).to.be.equal(VALUE);
        expect(query.gasLimit).to.be.equal(GAS_LIMIT);
        expect(query.gasPrice).to.be.equal(GAS_PRICE);
        expect(query.blockNumber).to.be.equal(BLOCK_NUMBER);
        expect(query.contractId).to.be.equal(CONTRACT_ID);
    });

    it("should set raw function parameters via setFunctionParameters", function () {
        const query = new MirrorNodeContractQuery().setFunctionParameters(
            FUNCTION_SELECTOR,
        );
        expect(query.callData).to.deep.equal(FUNCTION_SELECTOR);
    });

    it("should throw an error when no contract id sent", async function () {
        const query = new MirrorNodeContractQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setFunction(FUNCTION_NAME)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE);

        let err = false;
        try {
            query.contractEvmAddress;
        } catch (e) {
            err = e.message.includes("Contract ID is not set");
        }
        expect(err).to.be.true;
    });

    it("should not be able to perform MN request without contract id", async function () {
        const query = new MirrorNodeContractQuery()
            .setBlockNumber(BLOCK_NUMBER)
            .setSender(SENDER)
            .setFunction(FUNCTION_NAME)
            .setValue(VALUE)
            .setGasLimit(GAS_LIMIT)
            .setGasPrice(GAS_PRICE);

        let err = false;
        try {
            await query.performMirrorNodeRequest("", "");
        } catch (e) {
            err = e.message.includes("Contract ID is not set");
        }
        expect(err).to.be.true;
    });

    describe("performMirrorNodeRequest", function () {
        /** @type {Client[]} */
        let clients = [];

        /**
         * @param {string} mirror
         * @param {FakeHttpTransport} fake
         * @returns {Client}
         */
        function clientWith(mirror, fake) {
            const client = new Client();
            client.setMirrorNetwork([mirror]);
            client.setMirrorNodeHttpConfig({
                transport: fake,
                retryPolicy: { initialBackoff: 1, maxBackoff: 1 },
            });
            clients.push(client);
            return client;
        }

        function query() {
            return new MirrorNodeContractQuery()
                .setContractId(CONTRACT_ID)
                .setSender(SENDER)
                .setFunction(FUNCTION_NAME);
        }

        afterEach(function () {
            for (const client of clients) {
                client.close();
            }
            clients = [];
        });

        it("posts the JSON payload to the web3 contracts endpoint", async function () {
            const fake = new FakeHttpTransport().respondJson(200, {
                result: "0x1234567890abcdef",
            });
            const client = clientWith("api.example.com:443", fake);

            const response = await query().performMirrorNodeRequest(client, {
                data: "0x",
                estimate: false,
            });

            expect(response.result).to.equal("0x1234567890abcdef");
            expect(fake.requests).to.have.length(1);
            expect(fake.requests[0].method).to.equal("POST");
            expect(fake.requests[0].url).to.equal(
                "https://api.example.com:443/api/v1/contracts/call",
            );
            expect(fake.requests[0].contentType).to.equal("application/json");
            expect(
                JSON.parse(new TextDecoder().decode(fake.requests[0].body)),
            ).to.deep.equal({ data: "0x", estimate: false });
        });

        it("uses HTTP and port 8545 for localhost and 127.0.0.1", async function () {
            for (const host of ["localhost", "127.0.0.1"]) {
                const fake = new FakeHttpTransport().respondJson(200, {
                    result: "0x",
                });
                const client = clientWith(`${host}:5600`, fake);

                await query().performMirrorNodeRequest(client, {});

                expect(fake.requests[0].url, host).to.equal(
                    `http://${host}:8545/api/v1/contracts/call`,
                );
            }
        });

        it("preserves the scheme and port of a hosted mirror node", async function () {
            for (const [mirror, expected] of [
                ["api.example.com:5600", "https://api.example.com:5600"],
                ["api.example.com:80", "http://api.example.com:80"],
            ]) {
                const fake = new FakeHttpTransport().respondJson(200, {
                    result: "0x",
                });
                const client = clientWith(mirror, fake);

                await query().performMirrorNodeRequest(client, {});

                expect(fake.requests[0].url, mirror).to.equal(
                    `${expected}/api/v1/contracts/call`,
                );
            }
        });

        it("retries a 503 and surfaces a 400 with the mirror node detail", async function () {
            const retried = new FakeHttpTransport()
                .respond(errorResponse(503, "Unavailable"))
                .respondJson(200, { result: "0x01" });
            const response = await query().performMirrorNodeRequest(
                clientWith("api.example.com:443", retried),
                {},
            );
            expect(response.result).to.equal("0x01");
            expect(retried.requests).to.have.length(2);

            const rejected = new FakeHttpTransport().respond(
                errorResponse(400, "Invalid contract"),
            );
            let error = null;
            try {
                await query().performMirrorNodeRequest(
                    clientWith("api.example.com:443", rejected),
                    {},
                );
            } catch (err) {
                error = err;
            }
            expect(error.message).to.equal(
                "Failed to query https://api.example.com:443/api/v1/contracts/call: HTTP 400: Error: Invalid contract",
            );
            expect(rejected.requests).to.have.length(1);
        });

        it("wraps a transport failure and keeps it as the cause", async function () {
            const fake = new FakeHttpTransport().fail(
                new HttpTransportError(
                    HttpTransportErrorCode.TLS_ERROR,
                    "self signed certificate",
                ),
            );

            let error = null;
            try {
                await query().performMirrorNodeRequest(
                    clientWith("api.example.com:443", fake),
                    {},
                );
            } catch (err) {
                error = err;
            }

            expect(error.message).to.equal(
                "Failed to query https://api.example.com:443/api/v1/contracts/call: tls-error: self signed certificate",
            );
            expect(error.cause.code).to.equal(HttpTransportErrorCode.TLS_ERROR);
            expect(fake.requests).to.have.length(1);
        });

        it("bounds the call and the estimate by the given requestTimeout", async function () {
            const fake = new FakeHttpTransport(() =>
                jsonResponse(200, { result: "0x2a" }),
            );
            const client = clientWith("api.example.com:443", fake);
            const params = new ContractFunctionParameters();

            const result = await new MirrorNodeContractCallQuery()
                .setContractId(CONTRACT_ID)
                .setSender(SENDER)
                .setFunction(FUNCTION_NAME, params)
                .execute(client, 2500);
            const gas = await new MirrorNodeContractEstimateQuery()
                .setContractId(CONTRACT_ID)
                .setSender(SENDER)
                .setFunction(FUNCTION_NAME, params)
                .execute(client, 1500);

            expect(result).to.equal("0x2a");
            expect(gas).to.equal(42);
            expect(fake.requests[0].deadline).to.be.within(2400, 2500);
            expect(fake.requests[1].deadline).to.be.within(1400, 1500);
            expect(
                JSON.parse(new TextDecoder().decode(fake.requests[1].body))
                    .estimate,
            ).to.be.true;
        });

        it("should throw error when no mirror network is configured", async function () {
            const client = new Client();
            clients.push(client);
            client.setMirrorNetwork([]);
            client.setMirrorNodeHttpConfig({
                transport: new FakeHttpTransport(),
            });

            try {
                await query().performMirrorNodeRequest(client, {});
                throw new Error("Expected method to throw");
            } catch (error) {
                expect(error.message).to.equal(
                    "Client has no mirror network configured or no healthy mirror nodes are available",
                );
            }
        });
    });
});
