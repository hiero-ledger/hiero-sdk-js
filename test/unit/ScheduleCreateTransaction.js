import {
    AccountId,
    Client,
    Hbar,
    PrivateKey,
    ScheduleCreateTransaction,
    Timestamp,
    Transaction,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";

describe("ScheduleCreateTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let adminKey, payerAccountId, expirationTime, transactionId, nodeId;

    beforeEach(function () {
        adminKey = PrivateKey.generateED25519().publicKey;
        payerAccountId = new AccountId(0, 0, 5006);
        expirationTime = new Timestamp(1700000000, 0);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @returns {TransferTransaction}
     */
    function newTransfer() {
        return new TransferTransaction()
            .addHbarTransfer("0.0.5007", new Hbar(-1))
            .addHbarTransfer("0.0.5008", new Hbar(1));
    }

    /**
     * @param {ScheduleCreateTransaction} transaction
     * @returns {ScheduleCreateTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new ScheduleCreateTransaction();

            expect(transaction.adminKey).to.be.null;
            expect(transaction.payerAccountId).to.be.null;
            expect(transaction.getScheduleMemo).to.be.null;
            expect(transaction.expirationTime).to.be.null;
            expect(transaction.waitForExpiry).to.be.null;
            expect(transaction._scheduledTransaction).to.be.null;
        });

        it("should set the admin key, payer and memo given in props", function () {
            const transaction = new ScheduleCreateTransaction({
                adminKey,
                payerAccountID: payerAccountId,
                scheduleMemo: "memo",
            });

            expect(transaction.adminKey.toString()).to.equal(
                adminKey.toString(),
            );
            expect(transaction.payerAccountId.toString()).to.equal(
                payerAccountId.toString(),
            );
            expect(transaction.getScheduleMemo).to.equal("memo");
        });

        // TODO(#4681): the constructor ignores these two props.
        it.skip("should set the expiration time and wait for expiry given in props", function () {
            const transaction = new ScheduleCreateTransaction({
                expirationTime,
                waitForExpiry: true,
            });

            expect(transaction.expirationTime.toString()).to.equal(
                expirationTime.toString(),
            );
            expect(transaction.waitForExpiry).to.equal(true);
        });

        it("should default the max transaction fee to 5 Hbar", function () {
            const transaction = new ScheduleCreateTransaction();

            expect(
                transaction._defaultMaxTransactionFee.toTinybars().toString(),
            ).to.equal(new Hbar(5).toTinybars().toString());
        });
    });

    describe("setters", function () {
        it("should set every field and be chainable", function () {
            const transaction = new ScheduleCreateTransaction();

            expect(transaction.setAdminKey(adminKey)).to.equal(transaction);
            expect(transaction.setPayerAccountId(payerAccountId)).to.equal(
                transaction,
            );
            expect(transaction.setScheduleMemo("memo")).to.equal(transaction);
            expect(transaction.setExpirationTime(expirationTime)).to.equal(
                transaction,
            );
            expect(transaction.setWaitForExpiry(true)).to.equal(transaction);

            expect(transaction.adminKey).to.equal(adminKey);
            expect(transaction.payerAccountId).to.equal(payerAccountId);
            expect(transaction.getScheduleMemo).to.equal("memo");
            expect(transaction.expirationTime).to.equal(expirationTime);
            expect(transaction.waitForExpiry).to.equal(true);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(
                new ScheduleCreateTransaction().setScheduledTransaction(
                    newTransfer(),
                ),
            );

            expect(() => transaction.setAdminKey(adminKey)).to.throw(
                "transaction is immutable",
            );
            expect(() =>
                transaction.setPayerAccountId(payerAccountId),
            ).to.throw("transaction is immutable");
            expect(() => transaction.setScheduleMemo("memo")).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setScheduledTransaction", function () {
        it("should keep the transaction to schedule", function () {
            const transfer = newTransfer();

            const transaction =
                new ScheduleCreateTransaction().setScheduledTransaction(
                    transfer,
                );

            expect(transaction._scheduledTransaction).to.equal(transfer);
        });

        it("should be chainable", function () {
            const transaction = new ScheduleCreateTransaction();

            expect(transaction.setScheduledTransaction(newTransfer())).to.equal(
                transaction,
            );
        });

        it("should throw when the transaction to schedule is frozen", function () {
            const transfer = freezeWithIds(newTransfer());

            expect(() =>
                new ScheduleCreateTransaction().setScheduledTransaction(
                    transfer,
                ),
            ).to.throw("transaction is immutable");
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(
                new ScheduleCreateTransaction().setScheduledTransaction(
                    newTransfer(),
                ),
            );

            expect(() =>
                transaction.setScheduledTransaction(newTransfer()),
            ).to.throw("transaction is immutable");
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            const transfer = newTransfer();
            const transaction = new ScheduleCreateTransaction()
                .setScheduledTransaction(transfer)
                .setAdminKey(adminKey)
                .setPayerAccountId(payerAccountId)
                .setScheduleMemo("memo")
                .setExpirationTime(expirationTime)
                .setWaitForExpiry(true);

            expect(transaction._makeTransactionData()).to.deep.equal({
                adminKey: adminKey._toProtobufKey(),
                payerAccountID: payerAccountId._toProtobuf(),
                scheduledTransactionBody:
                    transfer._getScheduledTransactionBody(),
                memo: "memo",
                waitForExpiry: true,
                expirationTime: expirationTime._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new ScheduleCreateTransaction()._makeTransactionData(),
            ).to.deep.equal({
                adminKey: null,
                payerAccountID: null,
                scheduledTransactionBody: null,
                memo: null,
                waitForExpiry: null,
                expirationTime: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        it("should leave missing fields null", function () {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            const decoded = ScheduleCreateTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [
                    {
                        scheduleCreate: {
                            scheduledTransactionBody:
                                newTransfer()._getScheduledTransactionBody(),
                        },
                    },
                ],
            );

            expect(decoded).to.be.instanceOf(ScheduleCreateTransaction);
            expect(decoded.adminKey).to.be.null;
            expect(decoded.payerAccountId).to.be.null;
            expect(decoded._scheduleMemo).to.be.null;
            expect(decoded._expirationTime).to.be.null;
            expect(decoded._waitForExpiry).to.be.null;
            expect(decoded._scheduledTransaction).to.be.instanceOf(
                TransferTransaction,
            );
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep the scheduled transaction, admin key and payer", function () {
            const transaction = freezeWithIds(
                new ScheduleCreateTransaction()
                    .setScheduledTransaction(newTransfer())
                    .setAdminKey(adminKey)
                    .setPayerAccountId(payerAccountId),
            );

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(ScheduleCreateTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.adminKey.toString()).to.equal(adminKey.toString());
            expect(decoded.payerAccountId.toString()).to.equal(
                payerAccountId.toString(),
            );

            // There is no public getter for the scheduled transaction.
            const scheduled = decoded._scheduledTransaction;
            expect(scheduled).to.be.instanceOf(TransferTransaction);
            expect(scheduled.hbarTransfers.size).to.equal(2);
            expect(
                scheduled.hbarTransfers.get("0.0.5007").toTinybars().toString(),
            ).to.equal("-100000000");
            expect(
                scheduled.hbarTransfers.get("0.0.5008").toTinybars().toString(),
            ).to.equal("100000000");
        });

        // TODO(#4681): fromBytes() drops the expiration time and wait for
        // expiry, and the getScheduleMemo, expirationTime and waitForExpiry
        // getters throw on a frozen transaction, which every transaction
        // fromBytes() returns is.
        it.skip("should keep the memo, expiration time and wait for expiry", function () {
            const transaction = freezeWithIds(
                new ScheduleCreateTransaction()
                    .setScheduledTransaction(newTransfer())
                    .setScheduleMemo("memo")
                    .setExpirationTime(expirationTime)
                    .setWaitForExpiry(true),
            );

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded.getScheduleMemo).to.equal("memo");
            expect(decoded.expirationTime.toString()).to.equal(
                expirationTime.toString(),
            );
            expect(decoded.waitForExpiry).to.equal(true);
        });
    });

    describe("_validateChecksums", function () {
        it("should validate the payer account ID checksum", function () {
            // AccountId.fromString() doesn't keep the checksum, so a stand-in
            // records the call instead.
            const client = Client.forMainnet({ scheduleNetworkUpdate: false });
            const clients = [];
            const transaction = new ScheduleCreateTransaction();
            transaction._payerAccountId = {
                validateChecksum: (arg) => clients.push(arg),
            };

            transaction._validateChecksums(client);

            expect(clients).to.deep.equal([client]);
            client.close();
        });

        it("should skip an unset payer", function () {
            const client = Client.forMainnet({ scheduleNetworkUpdate: false });

            expect(() =>
                new ScheduleCreateTransaction()._validateChecksums(client),
            ).to.not.throw();
            client.close();
        });
    });

    describe("_execute", function () {
        it("should call schedule.createSchedule() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                schedule: {
                    createSchedule: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new ScheduleCreateTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.have.lengthOf(1);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return scheduleCreate", function () {
            expect(
                new ScheduleCreateTransaction()._getTransactionDataCase(),
            ).to.equal("scheduleCreate");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(
                new ScheduleCreateTransaction().setScheduledTransaction(
                    newTransfer(),
                ),
            );

            expect(transaction._getLogId()).to.equal(
                `ScheduleCreateTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
