import sinon from "sinon";
import Long from "long";
import * as HieroProto from "@hiero-ledger/proto";
import {
    AccountId,
    ContractCallQuery,
    ContractFunctionParameters,
    ContractFunctionResult,
    ContractId,
    Hbar,
    PrecheckStatusError,
    Query,
    Status,
    Timestamp,
    TransactionId,
} from "../../src/exports.js";
import { Client } from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import MirrorNodeContractEstimateQuery from "../../src/query/MirrorNodeContractEstimateQuery.js";

describe("ContractCallQuery", function () {
    const CONTRACT_ID = new ContractId(0, 0, 5133653);
    const NODE_ID = new AccountId(0, 0, 3);
    // The stubbed MirrorNodeContractEstimateQuery.execute never touches it.
    const CLIENT = {};

    afterEach(function () {
        sinon.restore();
    });

    /**
     * @returns {ContractCallQuery}
     */
    function withPaymentTransactionId() {
        return new ContractCallQuery().setPaymentTransactionId(
            TransactionId.withValidStart(
                new AccountId(0, 0, 1001),
                new Timestamp(1, 0),
            ),
        );
    }

    /**
     * @param {boolean} includeFunctionResult
     * @returns {HieroProto.proto.IResponse}
     */
    function callResponse(includeFunctionResult) {
        return {
            contractCallLocal: {
                header: {
                    nodeTransactionPrecheckCode:
                        HieroProto.proto.ResponseCodeEnum
                            .CONTRACT_REVERT_EXECUTED,
                },
                functionResult: includeFunctionResult
                    ? {
                          contractID: CONTRACT_ID._toProtobuf(),
                          contractCallResult: new Uint8Array([1, 2, 3]),
                          gasUsed: Long.fromNumber(100),
                      }
                    : null,
            },
        };
    }

    it("estimates gas via the mirror node when gas is not set", async function () {
        const executeStub = sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(25136);

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve");

        await query._estimateGasIfNotSet(CLIENT);

        expect(executeStub.calledOnce).to.be.true;
        // 25136 * 1.2 buffer, rounded up
        expect(query.gas.toNumber()).to.equal(Math.ceil(25136 * 1.2));
    });

    it("does not call the mirror node when gas is already set", async function () {
        const executeStub = sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(25136);

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve")
            .setGas(23474);

        await query._estimateGasIfNotSet(CLIENT);

        expect(executeStub.called).to.be.false;
        expect(query.gas.toNumber()).to.equal(23474);
    });

    it("does not call the mirror node when contract ID is not set", async function () {
        const executeStub = sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(25136);

        const query = new ContractCallQuery().setFunction("retrieve");

        await query._estimateGasIfNotSet(CLIENT);

        expect(executeStub.called).to.be.false;
        expect(query.gas).to.be.null;
    });

    it("forwards contract ID, call data, and sender to the estimate query", async function () {
        let captured;
        sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .callsFake(function () {
                captured = this;
                return Promise.resolve(25136);
            });

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve")
            .setSenderAccountId("0.0.1545");

        await query._estimateGasIfNotSet(CLIENT);

        expect(captured.contractId.toString()).to.equal(CONTRACT_ID.toString());
        expect(captured.callData).to.deep.equal(query.functionParameters);
        expect(captured.sender.toString()).to.equal("0.0.1545");
    });

    it("throws a clear error when mirror node estimation fails", async function () {
        sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .rejects(new Error("HTTP 404: Not found"));

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve");

        let message = "";
        try {
            await query._estimateGasIfNotSet(CLIENT);
        } catch (e) {
            message = e.message;
        }
        expect(message).to.include("setGas()");
        expect(message).to.include("HTTP 404: Not found");
        expect(query.gas).to.be.null;
    });

    it("throws a clear error when the mirror node returns an invalid estimate", async function () {
        sinon
            .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
            .resolves(NaN);

        const query = new ContractCallQuery()
            .setContractId(CONTRACT_ID)
            .setFunction("retrieve");

        let message = "";
        try {
            await query._estimateGasIfNotSet(CLIENT);
        } catch (e) {
            message = e.message;
        }
        expect(message).to.include("setGas()");
        expect(query.gas).to.be.null;
    });

    describe("constructor and setters", function () {
        it("defaults every property to null", function () {
            const query = new ContractCallQuery();

            expect(query.contractId).to.be.null;
            expect(query.gas).to.be.null;
            expect(query.senderAccountId).to.be.null;
            expect(query.functionParameters).to.be.null;
            expect(query._maxResultSize).to.be.null;
        });

        it("should set every property from props", function () {
            const parameters = new ContractFunctionParameters().addUint256(1);
            const query = new ContractCallQuery({
                contractId: "0.0.123",
                gas: 100000,
                functionParameters: { name: "retrieve", parameters },
                maxResultSize: 2048,
                senderAccountId: "0.0.1545",
            });

            expect(query.contractId.toString()).to.equal("0.0.123");
            expect(query.gas.toNumber()).to.equal(100000);
            expect(query.functionParameters).to.deep.equal(
                parameters._build("retrieve"),
            );
            expect(query._maxResultSize.toNumber()).to.equal(2048);
            expect(query.senderAccountId.toString()).to.equal("0.0.1545");
        });

        it("should set function parameters from a byte array prop", function () {
            const query = new ContractCallQuery({
                functionParameters: new Uint8Array([1, 2, 3, 4]),
            });

            expect(query.functionParameters).to.deep.equal(
                new Uint8Array([1, 2, 3, 4]),
            );
        });

        it("should clone the contract ID passed to setContractId()", function () {
            const contractId = new ContractId(0, 0, 123);
            const query = new ContractCallQuery().setContractId(contractId);

            expect(query.contractId.toString()).to.equal("0.0.123");
            expect(query.contractId).to.not.equal(contractId);
        });

        it("should accept a Long for setGas()", function () {
            const query = new ContractCallQuery().setGas(Long.fromNumber(1000));

            expect(query.gas.toNumber()).to.equal(1000);
        });

        it("should accept an AccountId for setSenderAccountId()", function () {
            const senderAccountId = new AccountId(0, 0, 1545);
            const query = new ContractCallQuery().setSenderAccountId(
                senderAccountId,
            );

            expect(query.senderAccountId).to.equal(senderAccountId);
        });

        it("should be chainable", function () {
            const query = new ContractCallQuery();

            expect(query.setContractId(CONTRACT_ID)).to.equal(query);
            expect(query.setGas(100000)).to.equal(query);
            expect(query.setSenderAccountId("0.0.1545")).to.equal(query);
            expect(
                query.setFunctionParameters(new Uint8Array([1, 2, 3, 4])),
            ).to.equal(query);
            expect(query.setFunction("retrieve")).to.equal(query);
            expect(query.setMaxResultSize(2048)).to.equal(query);
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should round trip every property", function () {
            const query = new ContractCallQuery()
                .setContractId(CONTRACT_ID)
                .setGas(100000)
                .setFunctionParameters(new Uint8Array([1, 2, 3, 4]))
                .setMaxResultSize(2048);

            const restored = Query.fromBytes(query.toBytes());

            expect(restored).to.be.instanceOf(ContractCallQuery);
            expect(restored.contractId.toString()).to.equal(
                CONTRACT_ID.toString(),
            );
            expect(restored.gas.toNumber()).to.equal(100000);
            expect(restored.functionParameters).to.deep.equal(
                new Uint8Array([1, 2, 3, 4]),
            );
            expect(restored._maxResultSize.toNumber()).to.equal(2048);
        });

        it("should deserialize without any properties", function () {
            const restored = Query.fromBytes(new ContractCallQuery().toBytes());

            expect(restored).to.be.instanceOf(ContractCallQuery);
            expect(restored.contractId).to.be.null;
            expect(restored.functionParameters.length).to.equal(0);
            expect(restored.senderAccountId).to.be.null;
        });
    });

    describe("_beforeExecute", function () {
        it("should estimate the gas, then delegate to the base query", async function () {
            const executeStub = sinon
                .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
                .resolves(1000);
            const beforeExecute = sinon
                .stub(Query.prototype, "_beforeExecute")
                .resolves();

            const query = new ContractCallQuery()
                .setContractId(CONTRACT_ID)
                .setFunction("retrieve");

            await query._beforeExecute(CLIENT);

            expect(executeStub.calledOnce).to.be.true;
            expect(query.gas.toNumber()).to.equal(1200);
            expect(beforeExecute.calledOnceWith(CLIENT)).to.be.true;
        });

        it("should not estimate the gas when it is already set", async function () {
            const executeStub = sinon
                .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
                .resolves(1000);
            const beforeExecute = sinon
                .stub(Query.prototype, "_beforeExecute")
                .resolves();

            const query = new ContractCallQuery()
                .setContractId(CONTRACT_ID)
                .setFunction("retrieve")
                .setGas(23474);

            await query._beforeExecute(CLIENT);

            expect(executeStub.called).to.be.false;
            expect(beforeExecute.calledOnceWith(CLIENT)).to.be.true;
        });
    });

    describe("getCost", function () {
        it("should estimate the gas, then delegate to the base query", async function () {
            const executeStub = sinon
                .stub(MirrorNodeContractEstimateQuery.prototype, "execute")
                .resolves(1000);
            const cost = new Hbar(1);
            const getCost = sinon
                .stub(Query.prototype, "getCost")
                .resolves(cost);

            const query = new ContractCallQuery()
                .setContractId(CONTRACT_ID)
                .setFunction("retrieve");

            expect(await query.getCost(CLIENT)).to.equal(cost);
            expect(executeStub.calledOnce).to.be.true;
            expect(query.gas.toNumber()).to.equal(1200);
            expect(getCost.calledOnceWith(CLIENT)).to.be.true;
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
            const query = new ContractCallQuery().setContractId(
                checksummedContractId(),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip when the contract ID is unset", function () {
            expect(() =>
                new ContractCallQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call smartContract.contractCallLocalMethod() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                smartContract: {
                    contractCallLocalMethod: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new ContractCallQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the contract call local header", function () {
            const header = {};
            const response = { contractCallLocal: { header } };

            expect(
                new ContractCallQuery()._mapResponseHeader(response),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should map the protobuf response into a ContractFunctionResult", async function () {
            const result = await new ContractCallQuery()._mapResponse(
                callResponse(true),
            );

            expect(result).to.be.instanceOf(ContractFunctionResult);
            expect(result.contractId.toString()).to.equal(
                CONTRACT_ID.toString(),
            );
            expect(result.gasUsed.toNumber()).to.equal(100);
            expect(result.asBytes()).to.deep.equal(new Uint8Array([1, 2, 3]));
        });
    });

    describe("_mapResponseSync", function () {
        it("should map the protobuf response into a ContractFunctionResult", function () {
            const result = new ContractCallQuery()._mapResponseSync(
                callResponse(true),
            );

            expect(result).to.be.instanceOf(ContractFunctionResult);
            expect(result.contractId.toString()).to.equal(
                CONTRACT_ID.toString(),
            );
            expect(result.gasUsed.toNumber()).to.equal(100);
        });
    });

    describe("_mapStatusError", function () {
        it("should include the mapped function result when the response has one", function () {
            const error = withPaymentTransactionId()._mapStatusError(
                {},
                callResponse(true),
                NODE_ID,
            );

            expect(error).to.be.instanceOf(PrecheckStatusError);
            expect(error.status).to.equal(Status.ContractRevertExecuted);
            expect(error.nodeId.toString()).to.equal(NODE_ID.toString());
            expect(error.contractFunctionResult).to.be.instanceOf(
                ContractFunctionResult,
            );
            expect(error.contractFunctionResult.contractId.toString()).to.equal(
                CONTRACT_ID.toString(),
            );
        });

        it("should leave the function result null when the response has none", function () {
            const error = withPaymentTransactionId()._mapStatusError(
                {},
                callResponse(false),
                NODE_ID,
            );

            expect(error).to.be.instanceOf(PrecheckStatusError);
            expect(error.status).to.equal(Status.ContractRevertExecuted);
            expect(error.contractFunctionResult).to.be.null;
        });
    });

    describe("_onMakeRequest", function () {
        it("should map every field onto the protobuf request", function () {
            const header = {
                responseType: HieroProto.proto.ResponseType.ANSWER_ONLY,
            };
            const functionParameters = new Uint8Array([1, 2, 3, 4]);
            const query = new ContractCallQuery()
                .setContractId(CONTRACT_ID)
                .setGas(100000)
                .setMaxResultSize(2048)
                .setFunctionParameters(functionParameters)
                .setSenderAccountId("0.0.1545");

            const request = query._onMakeRequest(header);

            expect(request.contractCallLocal.header).to.equal(header);
            expect(
                request.contractCallLocal.contractID.contractNum.toString(),
            ).to.equal("5133653");
            expect(request.contractCallLocal.gas.toNumber()).to.equal(100000);
            expect(request.contractCallLocal.maxResultSize.toNumber()).to.equal(
                2048,
            );
            expect(request.contractCallLocal.functionParameters).to.equal(
                functionParameters,
            );
            expect(
                request.contractCallLocal.senderId.accountNum.toString(),
            ).to.equal("1545");
        });

        it("should leave unset fields null", function () {
            const request = new ContractCallQuery()._onMakeRequest({});

            expect(request.contractCallLocal.contractID).to.be.null;
            expect(request.contractCallLocal.gas).to.be.null;
            expect(request.contractCallLocal.maxResultSize).to.be.null;
            expect(request.contractCallLocal.functionParameters).to.be.null;
            expect(request.contractCallLocal.senderId).to.be.null;
        });
    });

    describe("_getLogId", function () {
        it("should use the payment transaction ID valid start when set", function () {
            const validStart = new Timestamp(1596210382, 0);
            const query = new ContractCallQuery().setPaymentTransactionId(
                TransactionId.withValidStart(
                    new AccountId(0, 0, 1001),
                    validStart,
                ),
            );

            expect(query._getLogId()).to.equal(
                `ContractCallQuery:${validStart.toString()}`,
            );
        });

        it("should fall back to the timestamp of the query", function () {
            const query = new ContractCallQuery();

            expect(query._getLogId()).to.equal(
                `ContractCallQuery:${query._timestamp}`,
            );
        });
    });
});
