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
    TransactionReceipt,
    TransactionReceiptQuery,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import { ExecutionState } from "../../src/Executable.js";

const ResponseCode = HieroProto.proto.ResponseCodeEnum;

describe("TransactionReceiptQuery", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let transactionId;
    let nodeId;

    beforeEach(function () {
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {number} precheckCode
     * @param {number} [receiptStatus]
     * @returns {object} a transactionGetReceipt response
     */
    function receiptResponse(precheckCode, receiptStatus) {
        return {
            transactionGetReceipt: {
                header: { nodeTransactionPrecheckCode: precheckCode },
                receipt:
                    receiptStatus != null ? { status: receiptStatus } : null,
            },
        };
    }

    describe("constructor", function () {
        it("should use the defaults", function () {
            const query = new TransactionReceiptQuery();

            expect(query.transactionId).to.be.null;
            expect(query.includeChildren).to.be.false;
            expect(query.includeDuplicates).to.be.false;
            expect(query.validateStatus).to.be.true;
        });

        it("should set the fields given in props", function () {
            const query = new TransactionReceiptQuery({
                transactionId,
                includeChildren: true,
                includeDuplicates: true,
                validateStatus: false,
            });

            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(query.includeChildren).to.be.true;
            expect(query.includeDuplicates).to.be.true;
            expect(query.validateStatus).to.be.false;
        });

        it("should accept a string transactionId in props", function () {
            const query = new TransactionReceiptQuery({
                transactionId: "0.0.1001@1596210382.000000000",
            });

            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });
    });

    describe("setters", function () {
        it("setTransactionId() should store a copy and be chainable", function () {
            const query = new TransactionReceiptQuery();

            expect(query.setTransactionId(transactionId)).to.equal(query);
            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(query.transactionId).to.not.equal(transactionId);
        });

        it("setIncludeChildren() and setIncludeDuplicates() should be chainable", function () {
            const query = new TransactionReceiptQuery();

            expect(query.setIncludeChildren(true)).to.equal(query);
            expect(query.setIncludeDuplicates(true)).to.equal(query);
            expect(query.includeChildren).to.be.true;
            expect(query.includeDuplicates).to.be.true;
        });

        it("setValidateStatus() should be chainable", function () {
            const query = new TransactionReceiptQuery();

            expect(query.setValidateStatus(false)).to.equal(query);
            expect(query.validateStatus).to.be.false;
        });
    });

    describe("_fromProtobuf", function () {
        it("should decode every field", function () {
            const query = TransactionReceiptQuery._fromProtobuf({
                transactionGetReceipt: {
                    transactionID: transactionId._toProtobuf(),
                    includeDuplicates: true,
                    includeChildReceipts: true,
                },
            });

            expect(query).to.be.instanceOf(TransactionReceiptQuery);
            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(query.includeDuplicates).to.be.true;
            expect(query.includeChildren).to.be.true;
        });

        it("should leave missing fields at their defaults", function () {
            const query = TransactionReceiptQuery._fromProtobuf({
                transactionGetReceipt: {},
            });

            expect(query.transactionId).to.be.null;
            expect(query.includeDuplicates).to.be.false;
            expect(query.includeChildren).to.be.false;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const query = new TransactionReceiptQuery()
                .setTransactionId(transactionId)
                .setIncludeChildren(true)
                .setIncludeDuplicates(true);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TransactionReceiptQuery);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.includeChildren).to.be.true;
            expect(decoded.includeDuplicates).to.be.true;
        });
    });

    describe("_isPaymentRequired", function () {
        it("should return false", function () {
            expect(new TransactionReceiptQuery()._isPaymentRequired()).to.be
                .false;
        });
    });

    describe("_getTransactionId", function () {
        it("should return the queried transaction ID", function () {
            const query = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            expect(query._getTransactionId().toString()).to.equal(
                transactionId.toString(),
            );
        });

        it("should fall back to the payment transaction ID", function () {
            const query = new TransactionReceiptQuery();
            query.setPaymentTransactionId(transactionId);

            expect(query._getTransactionId().toString()).to.equal(
                transactionId.toString(),
            );
        });

        it("should throw without either", function () {
            expect(() =>
                new TransactionReceiptQuery()._getTransactionId(),
            ).to.throw("Query.PaymentTransactionId was not set");
        });
    });

    describe("_getStatusAndExecutionState", function () {
        it("should retry for a busy precheck", function () {
            for (const code of [
                ResponseCode.BUSY,
                ResponseCode.UNKNOWN,
                ResponseCode.RECEIPT_NOT_FOUND,
                ResponseCode.PLATFORM_NOT_ACTIVE,
            ]) {
                expect(
                    new TransactionReceiptQuery()._getStatusAndExecutionState(
                        {},
                        receiptResponse(code),
                    ),
                ).to.deep.equal([Status._fromCode(code), ExecutionState.Retry]);
            }
        });

        it("should fail for another precheck error", function () {
            expect(
                new TransactionReceiptQuery()._getStatusAndExecutionState(
                    {},
                    receiptResponse(ResponseCode.INVALID_TRANSACTION),
                ),
            ).to.deep.equal([Status.InvalidTransaction, ExecutionState.Error]);
        });

        it("should retry while the receipt isn't ready", function () {
            for (const code of [
                ResponseCode.BUSY,
                ResponseCode.UNKNOWN,
                ResponseCode.RECEIPT_NOT_FOUND,
            ]) {
                expect(
                    new TransactionReceiptQuery()._getStatusAndExecutionState(
                        {},
                        receiptResponse(ResponseCode.OK, code),
                    ),
                ).to.deep.equal([Status._fromCode(code), ExecutionState.Retry]);
            }
        });

        it("should finish for SUCCESS and FEE_SCHEDULE_FILE_PART_UPLOADED", function () {
            for (const code of [
                ResponseCode.SUCCESS,
                ResponseCode.FEE_SCHEDULE_FILE_PART_UPLOADED,
            ]) {
                expect(
                    new TransactionReceiptQuery()._getStatusAndExecutionState(
                        {},
                        receiptResponse(ResponseCode.OK, code),
                    ),
                ).to.deep.equal([
                    Status._fromCode(code),
                    ExecutionState.Finished,
                ]);
            }
        });

        it("should fail for a failed receipt status while validation is on", function () {
            expect(
                new TransactionReceiptQuery()._getStatusAndExecutionState(
                    {},
                    receiptResponse(
                        ResponseCode.OK,
                        ResponseCode.INVALID_SIGNATURE,
                    ),
                ),
            ).to.deep.equal([Status.InvalidSignature, ExecutionState.Error]);
        });

        it("should finish for a failed receipt status while validation is off", function () {
            expect(
                new TransactionReceiptQuery()
                    .setValidateStatus(false)
                    ._getStatusAndExecutionState(
                        {},
                        receiptResponse(
                            ResponseCode.OK,
                            ResponseCode.INVALID_SIGNATURE,
                        ),
                    ),
            ).to.deep.equal([Status.InvalidSignature, ExecutionState.Finished]);
        });

        it("should log the precheck and receipt statuses", function () {
            const query = new TransactionReceiptQuery();
            const logger = { debug: vi.fn() };
            query.setLogger(logger);

            query._getStatusAndExecutionState(
                {},
                receiptResponse(ResponseCode.OK, ResponseCode.SUCCESS),
            );

            expect(logger.debug).toHaveBeenCalledTimes(2);
            expect(logger.debug.mock.calls[0][0]).to.include(
                "received node precheck status OK",
            );
            expect(logger.debug.mock.calls[1][0]).to.include(
                "received receipt status SUCCESS",
            );
        });
    });

    describe("_mapStatusError", function () {
        it("should return a PrecheckStatusError for a precheck error", function () {
            const query = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            const error = query._mapStatusError(
                {},
                receiptResponse(ResponseCode.INVALID_TRANSACTION),
                nodeId,
            );

            expect(error).to.be.instanceOf(PrecheckStatusError);
            expect(error.status).to.equal(Status.InvalidTransaction);
            expect(error.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(error.nodeId.toString()).to.equal(nodeId.toString());
        });

        it("should return a ReceiptStatusError for a failed receipt status", function () {
            const query = new TransactionReceiptQuery().setTransactionId(
                transactionId,
            );

            const error = query._mapStatusError(
                {},
                receiptResponse(
                    ResponseCode.OK,
                    ResponseCode.INVALID_SIGNATURE,
                ),
                nodeId,
            );

            expect(error).to.be.instanceOf(ReceiptStatusError);
            expect(error.status).to.equal(Status.InvalidSignature);
            expect(error.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(error.transactionReceipt.status).to.equal(
                Status.InvalidSignature,
            );
        });

        it("should throw for a failed receipt status without a transaction ID", function () {
            expect(() =>
                new TransactionReceiptQuery()._mapStatusError(
                    {},
                    receiptResponse(
                        ResponseCode.OK,
                        ResponseCode.INVALID_SIGNATURE,
                    ),
                    nodeId,
                ),
            ).to.throw(
                "Failed to construct `ReceiptStatusError` because `transactionId` is `null`",
            );
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
            const query = new TransactionReceiptQuery().setTransactionId(
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
                new TransactionReceiptQuery()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call crypto.getTransactionReceipts() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                crypto: {
                    getTransactionReceipts: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TransactionReceiptQuery()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_mapResponseHeader", function () {
        it("should return the transactionGetReceipt header", function () {
            const header = { nodeTransactionPrecheckCode: 0 };

            expect(
                new TransactionReceiptQuery()._mapResponseHeader({
                    transactionGetReceipt: { header },
                }),
            ).to.equal(header);
        });
    });

    describe("_mapResponse", function () {
        it("should decode the receipt", async function () {
            const result = await new TransactionReceiptQuery()._mapResponse(
                receiptResponse(ResponseCode.OK, ResponseCode.SUCCESS),
                nodeId,
                {},
            );

            expect(result).to.be.instanceOf(TransactionReceipt);
            expect(result.status).to.equal(Status.Success);
        });
    });

    describe("_onMakeRequest", function () {
        it("should encode the header and every field", function () {
            const header = {};
            const query = new TransactionReceiptQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(true)
                .setIncludeChildren(true);

            expect(query._onMakeRequest(header)).to.deep.equal({
                transactionGetReceipt: {
                    header,
                    transactionID: transactionId._toProtobuf(),
                    includeDuplicates: true,
                    includeChildReceipts: true,
                },
            });
        });

        it("should encode unset fields as null", function () {
            const header = {};

            expect(
                new TransactionReceiptQuery()._onMakeRequest(header),
            ).to.deep.equal({
                transactionGetReceipt: {
                    header,
                    transactionID: null,
                    includeDuplicates: null,
                    includeChildReceipts: null,
                },
            });
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and the query's timestamp", function () {
            const query = new TransactionReceiptQuery();

            expect(query._getLogId()).to.equal(
                `TransactionReceiptQuery:${query._timestamp.toString()}`,
            );
        });
    });
});
