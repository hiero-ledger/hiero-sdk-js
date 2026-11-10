import {
    AccountId,
    Client,
    FileDeleteTransaction,
    FileId,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("FileDeleteTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let fileId, transactionId, nodeId;

    beforeEach(function () {
        fileId = new FileId(0, 0, 5005);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {FileDeleteTransaction} transaction
     * @returns {FileDeleteTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {FileDeleteTransaction}
     */
    function withAllFields() {
        return new FileDeleteTransaction().setFileId(fileId);
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new FileDeleteTransaction();

            expect(transaction.fileId).to.be.null;
        });

        it("should set the fields given in props", function () {
            const transaction = new FileDeleteTransaction({ fileId });

            expect(transaction.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept strings in props", function () {
            const transaction = new FileDeleteTransaction({
                fileId: "0.0.5005",
            });

            expect(transaction.fileId.toString()).to.equal("0.0.5005");
        });
    });

    describe("setFileId", function () {
        it("should accept an instance", function () {
            const transaction = new FileDeleteTransaction().setFileId(fileId);

            expect(transaction.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept a string", function () {
            const transaction = new FileDeleteTransaction().setFileId(
                "0.0.5005",
            );

            expect(transaction.fileId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const transaction = new FileDeleteTransaction().setFileId(fileId);

            expect(transaction.fileId).to.not.equal(fileId);
        });

        it("should be chainable", function () {
            const transaction = new FileDeleteTransaction();

            expect(transaction.setFileId(fileId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileDeleteTransaction());

            expect(() => transaction.setFileId(fileId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                fileID: fileId._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new FileDeleteTransaction()._makeTransactionData(),
            ).to.deep.equal({
                fileID: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the fileDelete body
         * @returns {FileDeleteTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return FileDeleteTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ fileDelete: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                fileID: fileId._toProtobuf(),
            });

            expect(transaction).to.be.instanceOf(FileDeleteTransaction);
            expect(transaction.fileId.toString()).to.equal(fileId.toString());
        });

        it("should leave missing fields null", function () {
            const transaction = fromBody({});

            expect(transaction.fileId).to.be.null;
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(FileDeleteTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.fileId.toString()).to.equal(fileId.toString());
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

        it("should check the file ID checksum against the client's network", function () {
            // 0.0.123-vfmkw has the mainnet checksum
            const transaction = new FileDeleteTransaction().setFileId(
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
                new FileDeleteTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call file.deleteFile() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                file: {
                    deleteFile: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new FileDeleteTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return fileDelete", function () {
            expect(
                new FileDeleteTransaction()._getTransactionDataCase(),
            ).to.equal("fileDelete");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new FileDeleteTransaction());

            expect(transaction._getLogId()).to.equal(
                `FileDeleteTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
