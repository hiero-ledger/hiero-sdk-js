import {
    ScheduleInfo,
    ScheduleId,
    AccountId,
    TransactionId,
    Timestamp,
    Transaction,
    KeyList,
    TransferTransaction,
    PrivateKey,
} from "../../src/index.js";
import Long from "long";

describe("ScheduleInfo", function () {
    let scheduleId;
    let creatorAccountId;
    let payerAccountId;
    let adminKey;
    let signers;
    let scheduleMemo;
    let expirationTime;
    let executed;
    let deleted;
    let scheduledTransactionId;
    let transferTransaction;
    let schedulableTransactionBody;

    beforeEach(function () {
        scheduleId = new ScheduleId(5);
        creatorAccountId = new AccountId(10);
        payerAccountId = new AccountId(15);
        adminKey = PrivateKey.generateED25519().publicKey;
        signers = new KeyList();
        signers.push(PrivateKey.generateED25519().publicKey);
        scheduleMemo = "test memo";
        expirationTime = new Timestamp(500, 600);
        executed = new Timestamp(700, 800);
        deleted = new Timestamp(900, 1000);
        scheduledTransactionId = TransactionId.generate(new AccountId(20));

        // Create a transaction to use as schedulable transaction
        transferTransaction = new TransferTransaction()
            .addHbarTransfer(new AccountId(1), -1)
            .addHbarTransfer(new AccountId(2), 1);

        // Extract the transaction body to use in tests
        schedulableTransactionBody = transferTransaction._makeTransactionData();
    });

    describe("constructor", function () {
        it("should construct ScheduleInfo with all properties", function () {
            const info = new ScheduleInfo({
                scheduleId,
                creatorAccountID: creatorAccountId,
                payerAccountID: payerAccountId,
                schedulableTransactionBody,
                adminKey,
                signers,
                scheduleMemo,
                expirationTime,
                executed,
                deleted,
                scheduledTransactionId,
                waitForExpiry: true,
            });

            expect(info.scheduleId.toString()).to.equal(scheduleId.toString());
            expect(info.creatorAccountId.toString()).to.equal(
                creatorAccountId.toString(),
            );
            expect(info.payerAccountId.toString()).to.equal(
                payerAccountId.toString(),
            );
            expect(info.schedulableTransactionBody).to.equal(
                schedulableTransactionBody,
            );
            expect(info.adminKey).to.equal(adminKey);
            expect(info.signers).to.equal(signers);
            expect(info.scheduleMemo).to.equal(scheduleMemo);
            expect(info.expirationTime).to.equal(expirationTime);
            expect(info.executed).to.equal(executed);
            expect(info.deleted).to.equal(deleted);
            expect(info.scheduledTransactionId.toString()).to.equal(
                scheduledTransactionId.toString(),
            );
            expect(info.waitForExpiry).to.be.true;
        });

        it("should handle null values", function () {
            const info = new ScheduleInfo({
                scheduleId,
                creatorAccountID: null,
                payerAccountID: null,
                schedulableTransactionBody: null,
                adminKey: null,
                signers: null,
                scheduleMemo: null,
                expirationTime: null,
                executed: null,
                deleted: null,
                scheduledTransactionId: null,
                waitForExpiry: false,
            });

            expect(info.scheduleId.toString()).to.equal(scheduleId.toString());
            expect(info.creatorAccountId).to.be.null;
            expect(info.payerAccountId).to.be.null;
            expect(info.schedulableTransactionBody).to.be.null;
            expect(info.adminKey).to.be.null;
            expect(info.signers).to.be.null;
            expect(info.scheduleMemo).to.be.null;
            expect(info.expirationTime).to.be.null;
            expect(info.executed).to.be.null;
            expect(info.deleted).to.be.null;
            expect(info.scheduledTransactionId).to.be.null;
            expect(info.waitForExpiry).to.be.false;
        });
    });

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf properly", function () {
            const protoObj = {
                scheduleID: scheduleId._toProtobuf(),
                creatorAccountID: creatorAccountId._toProtobuf(),
                payerAccountID: payerAccountId._toProtobuf(),
                scheduledTransactionBody: schedulableTransactionBody,
                adminKey: adminKey._toProtobufKey(),
                signers: signers._toProtobufKey().keyList,
                memo: scheduleMemo,
                expirationTime: expirationTime._toProtobuf(),
                executionTime: executed._toProtobuf(),
                deletionTime: deleted._toProtobuf(),
                scheduledTransactionID: scheduledTransactionId._toProtobuf(),
                waitForExpiry: true,
            };

            const info = ScheduleInfo._fromProtobuf(protoObj);

            expect(info.scheduleId.toString()).to.equal(scheduleId.toString());
            expect(info.creatorAccountId.toString()).to.equal(
                creatorAccountId.toString(),
            );
            expect(info.payerAccountId.toString()).to.equal(
                payerAccountId.toString(),
            );
            expect(info.scheduleMemo).to.equal(scheduleMemo);
            expect(info.expirationTime.toString()).to.equal(
                expirationTime.toString(),
            );
            expect(info.executed.toString()).to.equal(executed.toString());
            expect(info.deleted.toString()).to.equal(deleted.toString());
            expect(info.scheduledTransactionId.toString()).to.equal(
                scheduledTransactionId.toString(),
            );
            expect(info.waitForExpiry).to.be.true;
        });

        it("should handle missing fields", function () {
            const protoObj = {
                scheduleID: scheduleId._toProtobuf(),
            };

            const info = ScheduleInfo._fromProtobuf(protoObj);

            expect(info.scheduleId.toString()).to.equal(scheduleId.toString());
            expect(info.creatorAccountId).to.be.null;
            expect(info.payerAccountId).to.be.null;
            expect(info.schedulableTransactionBody).to.be.null;
            expect(info.adminKey).to.be.null;
            expect(info.signers).to.be.null;
            expect(info.scheduleMemo).to.be.null;
            expect(info.expirationTime).to.be.null;
            expect(info.executed).to.be.null;
            expect(info.deleted).to.be.null;
            expect(info.scheduledTransactionId).to.be.null;
            expect(info.waitForExpiry).to.be.false;
        });
    });

    describe("_toProtobuf", function () {
        it("should serialize to protobuf properly", function () {
            // Create a modified ScheduleInfo with a mock of the signers KeyList
            // that properly implements _toProtobufKey
            const mockSigners = {
                _toProtobufKey: () => ({ keyList: [] }),
            };

            const info = new ScheduleInfo({
                scheduleId,
                creatorAccountID: creatorAccountId,
                payerAccountID: payerAccountId,
                schedulableTransactionBody,
                adminKey,
                signers: mockSigners,
                scheduleMemo,
                expirationTime,
                executed,
                deleted,
                scheduledTransactionId,
                waitForExpiry: true,
            });

            const protoObj = info._toProtobuf();

            expect(protoObj.scheduleID).to.deep.include({
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                scheduleNum: Long.fromNumber(5),
            });
            expect(protoObj.creatorAccountID).to.deep.include({
                accountNum: Long.fromNumber(10),
            });
            expect(protoObj.payerAccountID).to.deep.include({
                accountNum: Long.fromNumber(15),
            });
            expect(protoObj.scheduledTransactionBody).to.equal(
                schedulableTransactionBody,
            );
            expect(protoObj.memo).to.equal(scheduleMemo);
            expect(protoObj.waitForExpiry).to.be.true;
        });
    });

    describe("scheduledTransaction getter", function () {
        it("should return a Transaction instance", function () {
            // Create a TransferTransaction for testing
            const amount = Long.fromNumber(100);
            const sender = new AccountId(1);
            const receiver = new AccountId(2);

            // Create a TransferTransaction and extract its body
            const transferTx = new TransferTransaction()
                .addHbarTransfer(sender, -amount)
                .addHbarTransfer(receiver, amount);

            const bodyData = transferTx._makeTransactionData();

            // Create a ScheduleInfo with this transaction body
            const info = new ScheduleInfo({
                scheduleId,
                creatorAccountID: creatorAccountId,
                payerAccountID: payerAccountId,
                schedulableTransactionBody: {
                    cryptoTransfer: bodyData,
                },
                adminKey,
                signers,
                scheduleMemo,
                expirationTime,
                executed,
                deleted,
                scheduledTransactionId,
                waitForExpiry: true,
            });

            // Get the scheduled transaction
            const transaction = info.scheduledTransaction;

            // Verify it's a Transaction instance
            expect(transaction).to.be.instanceOf(Transaction);

            // Check that it's a TransferTransaction with expected properties
            expect(transaction._getTransactionDataCase()).to.equal(
                "cryptoTransfer",
            );
        });

        it("should throw error when schedulableTransactionBody is null", function () {
            const info = new ScheduleInfo({
                scheduleId,
                creatorAccountID: creatorAccountId,
                payerAccountID: payerAccountId,
                schedulableTransactionBody: null,
                adminKey,
                signers,
                scheduleMemo,
                expirationTime,
                executed,
                deleted,
                scheduledTransactionId,
                waitForExpiry: true,
            });

            expect(() => {
                info.scheduledTransaction;
            }).to.throw("Scheduled transaction body is empty");
        });

        it("should handle different transaction types", function () {
            // Test different transaction types to ensure the getter works for all types
            // For this test, we'll just test a transfer transaction to illustrate the behavior

            // Create a transfer transaction body
            const transferBody = {
                cryptoTransfer: {
                    transfers: {
                        accountAmounts: [
                            {
                                accountID: { accountNum: Long.fromValue(1) },
                                amount: Long.fromValue(-100),
                            },
                            {
                                accountID: { accountNum: Long.fromValue(2) },
                                amount: Long.fromValue(100),
                            },
                        ],
                    },
                },
            };

            const info = new ScheduleInfo({
                scheduleId,
                creatorAccountID: creatorAccountId,
                payerAccountID: payerAccountId,
                schedulableTransactionBody: transferBody,
                adminKey,
                signers,
                scheduleMemo,
                expirationTime,
                executed,
                deleted,
                scheduledTransactionId,
                waitForExpiry: true,
            });

            const transaction = info.scheduledTransaction;

            // Verify it's a Transaction instance with the correct type
            expect(transaction).to.be.instanceOf(Transaction);
            expect(transaction._getTransactionDataCase()).to.equal(
                "cryptoTransfer",
            );
        });
    });
});
