import {
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

    describe("_validateChecksums", function () {
        const TransactionType = FreezeTransaction;
        const field = "_fileId";

        it("passes the client to the ID validator", function () {
            const client = {};
            const clients = [];
            const transaction = new TransactionType();
            transaction[field] = {
                validateChecksum: (value) => clients.push(value),
            };

            transaction._validateChecksums(client);

            expect(clients).to.have.lengthOf(1);
            expect(clients[0]).to.equal(client);
        });

        it("skips an unset ID", function () {
            expect(() =>
                new TransactionType()._validateChecksums({}),
            ).to.not.throw();
        });
    });
});
