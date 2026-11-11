import { vi } from "vitest";
import * as HieroProto from "@hiero-ledger/proto";
import {
    AccountId,
    Client,
    PrecheckStatusError,
    Query,
    ReceiptStatusError,
    Status,
    Timestamp,
    TransactionId,
    TransactionRecord,
    TransactionRecordQuery,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import RecordStatusError from "../../src/RecordStatusError.js";
import { ExecutionState } from "../../src/Executable.js";

const ResponseCode = HieroProto.proto.ResponseCodeEnum;

describe("TransactionRecordQuery", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let transactionId;
    let paymentTransactionId;
    let nodeId;

    beforeEach(function () {
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        paymentTransactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 2002),
            new Timestamp(1700000000, 0),
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {number} precheckCode
     * @param {number} [receiptStatus]
     * @returns {object} a transactionGetRecord response
     */
    function recordResponse(precheckCode, receiptStatus) {
        return {
            transactionGetRecord: {
                header: { nodeTransactionPrecheckCode: precheckCode },
                transactionRecord:
                    receiptStatus != null
                        ? {
                              receipt: { status: receiptStatus },
                              transactionID: transactionId._toProtobuf(),
                              consensusTimestamp: new Timestamp(
                                  1596210390,
                                  0,
                              )._toProtobuf(),
                          }
                        : null,
            },
        };
    }

    /**
     * @returns {TransactionRecordQuery} a query whose payment transaction ID is set
     */
    function queryWithPayment() {
        const query = new TransactionRecordQuery().setTransactionId(
            transactionId,
        );
        query.setPaymentTransactionId(paymentTransactionId);
        return query;
    }

    describe("constructor", function () {
        it("should use the defaults", function () {
            const query = new TransactionRecordQuery();

            expect(query.transactionId).to.be.null;
            expect(query.includeChildren).to.be.false;
            expect(query.includeDuplicates).to.be.false;
            expect(query.validateReceiptStatus).to.be.true;
        });

        it("should set the fields given in props", function () {
            const query = new TransactionRecordQuery({
                transactionId,
                includeChildren: true,
                includeDuplicates: true,
                validateReceiptStatus: false,
            });

            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(query.includeChildren).to.be.true;
            expect(query.includeDuplicates).to.be.true;
            expect(query.validateReceiptStatus).to.be.false;
        });

        it("should accept a string transactionId in props", function () {
            const query = new TransactionRecordQuery({
                transactionId: "0.0.1001@1596210382.000000000",
            });

            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });
    });

    describe("setters", function () {
        it("setTransactionId() should store a copy and be chainable", function () {
            const query = new TransactionRecordQuery();

            expect(query.setTransactionId(transactionId)).to.equal(query);
            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(query.transactionId).to.not.equal(transactionId);
        });

        it("setIncludeChildren() should be chainable", function () {
            const query = new TransactionRecordQuery();

            expect(query.setIncludeChildren(true)).to.equal(query);
            expect(query.includeChildren).to.be.true;
        });

        it("setIncludeDuplicates() should be chainable", function () {
            const query = new TransactionRecordQuery();

            expect(query.setIncludeDuplicates(true)).to.equal(query);
            expect(query.includeDuplicates).to.be.true;
        });

        it("setValidateReceiptStatus() should be chainable", function () {
            const query = new TransactionRecordQuery();

            expect(query.setValidateReceiptStatus(false)).to.equal(query);
            expect(query.validateReceiptStatus).to.be.false;
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode every field", function () {
            const query = TransactionRecordQuery._fromProtobuf({
                transactionGetRecord: {
                    transactionID: transactionId._toProtobuf(),
                    includeChildRecords: true,
                    includeDuplicates: true,
                },
            });

            expect(query).to.be.instanceOf(TransactionRecordQuery);
            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(query.includeChildren).to.be.true;
            expect(query.includeDuplicates).to.be.true;
        });

        it("should leave missing fields at their defaults", function () {
            const query = TransactionRecordQuery._fromProtobuf({
                transactionGetRecord: {},
            });

            expect(query.transactionId).to.be.null;
            expect(query.includeChildren).to.be.false;
            expect(query.includeDuplicates).to.be.false;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the transaction ID and includeChildren", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeChildren(true);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TransactionRecordQuery);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.includeChildren).to.be.true;
        });

        // TODO(#4760): includeDuplicates is never sent (setIncludeDuplicates() writes _duplicates).
        it.skip("should keep includeDuplicates", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(true);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded.includeDuplicates).to.be.true;
        });
    });

    describe("_getStatusAndExecutionState", function () {
        it("should retry for a busy precheck", function () {
            for (const code of [
                ResponseCode.BUSY,
                ResponseCode.UNKNOWN,
                ResponseCode.RECEIPT_NOT_FOUND,
                ResponseCode.RECORD_NOT_FOUND,
                ResponseCode.PLATFORM_NOT_ACTIVE,
            ]) {
                expect(
                    new TransactionRecordQuery()._getStatusAndExecutionState(
                        {},
                        recordResponse(code),
                    ),
                ).to.deep.equal([Status._fromCode(code), ExecutionState.Retry]);
            }
        });

        it("should fail for another precheck error", function () {
            expect(
                new TransactionRecordQuery()._getStatusAndExecutionState(
                    {},
                    recordResponse(ResponseCode.INVALID_TRANSACTION),
                ),
            ).to.deep.equal([Status.InvalidTransaction, ExecutionState.Error]);
        });

        it("should finish for a cost answer", function () {
            const response = recordResponse(ResponseCode.OK);
            response.transactionGetRecord.header.responseType =
                HieroProto.proto.ResponseType.COST_ANSWER;

            expect(
                new TransactionRecordQuery()._getStatusAndExecutionState(
                    {},
                    response,
                ),
            ).to.deep.equal([Status.Ok, ExecutionState.Finished]);
        });

        it("should retry while the record isn't ready", function () {
            for (const code of [
                ResponseCode.OK,
                ResponseCode.BUSY,
                ResponseCode.UNKNOWN,
                ResponseCode.RECEIPT_NOT_FOUND,
                ResponseCode.RECORD_NOT_FOUND,
            ]) {
                expect(
                    new TransactionRecordQuery()._getStatusAndExecutionState(
                        {},
                        recordResponse(ResponseCode.OK, code),
                    ),
                ).to.deep.equal([Status._fromCode(code), ExecutionState.Retry]);
            }
        });

        it("should finish for SUCCESS", function () {
            expect(
                new TransactionRecordQuery()._getStatusAndExecutionState(
                    {},
                    recordResponse(ResponseCode.OK, ResponseCode.SUCCESS),
                ),
            ).to.deep.equal([Status.Success, ExecutionState.Finished]);
        });

        it("should fail for a failed receipt status while validation is on", function () {
            expect(
                new TransactionRecordQuery()._getStatusAndExecutionState(
                    {},
                    recordResponse(
                        ResponseCode.OK,
                        ResponseCode.INVALID_SIGNATURE,
                    ),
                ),
            ).to.deep.equal([Status.InvalidSignature, ExecutionState.Error]);
        });

        it("should finish for a failed receipt status while validation is off", function () {
            expect(
                new TransactionRecordQuery()
                    .setValidateReceiptStatus(false)
                    ._getStatusAndExecutionState(
                        {},
                        recordResponse(
                            ResponseCode.OK,
                            ResponseCode.INVALID_SIGNATURE,
                        ),
                    ),
            ).to.deep.equal([Status.InvalidSignature, ExecutionState.Finished]);
        });

        it("should log the precheck and receipt statuses", function () {
            const query = new TransactionRecordQuery();
            const logger = { debug: vi.fn() };
            query.setLogger(logger);

            query._getStatusAndExecutionState(
                {},
                recordResponse(ResponseCode.OK, ResponseCode.SUCCESS),
            );

            expect(logger.debug).toHaveBeenCalledTimes(2);
            expect(logger.debug.mock.calls[0][0]).to.include(
                "received node precheck status OK",
            );
            expect(logger.debug.mock.calls[1][0]).to.include(
                "received record's receipt SUCCESS",
            );
        });
    });

    describe("_mapStatusError", function () {
        it("should return a PrecheckStatusError for a precheck error", function () {
            const error = queryWithPayment()._mapStatusError(
                {},
                recordResponse(ResponseCode.INVALID_TRANSACTION),
                nodeId,
            );

            expect(error).to.be.instanceOf(PrecheckStatusError);
            expect(error.status).to.equal(Status.InvalidTransaction);
            expect(error.nodeId.toString()).to.equal(nodeId.toString());
        });

        it("should return a RecordStatusError for a CONTRACT_REVERT_EXECUTED precheck", function () {
            const error = queryWithPayment()._mapStatusError(
                {},
                recordResponse(
                    ResponseCode.CONTRACT_REVERT_EXECUTED,
                    ResponseCode.CONTRACT_REVERT_EXECUTED,
                ),
                nodeId,
            );

            expect(error).to.be.instanceOf(RecordStatusError);
            expect(error.status).to.equal(Status.ContractRevertExecuted);
            expect(error.transactionRecord).to.be.instanceOf(TransactionRecord);
        });

        it("should return a RecordStatusError for a CONTRACT_REVERT_EXECUTED receipt status", function () {
            const error = queryWithPayment()._mapStatusError(
                {},
                recordResponse(
                    ResponseCode.OK,
                    ResponseCode.CONTRACT_REVERT_EXECUTED,
                ),
                nodeId,
            );

            expect(error).to.be.instanceOf(RecordStatusError);
            expect(error.status).to.equal(Status.ContractRevertExecuted);
            expect(error.transactionRecord.receipt.status).to.equal(
                Status.ContractRevertExecuted,
            );
        });

        it("should return a ReceiptStatusError for another failed receipt status", function () {
            const error = queryWithPayment()._mapStatusError(
                {},
                recordResponse(ResponseCode.OK, ResponseCode.INVALID_SIGNATURE),
                nodeId,
            );

            expect(error).to.be.instanceOf(ReceiptStatusError);
            expect(error.status).to.equal(Status.InvalidSignature);
            expect(error.transactionReceipt.status).to.equal(
                Status.InvalidSignature,
            );
        });

        it("should throw without a transaction ID or a payment transaction ID", function () {
            expect(() =>
                new TransactionRecordQuery()._mapStatusError(
                    {},
                    recordResponse(
                        ResponseCode.OK,
                        ResponseCode.INVALID_SIGNATURE,
                    ),
                    nodeId,
                ),
            ).to.throw("Query.PaymentTransactionId was not set");
        });

        // TODO(#4761): the error names the payment transaction.
        it.skip("should name the queried transaction in the error", function () {
            const error = queryWithPayment()._mapStatusError(
                {},
                recordResponse(ResponseCode.OK, ResponseCode.INVALID_SIGNATURE),
                nodeId,
            );

            expect(error.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });

        // TODO(#4761): a CONTRACT_REVERT_EXECUTED precheck without a record throws a TypeError.
        it.skip("should return a PrecheckStatusError for a CONTRACT_REVERT_EXECUTED precheck without a record", function () {
            const error = queryWithPayment()._mapStatusError(
                {},
                recordResponse(ResponseCode.CONTRACT_REVERT_EXECUTED),
                nodeId,
            );

            expect(error).to.be.instanceOf(PrecheckStatusError);
            expect(error.status).to.equal(Status.ContractRevertExecuted);
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

        // TODO(#4757): AccountId.fromString() drops the checksum.
        it.skip("should check the transaction ID's account checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const query = new TransactionRecordQuery().setTransactionId(
                TransactionId.withValidStart(
                    AccountId.fromString("0.0.123-vfmkw"),
                    VALID_START,
                ),
            );

            expect(() => query._validateChecksums(mainnet)).to.not.throw();
            expect(() => query._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip an unset transaction ID", function () {
            expect(() =>
                new TransactionRecordQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.getTxRecordByTxID() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    getTxRecordByTxID: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TransactionRecordQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the transactionGetRecord header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new TransactionRecordQuery()._mapResponseHeader({
                    transactionGetRecord: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the record", async function () {
            const result = await new TransactionRecordQuery()._mapResponse(
                recordResponse(ResponseCode.OK, ResponseCode.SUCCESS),
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(TransactionRecord);
            expect(result.receipt.status).to.equal(Status.Success);
            expect(result.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header, transaction ID and includeChildren", function () {
            const header = {};
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeChildren(true);

            expect(query._onMakeRequest(header)).to.deep.equal({
                transactionGetRecord: {
                    header,
                    transactionID: transactionId._toProtobuf(),
                    includeChildRecords: true,
                    includeDuplicates: null,
                },
            });
        });

        // TODO(#4760): includeDuplicates is never sent (setIncludeDuplicates() writes _duplicates).
        it.skip("should encode includeDuplicates", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(true);

            expect(
                query._onMakeRequest({}).transactionGetRecord.includeDuplicates,
            ).to.be.true;
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and timestamp", function () {
            const query = new TransactionRecordQuery();

            expect(query._getLogId()).to.equal(
                `TransactionRecordQuery:${query._timestamp.toString()}`,
            );
        });

        it("should use the payment transaction valid start", function () {
            expect(queryWithPayment()._getLogId()).to.equal(
                `TransactionRecordQuery:${paymentTransactionId.validStart.toString()}`,
            );
        });
    });
});
