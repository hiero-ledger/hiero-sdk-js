import {
    AccountId,
    Client,
    FileId,
    FileUpdateTransaction,
    KeyList,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("FileUpdateTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);
    const EXPIRATION_TIME = new Timestamp(1596300000, 0);

    let fileId, key1, key2, transactionId, nodeId;

    beforeEach(function () {
        fileId = new FileId(0, 0, 5005);
        key1 = PrivateKey.generateED25519().publicKey;
        key2 = PrivateKey.generateECDSA().publicKey;
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {FileUpdateTransaction} transaction
     * @returns {FileUpdateTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {FileUpdateTransaction}
     */
    function withAllFields() {
        return new FileUpdateTransaction()
            .setFileId(fileId)
            .setKeys([key1, key2])
            .setExpirationTime(EXPIRATION_TIME)
            .setContents(new TextEncoder().encode("contents"))
            .setFileMemo("memo");
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new FileUpdateTransaction();

            expect(transaction.fileId).to.be.null;
            expect(transaction.keys).to.be.null;
            expect(transaction.expirationTime).to.be.null;
            expect(transaction.contents).to.be.null;
            expect(transaction.fileMemo).to.be.null;
        });

        it("should set the fields given in props", function () {
            const contents = new TextEncoder().encode("contents");
            const transaction = new FileUpdateTransaction({
                fileId,
                keys: [key1],
                expirationTime: EXPIRATION_TIME,
                contents,
                fileMemo: "memo",
            });

            expect(transaction.fileId.toString()).to.equal(fileId.toString());
            expect(transaction.keys).to.deep.equal([key1]);
            expect(transaction.expirationTime).to.equal(EXPIRATION_TIME);
            expect(transaction.contents).to.equal(contents);
            expect(transaction.fileMemo).to.equal("memo");
        });

        it("should accept strings in props", function () {
            const transaction = new FileUpdateTransaction({
                fileId: "0.0.5005",
                contents: "contents",
            });

            expect(transaction.fileId.toString()).to.equal("0.0.5005");
            expect(transaction.contents).to.deep.equal(
                new TextEncoder().encode("contents"),
            );
        });
    });

    describe("setFileId", function () {
        it("should accept an instance", function () {
            const transaction = new FileUpdateTransaction().setFileId(fileId);

            expect(transaction.fileId.toString()).to.equal(fileId.toString());
        });

        it("should accept a string", function () {
            const transaction = new FileUpdateTransaction().setFileId(
                "0.0.5005",
            );

            expect(transaction.fileId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const transaction = new FileUpdateTransaction().setFileId(fileId);

            expect(transaction.fileId).to.not.equal(fileId);
        });

        it("should be chainable", function () {
            const transaction = new FileUpdateTransaction();

            expect(transaction.setFileId(fileId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileUpdateTransaction());

            expect(() => transaction.setFileId(fileId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setKeys", function () {
        it("should accept an array of keys", function () {
            const transaction = new FileUpdateTransaction().setKeys([
                key1,
                key2,
            ]);

            expect(transaction.keys).to.deep.equal([key1, key2]);
        });

        it("should accept a KeyList without a threshold", function () {
            const transaction = new FileUpdateTransaction().setKeys(
                new KeyList([key1, key2]),
            );

            expect(transaction.keys).to.deep.equal([key1, key2]);
        });

        it("should throw for a KeyList with a threshold", function () {
            expect(() =>
                new FileUpdateTransaction().setKeys(
                    new KeyList([key1, key2], 1),
                ),
            ).to.throw("Cannot set threshold key as file key");
        });

        it("should be chainable", function () {
            const transaction = new FileUpdateTransaction();

            expect(transaction.setKeys([key1])).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileUpdateTransaction());

            expect(() => transaction.setKeys([key1])).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setExpirationTime", function () {
        it("should accept a Timestamp", function () {
            const transaction = new FileUpdateTransaction().setExpirationTime(
                EXPIRATION_TIME,
            );

            expect(transaction.expirationTime).to.equal(EXPIRATION_TIME);
        });

        it("should accept a Date", function () {
            const transaction = new FileUpdateTransaction().setExpirationTime(
                new Date(1596300000000),
            );

            expect(transaction.expirationTime.seconds.toNumber()).to.equal(
                1596300000,
            );
            expect(transaction.expirationTime.nanos.toNumber()).to.equal(0);
        });

        it("should be chainable", function () {
            const transaction = new FileUpdateTransaction();

            expect(transaction.setExpirationTime(EXPIRATION_TIME)).to.equal(
                transaction,
            );
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileUpdateTransaction());

            expect(() =>
                transaction.setExpirationTime(EXPIRATION_TIME),
            ).to.throw("transaction is immutable");
        });
    });

    describe("setContents", function () {
        it("should accept bytes", function () {
            const contents = new TextEncoder().encode("contents");
            const transaction = new FileUpdateTransaction().setContents(
                contents,
            );

            expect(transaction.contents).to.equal(contents);
        });

        it("should encode a string as UTF-8", function () {
            const transaction = new FileUpdateTransaction().setContents("ℏbar");

            expect(transaction.contents).to.deep.equal(
                new TextEncoder().encode("ℏbar"),
            );
        });

        it("should be chainable", function () {
            const transaction = new FileUpdateTransaction();

            expect(transaction.setContents("contents")).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileUpdateTransaction());

            expect(() => transaction.setContents("contents")).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setFileMemo", function () {
        it("should set the memo and be chainable", function () {
            const transaction = new FileUpdateTransaction();

            expect(transaction.setFileMemo("memo")).to.equal(transaction);
            expect(transaction.fileMemo).to.equal("memo");
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileUpdateTransaction());

            expect(() => transaction.setFileMemo("memo")).to.throw(
                "transaction is immutable",
            );
            expect(() => transaction.clearFileMemo()).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("deserialization of optional parameters", function () {
        it("should deserialize with fileMemo being null", function () {
            const tx = new FileUpdateTransaction();
            const tx2 = FileUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.fileMemo).to.be.null;
            expect(tx2.fileMemo).to.be.null;
        });
    });

    describe("clearFileMemo", function () {
        it("should send an empty memo wrapper when the memo is cleared", function () {
            const tx = new FileUpdateTransaction()
                .setFileMemo("old memo")
                .clearFileMemo();

            expect(tx.fileMemo).to.equal("");
            expect(tx._makeTransactionData().memo).to.deep.equal({
                value: "",
            });
        });

        it("should keep an explicitly empty memo through a bytes round trip", function () {
            const tx = new FileUpdateTransaction().clearFileMemo();
            const tx2 = FileUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx2.fileMemo).to.equal("");
            expect(tx2._makeTransactionData().memo).to.deep.equal({
                value: "",
            });
        });

        it("should not send a memo wrapper when the memo was never set", function () {
            const tx = new FileUpdateTransaction();

            expect(tx._makeTransactionData().memo).to.be.null;
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                fileID: fileId._toProtobuf(),
                keys: {
                    keys: [key1._toProtobufKey(), key2._toProtobufKey()],
                },
                expirationTime: EXPIRATION_TIME._toProtobuf(),
                contents: new TextEncoder().encode("contents"),
                memo: { value: "memo" },
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new FileUpdateTransaction()._makeTransactionData(),
            ).to.deep.equal({
                fileID: null,
                keys: null,
                expirationTime: null,
                contents: null,
                memo: null,
            });
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(FileUpdateTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.fileId.toString()).to.equal(fileId.toString());
            expect(decoded.keys.map(String)).to.deep.equal([
                key1.toString(),
                key2.toString(),
            ]);
            expect(decoded.expirationTime.toString()).to.equal(
                EXPIRATION_TIME.toString(),
            );
            expect(new TextDecoder().decode(decoded.contents)).to.equal(
                "contents",
            );
            expect(decoded.fileMemo).to.equal("memo");
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
            const transaction = new FileUpdateTransaction().setFileId(
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
                new FileUpdateTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call file.updateFile() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                file: {
                    updateFile: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new FileUpdateTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return fileUpdate", function () {
            expect(
                new FileUpdateTransaction()._getTransactionDataCase(),
            ).to.equal("fileUpdate");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new FileUpdateTransaction());

            expect(transaction._getLogId()).to.equal(
                `FileUpdateTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
