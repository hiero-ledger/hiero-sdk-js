import * as HieroProto from "@hiero-ledger/proto";
import {
    AccountId,
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
    const queried = TransactionId.withValidStart(
        new AccountId(1001),
        new Timestamp(1596210382, 0),
    );
    const payment = TransactionId.withValidStart(
        new AccountId(2002),
        new Timestamp(1700000000, 0),
    );

    it("_getTransactionId returns queried transactionId over payment transactionId (#4761)", function () {
        const query = new TransactionRecordQuery().setTransactionId(queried);
        query.setPaymentTransactionId(payment);

        expect(query._getTransactionId().toString()).to.equal(
            queried.toString(),
        );
    });

    it("_mapStatusError names the queried transaction, not the payment transaction (#4761)", function () {
        const query = new TransactionRecordQuery().setTransactionId(queried);
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
        const query = new TransactionRecordQuery().setTransactionId(queried);
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
        expect(error.status.toString()).to.equal("CONTRACT_REVERT_EXECUTED");
    });

    it("_mapStatusError returns RecordStatusError when CONTRACT_REVERT_EXECUTED includes a record (#4761)", function () {
        const query = new TransactionRecordQuery().setTransactionId(queried);
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
        expect(error.status.toString()).to.equal("CONTRACT_REVERT_EXECUTED");
    });
});
