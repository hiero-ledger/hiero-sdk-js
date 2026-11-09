import {
    AccountId,
    FileCreateTransaction,
    Hbar,
    KeyList,
    PrivateKey,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import { DEFAULT_AUTO_RENEW_PERIOD } from "../../src/transaction/Transaction.js";

describe("FileCreateTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let keys, expirationTime, contents, transactionId, nodeId;

    beforeEach(function () {
        keys = [
            PrivateKey.generateED25519().publicKey,
            PrivateKey.generateECDSA().publicKey,
        ];
        expirationTime = new Timestamp(1700000000, 0);
        contents = Uint8Array.of(1, 2, 3);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {FileCreateTransaction} transaction
     * @returns {FileCreateTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {FileCreateTransaction}
     */
    function withAllFields() {
        return new FileCreateTransaction()
            .setKeys(keys)
            .setExpirationTime(expirationTime)
            .setContents(contents)
            .setFileMemo("memo");
    }

    /**
     * @param {?import("../../src/Key.js").default[]} list
     * @returns {?string[]}
     */
    function toStrings(list) {
        return list != null ? list.map((key) => key.toString()) : null;
    }

    describe("constructor", function () {
        it("should default the keys, contents and memo to null", function () {
            const transaction = new FileCreateTransaction();

            expect(transaction.keys).to.be.null;
            expect(transaction.contents).to.be.null;
            expect(transaction.fileMemo).to.be.null;
        });

        it("should default the expiration time to now plus the default auto renew period", function () {
            const before = Math.floor(Date.now() / 1000);
            const transaction = new FileCreateTransaction();
            const after = Math.ceil(Date.now() / 1000);

            const seconds = transaction.expirationTime.seconds.toNumber();
            const period = DEFAULT_AUTO_RENEW_PERIOD.toNumber();

            expect(seconds).to.be.within(before + period, after + period);
        });

        it("should set the fields given in props", function () {
            const transaction = new FileCreateTransaction({
                keys,
                expirationTime,
                contents,
                fileMemo: "memo",
            });

            expect(toStrings(transaction.keys)).to.deep.equal(toStrings(keys));
            expect(transaction.expirationTime.toString()).to.equal(
                expirationTime.toString(),
            );
            expect(transaction.contents).to.deep.equal(contents);
            expect(transaction.fileMemo).to.equal("memo");
        });

        it("should default the max transaction fee to 5 Hbar", function () {
            const transaction = new FileCreateTransaction();

            expect(
                transaction._defaultMaxTransactionFee.toTinybars().toString(),
            ).to.equal(new Hbar(5).toTinybars().toString());
        });
    });

    describe("setKeys", function () {
        it("should accept a list of keys", function () {
            const transaction = new FileCreateTransaction().setKeys(keys);

            expect(toStrings(transaction.keys)).to.deep.equal(toStrings(keys));
        });

        it("should accept a KeyList without a threshold", function () {
            const transaction = new FileCreateTransaction().setKeys(
                KeyList.from(keys),
            );

            expect(toStrings(transaction.keys)).to.deep.equal(toStrings(keys));
        });

        it("should reject a KeyList with a threshold", function () {
            const transaction = new FileCreateTransaction();

            expect(() =>
                transaction.setKeys(KeyList.of(...keys).setThreshold(1)),
            ).to.throw("Cannot set threshold key as file key");
        });

        it("should be chainable", function () {
            const transaction = new FileCreateTransaction();

            expect(transaction.setKeys(keys)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileCreateTransaction());

            expect(() => transaction.setKeys(keys)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setExpirationTime", function () {
        it("should accept a Timestamp", function () {
            const transaction = new FileCreateTransaction().setExpirationTime(
                expirationTime,
            );

            expect(transaction.expirationTime).to.equal(expirationTime);
        });

        it("should accept a Date", function () {
            const date = new Date(1700000000000);

            const transaction = new FileCreateTransaction().setExpirationTime(
                date,
            );

            expect(transaction.expirationTime).to.be.instanceOf(Timestamp);
            expect(transaction.expirationTime.toDate().getTime()).to.equal(
                date.getTime(),
            );
        });

        it("should be chainable", function () {
            const transaction = new FileCreateTransaction();

            expect(transaction.setExpirationTime(expirationTime)).to.equal(
                transaction,
            );
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileCreateTransaction());

            expect(() =>
                transaction.setExpirationTime(expirationTime),
            ).to.throw("transaction is immutable");
        });
    });

    describe("setContents", function () {
        it("should accept bytes", function () {
            const transaction = new FileCreateTransaction().setContents(
                contents,
            );

            expect(transaction.contents).to.deep.equal(contents);
        });

        it("should encode a string as UTF-8", function () {
            const transaction = new FileCreateTransaction().setContents("hé");

            expect(transaction.contents).to.deep.equal(
                Uint8Array.of(0x68, 0xc3, 0xa9),
            );
        });

        it("should be chainable", function () {
            const transaction = new FileCreateTransaction();

            expect(transaction.setContents(contents)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileCreateTransaction());

            expect(() => transaction.setContents(contents)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setFileMemo", function () {
        it("should set the memo", function () {
            const transaction = new FileCreateTransaction().setFileMemo("memo");

            expect(transaction.fileMemo).to.equal("memo");
        });

        it("should be chainable", function () {
            const transaction = new FileCreateTransaction();

            expect(transaction.setFileMemo("memo")).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(new FileCreateTransaction());

            expect(() => transaction.setFileMemo("memo")).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                keys: { keys: keys.map((key) => key._toProtobufKey()) },
                expirationTime: expirationTime._toProtobuf(),
                contents,
                memo: "memo",
            });
        });

        it("should encode unset fields as null", function () {
            const transaction = new FileCreateTransaction();

            expect(transaction._makeTransactionData()).to.deep.equal({
                keys: null,
                expirationTime: transaction.expirationTime._toProtobuf(),
                contents: null,
                memo: null,
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the fileCreate body
         * @returns {FileCreateTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return FileCreateTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ fileCreate: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                keys: { keys: keys.map((key) => key._toProtobufKey()) },
                expirationTime: expirationTime._toProtobuf(),
                contents,
                memo: "memo",
            });

            expect(transaction).to.be.instanceOf(FileCreateTransaction);
            expect(toStrings(transaction.keys)).to.deep.equal(toStrings(keys));
            expect(transaction.expirationTime.toString()).to.equal(
                expirationTime.toString(),
            );
            expect(transaction.contents).to.deep.equal(contents);
            expect(transaction.fileMemo).to.equal("memo");
        });

        it("should leave the keys null when the key list has no keys", function () {
            const transaction = fromBody({ keys: {} });

            expect(transaction.keys).to.be.null;
        });

        it("should leave missing fields at their defaults", function () {
            const transaction = fromBody({});

            expect(transaction.keys).to.be.null;
            expect(transaction.contents).to.be.null;
            expect(transaction.fileMemo).to.be.null;
            expect(transaction.expirationTime).to.be.instanceOf(Timestamp);
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(FileCreateTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(toStrings(decoded.keys)).to.deep.equal(toStrings(keys));
            expect(decoded.expirationTime.toString()).to.equal(
                expirationTime.toString(),
            );
            expect(decoded.contents).to.deep.equal(contents);
            expect(decoded.fileMemo).to.equal("memo");
        });
    });

    describe("_execute", function () {
        it("should call file.createFile() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                file: {
                    createFile: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new FileCreateTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.have.lengthOf(1);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return fileCreate", function () {
            expect(
                new FileCreateTransaction()._getTransactionDataCase(),
            ).to.equal("fileCreate");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(new FileCreateTransaction());

            expect(transaction._getLogId()).to.equal(
                `FileCreateTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
