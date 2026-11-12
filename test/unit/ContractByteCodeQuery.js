import { vi } from "vitest";
import {
    AccountId,
    ContractByteCodeQuery,
    ContractId,
    Client,
    Hbar,
    PrivateKey,
    Query,
    Timestamp,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("ContractByteCodeQuery", function () {
    describe("constructor and setters", function () {
        it("contractId defaults to null", function () {
            const query = new ContractByteCodeQuery();

            expect(query.contractId).to.be.null;
        });

        it("should set contractId from props", function () {
            const query = new ContractByteCodeQuery({
                contractId: new ContractId(0, 0, 123),
            });

            expect(query.contractId.toString()).to.equal("0.0.123");
        });

        it("should set contractId from a string", function () {
            const query = new ContractByteCodeQuery().setContractId("0.0.123");

            expect(query.contractId.toString()).to.equal("0.0.123");
        });

        it("should store a copy of the contract ID instance", function () {
            const contractId = new ContractId(0, 0, 123);
            const query = new ContractByteCodeQuery().setContractId(contractId);

            expect(query.contractId.toString()).to.equal(contractId.toString());
            expect(query.contractId).to.not.equal(contractId);
        });

        it("should be chainable", function () {
            const query = new ContractByteCodeQuery();

            expect(query.setContractId(new ContractId(0, 0, 123))).to.equal(
                query,
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("[to|from]Bytes()", function () {
            const contractId = new ContractId(10);

            const query = Query.fromBytes(
                new ContractByteCodeQuery().setContractId(contractId).toBytes(),
            );

            expect(query instanceof ContractByteCodeQuery).to.be.true;
            expect(query.contractId.toString()).to.equal(contractId.toString());
        });

        it("should deserialize without a contract ID", function () {
            const query = Query.fromBytes(
                new ContractByteCodeQuery().toBytes(),
            );

            expect(query).to.be.instanceOf(ContractByteCodeQuery);
            expect(query.contractId).to.be.null;
        });
    });

    describe("_validateChecksums", function () {
        let mainnet, testnet;

        beforeEach(function () {
            mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
            testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
        });

        afterEach(function () {
            mainnet.close();
            testnet.close();
        });

        /**
         * @returns {ContractId}
         */
        function checksummedContractId() {
            const contractId = new ContractId(0, 0, 123);
            contractId._checksum = "vfmkw";
            return contractId;
        }

        it("should check the contract ID checksum against the client's network", function () {
            const query = new ContractByteCodeQuery().setContractId(
                checksummedContractId(),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip when the contract ID is unset", function () {
            expect(() =>
                new ContractByteCodeQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call smartContract.contractGetBytecode() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                smartContract: {
                    contractGetBytecode: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new ContractByteCodeQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
        });
    });

    describe("getCost", function () {
        afterEach(function () {
            vi.restoreAllMocks();
        });

        it("should return the cost reported by the base query", async function () {
            const cost = new Hbar(1);
            const client = {};
            const getCost = vi
                .spyOn(Query.prototype, "getCost")
                .mockResolvedValue(cost);

            expect(await new ContractByteCodeQuery().getCost(client)).to.equal(
                cost,
            );
            expect(getCost).toHaveBeenCalledTimes(1);
            expect(getCost.mock.calls[0][0]).to.equal(client);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the contract get bytecode response header", function () {
            const header = {};
            const response = {
                contractGetBytecodeResponse: { header },
            };

            expect(
                new ContractByteCodeQuery()._mapResponseHeader(response),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should map the protobuf response into a Uint8Array", async function () {
            const response = {
                contractGetBytecodeResponse: {
                    header: {},
                    bytecode: new Uint8Array([1, 2, 3, 4, 5]),
                },
            };

            const bytecode = await new ContractByteCodeQuery()._mapResponse(
                response,
            );

            expect(bytecode).to.deep.equal(new Uint8Array([1, 2, 3, 4, 5]));
        });

        it("should return empty Uint8Array when bytecode is null", async function () {
            const response = {
                contractGetBytecodeResponse: {
                    header: {},
                    bytecode: null,
                },
            };

            const bytecode = await new ContractByteCodeQuery()._mapResponse(
                response,
            );

            expect(bytecode).to.deep.equal(new Uint8Array());
        });
    });

    describe("_getLogId", function () {
        it("should use the payment transaction ID valid start when set", function () {
            const VALID_START = new Timestamp(1596210382, 0);
            const query = new ContractByteCodeQuery().setPaymentTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    VALID_START,
                ),
            );

            expect(query._getLogId()).to.equal(
                `ContractByteCodeQuery:${VALID_START.toString()}`,
            );
        });

        it("should fall back to the timestamp of the query", function () {
            const query = new ContractByteCodeQuery();

            expect(query._getLogId()).to.equal(
                `ContractByteCodeQuery:${query._timestamp}`,
            );
        });
    });
});
