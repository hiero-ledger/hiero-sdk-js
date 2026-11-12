import { vi } from "vitest";
import {
    AccountId,
    ContractId,
    ContractInfoQuery,
    Client,
    Hbar,
    PrivateKey,
    Query,
    Timestamp,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("ContractInfoQuery", function () {
    describe("constructor and setters", function () {
        it("contractId defaults to null", function () {
            const query = new ContractInfoQuery();

            expect(query.contractId).to.be.null;
        });

        it("should set contractId from props", function () {
            const query = new ContractInfoQuery({
                contractId: new ContractId(0, 0, 123),
            });

            expect(query.contractId.toString()).to.equal("0.0.123");
        });

        it("should set contractId from a string", function () {
            const query = new ContractInfoQuery().setContractId("0.0.123");

            expect(query.contractId.toString()).to.equal("0.0.123");
        });

        it("should store a copy of the contract ID instance", function () {
            const contractId = new ContractId(0, 0, 123);
            const query = new ContractInfoQuery().setContractId(contractId);

            expect(query.contractId.toString()).to.equal(contractId.toString());
            expect(query.contractId).to.not.equal(contractId);
        });

        it("should be chainable", function () {
            const query = new ContractInfoQuery();

            expect(query.setContractId(new ContractId(0, 0, 123))).to.equal(
                query,
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("[to|from]Bytes()", function () {
            const contractId = new ContractId(10);

            const query = Query.fromBytes(
                new ContractInfoQuery().setContractId(contractId).toBytes(),
            );

            expect(query instanceof ContractInfoQuery).to.be.true;
            expect(query.contractId.toString()).to.equal(contractId.toString());
        });

        it("should deserialize without a contract ID", function () {
            const query = Query.fromBytes(new ContractInfoQuery().toBytes());

            expect(query).to.be.instanceOf(ContractInfoQuery);
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
            const query = new ContractInfoQuery().setContractId(
                checksummedContractId(),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip when the contract ID is unset", function () {
            expect(() =>
                new ContractInfoQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call smartContract.getContractInfo() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                smartContract: {
                    getContractInfo: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new ContractInfoQuery()._execute(channel, request),
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

            expect(await new ContractInfoQuery().getCost(client)).to.equal(
                cost,
            );
            expect(getCost).toHaveBeenCalledTimes(1);
            expect(getCost.mock.calls[0][0]).to.equal(client);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the contract get info header", function () {
            const header = {};
            const response = { contractGetInfo: { header } };

            expect(
                new ContractInfoQuery()._mapResponseHeader(response),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should map the protobuf response into a ContractInfo", async function () {
            const key = PrivateKey.generateED25519().publicKey;
            const response = {
                contractGetInfo: {
                    header: {},
                    contractInfo: {
                        contractID: new ContractId(0, 0, 123)._toProtobuf(),
                        accountID: new AccountId(0, 0, 123)._toProtobuf(),
                        bytecode: new Uint8Array([1, 2, 3]),
                        expirationTime: {
                            seconds: 10,
                            nanos: 0,
                        },
                        autoRenewPeriod: {
                            seconds: 7000000,
                        },
                        contractMemo: "contract memo",
                    },
                },
            };

            const info = await new ContractInfoQuery()._mapResponse(response);

            expect(info).to.be.instanceOf(Object);
            expect(info.contractId.toString()).to.equal("0.0.123");
        });
    });

    describe("_getLogId", function () {
        it("should use the payment transaction ID valid start when set", function () {
            const VALID_START = new Timestamp(1596210382, 0);
            const query = new ContractInfoQuery().setPaymentTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    VALID_START,
                ),
            );

            expect(query._getLogId()).to.equal(
                `ContractInfoQuery:${VALID_START.toString()}`,
            );
        });

        it("should fall back to the timestamp of the query", function () {
            const query = new ContractInfoQuery();

            expect(query._getLogId()).to.equal(
                `ContractInfoQuery:${query._timestamp}`,
            );
        });
    });
});
