import {
    Client,
    FreezeTransaction,
    Timestamp,
    FreezeType,
    FileId,
    TransactionId,
    AccountId,
    Transaction,
} from "../../src/index.js";
import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import * as hex from "../../src/encoding/hex.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("FreezeTransaction", function () {
    it("create transaction and set", function () {
        const seconds = Math.round(Date.now() / 1000);
        const validStart = new Timestamp(seconds, 0);
        const freezeType = new FreezeType(1);

        const transaction = new FreezeTransaction()
            .setStartTimestamp(validStart)
            .setFreezeType(freezeType);

        expect(transaction).to.be.instanceof(FreezeTransaction);
        expect(transaction.startTimestamp).to.be.equal(validStart);
        expect(transaction.freezeType).to.be.instanceof(FreezeType);
        expect(transaction.freezeType.toString()).to.be.equal(
            freezeType.toString(),
        );
    });

    describe("_fromProtobuf", function () {
        it("should correctly deserialize from protobuf with all fields", function () {
            // Create test data
            const startTimestamp = new Timestamp(1624430225, 0);
            const fileId = new FileId(0, 0, 12345);
            const fileHash = hex.decode("1a2b3c4d5e6f");
            const freezeType = FreezeType.PrepareUpgrade;

            // Create transaction body
            const freezeBody = {
                startTime: startTimestamp._toProtobuf(),
                updateFile: fileId._toProtobuf(),
                fileHash: fileHash,
                freezeType: freezeType._code,
            };

            // Create transaction ID
            const transactionId = TransactionId.generate(
                new AccountId(0, 0, 5000),
            );

            const transactionBody = {
                transactionID: transactionId._toProtobuf(),
                nodeAccountID: new AccountId(0, 0, 3)._toProtobuf(),
                transactionFee: Long.fromNumber(100000000),
                transactionValidDuration: { seconds: Long.fromNumber(120) },
                freeze: freezeBody,
            };

            const bodyBytes =
                HieroProto.proto.TransactionBody.encode(
                    transactionBody,
                ).finish();

            const signedTransaction = {
                bodyBytes: bodyBytes,
                sigMap: { sigPair: [] },
            };

            const transaction = {
                signedTransactionBytes:
                    HieroProto.proto.SignedTransaction.encode(
                        signedTransaction,
                    ).finish(),
            };

            // Call _fromProtobuf with the mock data
            const freezeTransaction = FreezeTransaction._fromProtobuf(
                [transaction],
                [signedTransaction],
                [transactionId],
                [new AccountId(0, 0, 3)],
                [transactionBody],
            );

            // Verify transaction properties
            expect(
                freezeTransaction.startTimestamp.seconds.toNumber(),
            ).to.equal(startTimestamp.seconds.toNumber());
            expect(freezeTransaction.fileId.toString()).to.equal(
                fileId.toString(),
            );
            expect(hex.encode(freezeTransaction.fileHash)).to.equal(
                hex.encode(fileHash),
            );
            expect(freezeTransaction.freezeType.toString()).to.equal(
                freezeType.toString(),
            );
        });

        it("should correctly deserialize from protobuf with minimal fields", function () {
            // Create transaction ID
            const transactionId = TransactionId.generate(
                new AccountId(0, 0, 5000),
            );

            // Create transaction body with only freezeType
            const freezeBody = {
                freezeType: FreezeType.FreezeOnly._code,
            };

            const transactionBody = {
                transactionID: transactionId._toProtobuf(),
                nodeAccountID: new AccountId(0, 0, 3)._toProtobuf(),
                transactionFee: Long.fromNumber(100000000),
                transactionValidDuration: { seconds: Long.fromNumber(120) },
                freeze: freezeBody,
            };

            const bodyBytes =
                HieroProto.proto.TransactionBody.encode(
                    transactionBody,
                ).finish();

            const signedTransaction = {
                bodyBytes: bodyBytes,
                sigMap: { sigPair: [] },
            };

            const transaction = {
                signedTransactionBytes:
                    HieroProto.proto.SignedTransaction.encode(
                        signedTransaction,
                    ).finish(),
            };

            // Call _fromProtobuf with the mock data
            const freezeTransaction = FreezeTransaction._fromProtobuf(
                [transaction],
                [signedTransaction],
                [transactionId],
                [new AccountId(0, 0, 3)],
                [transactionBody],
            );

            // Verify transaction properties
            expect(freezeTransaction.startTimestamp).to.be.null;
            expect(freezeTransaction.fileId).to.be.null;
            expect(freezeTransaction.fileHash).to.be.null;
            expect(freezeTransaction.freezeType.toString()).to.equal(
                FreezeType.FreezeOnly.toString(),
            );
        });

        it("should correctly handle deprecated fields", function () {
            // Create test data with deprecated startHour/startMin fields
            const startHour = 10;
            const startMin = 30;
            const endHour = 14;
            const endMin = 45;
            const fileId = new FileId(0, 0, 12345);

            // Create transaction body
            const freezeBody = {
                startHour: startHour,
                startMin: startMin,
                endHour: endHour,
                endMin: endMin,
                updateFile: fileId._toProtobuf(),
            };

            // Create transaction ID
            const transactionId = TransactionId.generate(
                new AccountId(0, 0, 5000),
            );

            const transactionBody = {
                transactionID: transactionId._toProtobuf(),
                nodeAccountID: new AccountId(0, 0, 3)._toProtobuf(),
                transactionFee: Long.fromNumber(100000000),
                transactionValidDuration: { seconds: Long.fromNumber(120) },
                freeze: freezeBody,
            };

            const bodyBytes =
                HieroProto.proto.TransactionBody.encode(
                    transactionBody,
                ).finish();

            const signedTransaction = {
                bodyBytes: bodyBytes,
                sigMap: { sigPair: [] },
            };

            const transaction = {
                signedTransactionBytes:
                    HieroProto.proto.SignedTransaction.encode(
                        signedTransaction,
                    ).finish(),
            };

            // Call _fromProtobuf with the mock data
            const freezeTransaction = FreezeTransaction._fromProtobuf(
                [transaction],
                [signedTransaction],
                [transactionId],
                [new AccountId(0, 0, 3)],
                [transactionBody],
            );

            // The startTime and endTime are deprecated but we should verify the values were properly deserialized
            // Note: direct access to private property for test purposes
            expect(freezeTransaction._startTime).to.deep.equal({
                hour: startHour,
                minute: startMin,
            });
            expect(freezeTransaction._endTime).to.deep.equal({
                hour: endHour,
                minute: endMin,
            });

            // The updateFileId is mapped to fileId
            expect(freezeTransaction.fileId.toString()).to.equal(
                fileId.toString(),
            );
        });
    });

    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
        const startTimestamp = new Timestamp(1700000000, 0);
        const fileHash = Uint8Array.of(1, 2, 3);

        // setStartTime() and setEndTime() are deprecated and not sent to the
        // network, so they can't survive a round trip.
        const tx = new FreezeTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setStartTimestamp(startTimestamp)
            .setFileId(FileId.fromString("0.0.150"))
            .setFileHash(fileHash)
            .setFreezeType(FreezeType.PrepareUpgrade)
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(FreezeTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.startTimestamp.toString()).to.equal(
            startTimestamp.toString(),
        );
        expect(tx2.fileId.toString()).to.equal("0.0.150");
        expect(tx2.fileHash).to.deep.equal(fileHash);
        expect(tx2.freezeType).to.equal(FreezeType.PrepareUpgrade);
    });

    describe("fields", function () {
        const VALID_START = new Timestamp(1596210382, 0);
        const START_TIMESTAMP = new Timestamp(1596300000, 0);

        let fileId, fileHash, transactionId, nodeId;

        beforeEach(function () {
            fileId = new FileId(0, 0, 150);
            fileHash = hex.decode("1a2b3c4d5e6f");
            transactionId = TransactionId.withValidStart(
                new AccountId(0, 0, 1001),
                VALID_START,
            );
            nodeId = new AccountId(0, 0, 3);
        });

        /**
         * @param {FreezeTransaction} transaction
         * @returns {FreezeTransaction}
         */
        function freezeWithIds(transaction) {
            return transaction
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze();
        }

        /**
         * @returns {FreezeTransaction}
         */
        function withAllFields() {
            return new FreezeTransaction()
                .setStartTimestamp(START_TIMESTAMP)
                .setFileId(fileId)
                .setFileHash(fileHash)
                .setFreezeType(FreezeType.FreezeUpgrade);
        }

        describe("constructor", function () {
            it("should default every field to null", function () {
                const transaction = new FreezeTransaction();

                expect(transaction.startTimestamp).to.be.null;
                expect(transaction.fileId).to.be.null;
                expect(transaction.fileHash).to.be.null;
                expect(transaction.freezeType).to.be.null;
            });

            it("should set the fields given in props", function () {
                const transaction = new FreezeTransaction({
                    startTimestamp: START_TIMESTAMP,
                    fileId,
                    fileHash,
                    freezeType: FreezeType.FreezeUpgrade,
                });

                expect(transaction.startTimestamp).to.equal(START_TIMESTAMP);
                expect(transaction.fileId).to.equal(fileId);
                expect(transaction.fileHash).to.equal(fileHash);
                expect(transaction.freezeType).to.equal(
                    FreezeType.FreezeUpgrade,
                );
            });

            it("should decode a hex fileHash in props", function () {
                const transaction = new FreezeTransaction({
                    fileHash: "1a2b3c4d5e6f",
                });

                expect(transaction.fileHash).to.deep.equal(fileHash);
            });
        });

        describe("setters", function () {
            it("should be chainable", function () {
                const transaction = new FreezeTransaction();

                expect(transaction.setStartTimestamp(START_TIMESTAMP)).to.equal(
                    transaction,
                );
                expect(transaction.setFileId(fileId)).to.equal(transaction);
                expect(transaction.setFileHash(fileHash)).to.equal(transaction);
                expect(
                    transaction.setFreezeType(FreezeType.FreezeOnly),
                ).to.equal(transaction);
            });

            it("setFileHash() should decode a hex string", function () {
                const transaction = new FreezeTransaction().setFileHash(
                    "1a2b3c4d5e6f",
                );

                expect(transaction.fileHash).to.deep.equal(fileHash);
            });

            it("should throw once frozen", function () {
                const transaction = freezeWithIds(new FreezeTransaction());

                expect(() =>
                    transaction.setStartTimestamp(START_TIMESTAMP),
                ).to.throw("transaction is immutable");
                expect(() => transaction.setFileId(fileId)).to.throw(
                    "transaction is immutable",
                );
                expect(() => transaction.setFileHash(fileHash)).to.throw(
                    "transaction is immutable",
                );
                expect(() =>
                    transaction.setFreezeType(FreezeType.FreezeOnly),
                ).to.throw("transaction is immutable");
            });
        });

        describe("_makeTransactionData", function () {
            it("should encode every field", function () {
                expect(withAllFields()._makeTransactionData()).to.deep.equal({
                    startTime: START_TIMESTAMP._toProtobuf(),
                    updateFile: fileId._toProtobuf(),
                    fileHash,
                    freezeType: FreezeType.FreezeUpgrade.valueOf(),
                });
            });

            it("should encode unset fields as null", function () {
                expect(
                    new FreezeTransaction()._makeTransactionData(),
                ).to.deep.equal({
                    startTime: null,
                    updateFile: null,
                    fileHash: null,
                    freezeType: null,
                });
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

            // TODO(#4683): FreezeTransaction doesn't validate the file ID checksum.
            it.skip("should check the file ID checksum against the client's network", function () {
                // 0.0.123-vfmkw has the mainnet checksum
                const transaction = new FreezeTransaction().setFileId(
                    FileId.fromString("0.0.123-vfmkw"),
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
                    new FreezeTransaction()._validateChecksums(testnet),
                ).to.not.throw();
            });
        });

        describe("_execute", function () {
            it("should call freeze.freeze() with the request", async function () {
                const request = {};
                const response = {};
                const calls = [];
                const channel = {
                    freeze: {
                        freeze: (arg) => {
                            calls.push(arg);
                            return Promise.resolve(response);
                        },
                    },
                };

                expect(
                    await new FreezeTransaction()._execute(channel, request),
                ).to.equal(response);
                expect(calls).to.deep.equal([request]);
                expect(calls[0]).to.equal(request);
            });
        });

        describe("_getTransactionDataCase", function () {
            it("should return freeze", function () {
                expect(
                    new FreezeTransaction()._getTransactionDataCase(),
                ).to.equal("freeze");
            });
        });

        describe("_getLogId", function () {
            it("should include the class name and valid start", function () {
                const transaction = freezeWithIds(new FreezeTransaction());

                expect(transaction._getLogId()).to.equal(
                    `FreezeTransaction:${VALID_START.toString()}`,
                );
            });
        });
    });
});
