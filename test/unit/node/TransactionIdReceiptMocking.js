import {
    TransactionId,
    Status,
    TransactionReceiptQuery,
    TransactionRecordQuery,
} from "../../../src/index.js";
import Mocker, { TRANSACTION_RECEIPT_SUCCESS_RESPONSE } from "../Mocker.js";
import Long from "long";
import { proto } from "@hiero-ledger/proto";

const ACCOUNT_ID = {
    shardNum: Long.ZERO,
    realmNum: Long.ZERO,
    accountNum: Long.fromNumber(1001),
};

const TRANSACTION_ID = {
    accountID: ACCOUNT_ID,
    transactionValidStart: {
        seconds: Long.fromNumber(4),
        nanos: 5,
    },
    scheduled: false,
    nonce: null,
};

const RECORD_COST_RESPONSE = {
    transactionGetRecord: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
            responseType: proto.ResponseType.COST_ANSWER,
            cost: Long.fromNumber(25),
        },
    },
};

const RECORD_SUCCESS_RESPONSE = {
    transactionGetRecord: {
        header: {
            nodeTransactionPrecheckCode: proto.ResponseCodeEnum.OK,
        },
        transactionRecord: {
            receipt: {
                status: proto.ResponseCodeEnum.SUCCESS,
                accountID: ACCOUNT_ID,
            },
            transactionHash: new Uint8Array(48),
            consensusTimestamp: {
                seconds: Long.fromNumber(4),
                nanos: 6,
            },
            transactionID: TRANSACTION_ID,
            memo: "",
            transactionFee: Long.fromNumber(0),
            transferList: {
                accountAmounts: [],
            },
        },
    },
};

describe("TransactionId.getReceipt / getRecord (#4575)", function () {
    let client;
    let servers;

    afterEach(function () {
        client?.close();
        servers?.close();
    });

    it("registers CACHE constructors when the query modules load", function () {
        expect(new TransactionReceiptQuery()).to.be.instanceOf(
            TransactionReceiptQuery,
        );
        expect(new TransactionRecordQuery()).to.be.instanceOf(
            TransactionRecordQuery,
        );
    });

    it("getReceipt returns the receipt via the CACHE constructor", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [{ response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE }],
        ]));

        const id = TransactionId.fromString("0.0.1001@4.5");
        const receipt = await id.getReceipt(client);

        expect(receipt.status.toString()).to.equal(Status.Success.toString());
    });

    it("getReceipt rejects instead of throwing synchronously when it fails", async function () {
        ({ client, servers } = await Mocker.withResponses([[]]));

        const id = TransactionId.fromString("0.0.1001@4.5");
        const pending = id.getReceipt(client);

        expect(pending).to.be.instanceOf(Promise);
        let rejected = false;
        try {
            await pending;
        } catch {
            rejected = true;
        }
        expect(rejected).to.be.true;
    });

    it("getRecord returns the record via the CACHE constructors", async function () {
        ({ client, servers } = await Mocker.withResponses([
            [
                { response: TRANSACTION_RECEIPT_SUCCESS_RESPONSE },
                { response: RECORD_COST_RESPONSE },
                { response: RECORD_SUCCESS_RESPONSE },
            ],
        ]));

        const id = TransactionId.fromString("0.0.1001@4.5");
        const record = await id.getRecord(client);

        expect(record.receipt.status.toString()).to.equal(
            Status.Success.toString(),
        );
        expect(record.transactionId.toString()).to.equal(id.toString());
    });
});
