// SPDX-License-Identifier: Apache-2.0

import * as HieroProto from "@hiero-ledger/proto";
import {
    AccountId,
    Query,
    Timestamp,
    TransactionId,
    TransactionRecordQuery,
    ReceiptStatusError,
    PrecheckStatusError,
} from "../../src/index.js";
import RecordStatusError from "../../src/RecordStatusError.js";
import Long from "long";

const Status = HieroProto.proto.ResponseCodeEnum;

describe("TransactionRecordQuery", function () {
    const VALID_START = new Timestamp(1596210382, 0);
    const transactionId = TransactionId.withValidStart(
        new AccountId(0, 0, 1001),
        VALID_START,
    );

    describe("constructor and defaults", function () {
        it("should use the defaults", function () {
            const query = new TransactionRecordQuery();

            expect(query.transactionId).to.be.null;
            expect(query.includeChildren).to.be.false;
            expect(query.includeDuplicates).to.be.false;
            expect(query.validateReceiptStatus).to.be.true;
        });

        it("should set includeDuplicates from props", function () {
            const query = new TransactionRecordQuery({
                transactionId,
                includeDuplicates: true,
            });

            expect(query.includeDuplicates).to.be.true;
        });

        it("should set all fields given in props", function () {
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
    });

    describe("setters and getters", function () {
        it("setIncludeDuplicates() should update includeDuplicates and be chainable", function () {
            const query = new TransactionRecordQuery();

            expect(query.setIncludeDuplicates(true)).to.equal(query);
            expect(query.includeDuplicates).to.be.true;

            expect(query.setIncludeDuplicates(false)).to.equal(query);
            expect(query.includeDuplicates).to.be.false;
        });

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

        it("setValidateReceiptStatus() should be chainable", function () {
            const query = new TransactionRecordQuery();

            expect(query.setValidateReceiptStatus(false)).to.equal(query);
            expect(query.validateReceiptStatus).to.be.false;
        });
    });

    describe("_onMakeRequest()", function () {
        it("should send includeDuplicates as null by default", function () {
            const header = {};
            const query = new TransactionRecordQuery().setTransactionId(
                transactionId,
            );

            expect(query._onMakeRequest(header)).to.deep.equal({
                transactionGetRecord: {
                    header,
                    transactionID: transactionId._toProtobuf(),
                    includeChildRecords: null,
                    includeDuplicates: null,
                },
            });
        });

        it("should encode includeDuplicates when set to true", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(true);

            expect(
                query._onMakeRequest({}).transactionGetRecord.includeDuplicates,
            ).to.be.true;
        });

        it("should encode includeDuplicates when set to false", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(false);

            expect(
                query._onMakeRequest({}).transactionGetRecord.includeDuplicates,
            ).to.be.false;
        });
    });

    describe("_fromProtobuf()", function () {
        it("should decode includeDuplicates from protobuf", function () {
            const query = TransactionRecordQuery._fromProtobuf({
                transactionGetRecord: {
                    transactionID: transactionId._toProtobuf(),
                    includeChildRecords: true,
                    includeDuplicates: true,
                },
            });

            expect(query.includeDuplicates).to.be.true;
            expect(query.includeChildren).to.be.true;
            expect(query.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep includeDuplicates across serialization roundtrip", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(true);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TransactionRecordQuery);
            expect(decoded.includeDuplicates).to.be.true;
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });

        it("should keep includeDuplicates when set to false across serialization roundtrip", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeDuplicates(false);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TransactionRecordQuery);
            expect(decoded.includeDuplicates).to.be.false;
        });

        it("should keep includeChildren across serialization roundtrip", function () {
            const query = new TransactionRecordQuery()
                .setTransactionId(transactionId)
                .setIncludeChildren(true);

            const decoded = Query.fromBytes(query.toBytes());

            expect(decoded).to.be.instanceOf(TransactionRecordQuery);
            expect(decoded.includeChildren).to.be.true;
        });
    });

    describe("status errors", function () {
        const queried = TransactionId.withValidStart(
            new AccountId(1001),
            new Timestamp(1596210382, 0),
        );
        const payment = TransactionId.withValidStart(
            new AccountId(2002),
            new Timestamp(1700000000, 0),
        );

        it("_getTransactionId returns queried transactionId over payment transactionId (#4761)", function () {
            const query = new TransactionRecordQuery().setTransactionId(
                queried,
            );
            query.setPaymentTransactionId(payment);

            expect(query._getTransactionId().toString()).to.equal(
                queried.toString(),
            );
        });

        it("_mapStatusError names the queried transaction, not the payment transaction (#4761)", function () {
            const query = new TransactionRecordQuery().setTransactionId(
                queried,
            );
            query.setPaymentTransactionId(payment);

            const error = query._mapStatusError(
                {},
                {
                    transactionGetRecord: {
                        header: { nodeTransactionPrecheckCode: Status.OK },
                        transactionRecord: {
                            receipt: { status: Status.INVALID_SIGNATURE },
                        },
                    },
                },
                new AccountId(3),
            );

            expect(error).to.be.instanceOf(ReceiptStatusError);
            expect(error.transactionId.toString()).to.equal(queried.toString());
        });

        it("_mapStatusError returns PrecheckStatusError when CONTRACT_REVERT_EXECUTED has no record (#4761)", function () {
            const query = new TransactionRecordQuery().setTransactionId(
                queried,
            );
            query.setPaymentTransactionId(payment);

            const error = query._mapStatusError(
                {},
                {
                    transactionGetRecord: {
                        header: {
                            nodeTransactionPrecheckCode:
                                Status.CONTRACT_REVERT_EXECUTED,
                        },
                    },
                },
                new AccountId(3),
            );

            expect(error).to.be.instanceOf(PrecheckStatusError);
            expect(error.transactionId.toString()).to.equal(queried.toString());
            expect(error.status.toString()).to.equal(
                "CONTRACT_REVERT_EXECUTED",
            );
        });

        it("_mapStatusError returns RecordStatusError when CONTRACT_REVERT_EXECUTED includes a record (#4761)", function () {
            const query = new TransactionRecordQuery().setTransactionId(
                queried,
            );
            query.setPaymentTransactionId(payment);

            const error = query._mapStatusError(
                {},
                {
                    transactionGetRecord: {
                        header: {
                            nodeTransactionPrecheckCode:
                                Status.CONTRACT_REVERT_EXECUTED,
                        },
                        transactionRecord: {
                            receipt: {
                                status: Status.CONTRACT_REVERT_EXECUTED,
                                accountID: {
                                    shardNum: Long.ZERO,
                                    realmNum: Long.ZERO,
                                    accountNum: Long.fromNumber(1001),
                                },
                            },
                            transactionHash: new Uint8Array(48),
                            consensusTimestamp: {
                                seconds: Long.fromNumber(4),
                                nanos: 6,
                            },
                            transactionID: {
                                accountID: {
                                    shardNum: Long.ZERO,
                                    realmNum: Long.ZERO,
                                    accountNum: Long.fromNumber(1001),
                                },
                                transactionValidStart: {
                                    seconds: Long.fromNumber(4),
                                    nanos: 5,
                                },
                            },
                            memo: "",
                            transactionFee: Long.fromNumber(0),
                        },
                    },
                },
                new AccountId(3),
            );

            expect(error).to.be.instanceOf(RecordStatusError);
            expect(error.transactionId.toString()).to.equal(queried.toString());
            expect(error.status.toString()).to.equal(
                "CONTRACT_REVERT_EXECUTED",
            );
        });
    });
});
