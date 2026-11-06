import {
    AccountId,
    Client,
    Hbar,
    ScheduleDeleteTransaction,
    ScheduleId,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("ScheduleDeleteTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let scheduleId, transactionId, nodeId;

    beforeEach(function () {
        scheduleId = new ScheduleId(0, 0, 5005);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {ScheduleDeleteTransaction} transaction
     * @returns {ScheduleDeleteTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {ScheduleDeleteTransaction}
     */
    function withAllFields() {
        return new ScheduleDeleteTransaction().setScheduleId(scheduleId);
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new ScheduleDeleteTransaction();

            expect(transaction.scheduleId).to.be.null;
        });

        it("should set the fields given in props", function () {
            const transaction = new ScheduleDeleteTransaction({ scheduleId });

            expect(transaction.scheduleId.toString()).to.equal(
                scheduleId.toString(),
            );
        });

        it("should accept strings in props", function () {
            const transaction = new ScheduleDeleteTransaction({
                scheduleId: "0.0.5005",
            });

            expect(transaction.scheduleId.toString()).to.equal("0.0.5005");
        });

        it("should default the max transaction fee to 5 Hbar", function () {
            const transaction = new ScheduleDeleteTransaction();

            expect(
                transaction._defaultMaxTransactionFee.toTinybars().toString(),
            ).to.equal(new Hbar(5).toTinybars().toString());
        });
    });

    describe("setScheduleId", function () {
        it("should accept an instance", function () {
            const transaction = new ScheduleDeleteTransaction().setScheduleId(
                scheduleId,
            );

            expect(transaction.scheduleId.toString()).to.equal(
                scheduleId.toString(),
            );
        });

        it("should accept a string", function () {
            const transaction = new ScheduleDeleteTransaction().setScheduleId(
                "0.0.5005",
            );

            expect(transaction.scheduleId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const transaction = new ScheduleDeleteTransaction().setScheduleId(
                scheduleId,
            );

            expect(transaction.scheduleId).to.not.equal(scheduleId);
        });

        it("should be chainable", function () {
            const transaction = new ScheduleDeleteTransaction();

            expect(transaction.setScheduleId(scheduleId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new ScheduleDeleteTransaction());

            expect(() => transaction.setScheduleId(scheduleId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                scheduleID: scheduleId._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new ScheduleDeleteTransaction()._makeTransactionData(),
            ).to.deep.equal({
                scheduleID: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the scheduleDelete body
         * @returns {ScheduleDeleteTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return ScheduleDeleteTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ scheduleDelete: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                scheduleID: scheduleId._toProtobuf(),
            });

            expect(transaction).to.be.instanceOf(ScheduleDeleteTransaction);
            expect(transaction.scheduleId.toString()).to.equal(
                scheduleId.toString(),
            );
        });

        it("should leave missing fields null", function () {
            const transaction = fromBody({});

            expect(transaction.scheduleId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(ScheduleDeleteTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.scheduleId.toString()).to.equal(
                scheduleId.toString(),
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

        it("should check the schedule ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const transaction = new ScheduleDeleteTransaction().setScheduleId(
                ScheduleId.fromString("0.0.123-vfmkw"),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should skip unset fields", function () {
            expect(() =>
                new ScheduleDeleteTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call schedule.deleteSchedule() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                schedule: {
                    deleteSchedule: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new ScheduleDeleteTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return scheduleDelete", function () {
            expect(
                new ScheduleDeleteTransaction()._getTransactionDataCase(),
            ).to.equal("scheduleDelete");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new ScheduleDeleteTransaction());

            expect(transaction._getLogId()).to.equal(
                `ScheduleDeleteTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
