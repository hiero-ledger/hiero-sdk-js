import { AccountId } from "../../src/exports.js";
import { Client } from "../../src/index.js";
import MirrorNodeContractQuery from "../../src/query/MirrorNodeContractQuery.js";
import sinon from "sinon";

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

    describe("performMirrorNodeRequest scheme detection", function () {
        let originalFetch;
        let query;
        let fetchStub;

        beforeEach(function () {
            // Save original fetch (works in both Node.js and browser)
            originalFetch =
                typeof global !== "undefined" ? global.fetch : window.fetch;

            // Create a properly configured query
            query = new MirrorNodeContractQuery()
                .setContractId(CONTRACT_ID)
                .setSender(SENDER)
                .setFunction(FUNCTION_NAME);

            // Create fetch stub
            fetchStub = sinon.stub().resolves({
                ok: true,
                json: sinon.stub().resolves({
                    result: "0x1234567890abcdef",
                }),
            });

            // Set fetch stub in the appropriate global object
            if (typeof global !== "undefined") {
                global.fetch = fetchStub;
            } else {
                window.fetch = fetchStub;
            }
        });

        afterEach(function () {
            // Restore original fetch
            if (typeof global !== "undefined") {
                global.fetch = originalFetch;
            } else {
                window.fetch = originalFetch;
            }
        });

        it("should use correct secure HTTPS scheme for port 443", async function () {
            // Setup client with custom mirror network using HTTPS port 443
            const client = new Client();
            client.setMirrorNetwork(["api.example.com:443"]);

            // Call the method
            await query.performMirrorNodeRequest(client, {});

            // Verify fetch was called with HTTPS URL (port 443)
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.equal(
                "https://api.example.com:443/api/v1/contracts/call",
            );
        });

        it("should use HTTP scheme and port 8545 for localhost", async function () {
            // Setup client with custom mirror network using localhost and custom port
            const client = new Client();
            client.setMirrorNetwork(["localhost:5600"]);

            // Call the method
            await query.performMirrorNodeRequest(client, {});

            // Verify fetch was called with HTTP URL and port 8545 (localhost rewrites to 8545)
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.equal(
                "http://localhost:8545/api/v1/contracts/call",
            );
        });

        it("should use HTTP scheme and port 8545 for 127.0.0.1", async function () {
            // Setup client with custom mirror network using 127.0.0.1 and custom port
            const client = new Client();
            client.setMirrorNetwork(["127.0.0.1:5600"]);

            // Call the method
            await query.performMirrorNodeRequest(client, {});

            // Verify fetch was called with HTTP URL and port 8545 (127.0.0.1 rewrites to 8545)
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.equal(
                "http://127.0.0.1:8545/api/v1/contracts/call",
            );
        });

        it("should preserve original port for non-localhost addresses", async function () {
            // Setup client with non-localhost address
            const client = new Client();
            client.setMirrorNetwork(["api.example.com:5600"]);

            // Call the method
            await query.performMirrorNodeRequest(client, {});

            // Verify fetch was called with original port (no rewriting for non-localhost)
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.equal(
                "https://api.example.com:5600/api/v1/contracts/call",
            );
        });

        it("should preserve original port for non-localhost with HTTP port 80", async function () {
            // Setup client with non-localhost address and HTTP port
            const client = new Client();
            client.setMirrorNetwork(["api.example.com:80"]);

            // Call the method
            await query.performMirrorNodeRequest(client, {});

            // Verify fetch was called with original port (no rewriting for non-localhost)
            expect(fetchStub.calledOnce).to.be.true;
            expect(fetchStub.firstCall.args[0]).to.equal(
                "http://api.example.com:80/api/v1/contracts/call",
            );
        });

        it("should throw error when no mirror network is configured", async function () {
            // Setup client with no mirror network
            const client = new Client();
            client.setMirrorNetwork([]);

            // Should throw error because no mirror network is configured
            try {
                await query.performMirrorNodeRequest(client, {});
                throw new Error("Expected method to throw");
            } catch (error) {
                expect(error.message).to.equal(
                    "Client has no mirror network configured or no healthy mirror nodes are available",
                );
            }
        });
    });
});
