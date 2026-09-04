import {
    AccountId,
    Client,
    ContractId,
    FileId,
    LedgerId,
    PrivateKey,
    SystemDeleteTransaction,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";

describe("SystemDeleteTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    let fileId;
    let contractId;
    let expirationTime;
    let transactionId;
    let nodeId;
    let privateKey;

    beforeEach(function () {
        fileId = new FileId(0, 0, 5005);
        contractId = new ContractId(0, 0, 4444);
        expirationTime = new Timestamp(1700000000, 0);
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 5555),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
        privateKey = PrivateKey.generateED25519();
    });

    /**
     * @param {SystemDeleteTransaction} transaction
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    describe("constructor", function () {
        it("should default every field to null", function () {
            const transaction = new SystemDeleteTransaction();

            expect(transaction.fileId).to.be.null;
            expect(transaction.contractId).to.be.null;
            expect(transaction.expirationTime).to.be.null;
        });

        it("should set the fields given in props", function () {
            const transaction = new SystemDeleteTransaction({
                fileId,
                expirationTime,
            });

            expect(transaction.fileId.toString()).to.equal(fileId.toString());
            expect(transaction.expirationTime.seconds.toInt()).to.equal(
                expirationTime.seconds.toInt(),
            );
        });

        it("should accept a contract id in props", function () {
            const transaction = new SystemDeleteTransaction({ contractId });

            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(transaction.fileId).to.be.null;
        });
    });

    describe("id setters", function () {
        it("should accept an instance or a string", function () {
            expect(
                new SystemDeleteTransaction()
                    .setFileId(fileId)
                    .fileId.toString(),
            ).to.equal(fileId.toString());
            expect(
                new SystemDeleteTransaction()
                    .setFileId("0.0.5005")
                    .fileId.toString(),
            ).to.equal(fileId.toString());
            expect(
                new SystemDeleteTransaction()
                    .setContractId(contractId)
                    .contractId.toString(),
            ).to.equal(contractId.toString());
            expect(
                new SystemDeleteTransaction()
                    .setContractId("0.0.4444")
                    .contractId.toString(),
            ).to.equal(contractId.toString());
        });

        it("should be chainable", function () {
            const transaction = new SystemDeleteTransaction();

            expect(transaction.setFileId(fileId)).to.equal(transaction);
            expect(transaction.setContractId(contractId)).to.equal(transaction);
            expect(transaction.setExpirationTime(expirationTime)).to.equal(
                transaction,
            );
        });

        it("should store a copy rather than the caller's instance", function () {
            const transaction = new SystemDeleteTransaction()
                .setFileId(fileId)
                .setExpirationTime(expirationTime);

            expect(transaction.fileId).to.not.equal(fileId);
            expect(transaction.fileId.toString()).to.equal(fileId.toString());

            const contractTransaction =
                new SystemDeleteTransaction().setContractId(contractId);

            expect(contractTransaction.contractId).to.not.equal(contractId);
            expect(contractTransaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
        });

        // `fileID` and `contractID` are a protobuf `oneof`, so only one may
        // ever be set: writing both encodes both fields and the node decodes
        // the second one, silently discarding the file id.
        it("should clear the file id when a contract id is set", function () {
            const transaction = new SystemDeleteTransaction()
                .setFileId(fileId)
                .setContractId(contractId);

            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(transaction.fileId).to.be.null;
        });

        it("should clear the contract id when a file id is set", function () {
            const transaction = new SystemDeleteTransaction()
                .setContractId(contractId)
                .setFileId(fileId);

            expect(transaction.fileId.toString()).to.equal(fileId.toString());
            expect(transaction.contractId).to.be.null;
        });

        it("should never encode both ids at once", function () {
            const data = new SystemDeleteTransaction()
                .setFileId(fileId)
                .setContractId(contractId)
                ._makeTransactionData();

            expect(data.contractID.contractNum.toInt()).to.equal(4444);
            expect(data.fileID).to.be.null;
        });

        it("should reject mutation once frozen", function () {
            const transaction = freezeWithIds(
                new SystemDeleteTransaction().setFileId(fileId),
            );

            expect(() => transaction.setFileId(fileId)).to.throw();
            expect(() => transaction.setContractId(contractId)).to.throw();
            expect(() =>
                transaction.setExpirationTime(expirationTime),
            ).to.throw();
        });
    });

    describe("setExpirationTime", function () {
        it("should accept a Timestamp", function () {
            const transaction = new SystemDeleteTransaction().setExpirationTime(
                expirationTime,
            );

            expect(transaction.expirationTime.seconds.toInt()).to.equal(
                expirationTime.seconds.toInt(),
            );
        });

        it("should accept a Date", function () {
            const date = new Date(1700000000000);
            const transaction = new SystemDeleteTransaction().setExpirationTime(
                date,
            );

            expect(transaction.expirationTime).to.be.instanceOf(Timestamp);
            expect(transaction.expirationTime.seconds.toInt()).to.equal(
                Math.floor(date.getTime() / 1000),
            );
        });

        // The wire field is `TimestampSeconds`, so nanos cannot survive encoding.
        it("should drop nanoseconds across a round trip", function () {
            const transaction = freezeWithIds(
                new SystemDeleteTransaction()
                    .setFileId(fileId)
                    .setExpirationTime(new Timestamp(1700000000, 123456789)),
            );

            const deserialized = /** @type {SystemDeleteTransaction} */ (
                Transaction.fromBytes(transaction.toBytes())
            );

            expect(deserialized.expirationTime.seconds.toInt()).to.equal(
                1700000000,
            );
            expect(deserialized.expirationTime.nanos.toInt()).to.equal(0);
        });
    });

    describe("_makeTransactionData", function () {
        it("should report the systemDelete data case", function () {
            expect(
                new SystemDeleteTransaction()._getTransactionDataCase(),
            ).to.equal("systemDelete");
        });

        it("should carry the file id and leave the contract id null", function () {
            const data = new SystemDeleteTransaction()
                .setFileId(fileId)
                .setExpirationTime(expirationTime)
                ._makeTransactionData();

            expect(data.fileID.fileNum.toInt()).to.equal(5005);
            expect(data.contractID).to.be.null;
            expect(data.expirationTime.seconds.toInt()).to.equal(
                expirationTime.seconds.toInt(),
            );
        });

        it("should carry the contract id and leave the file id null", function () {
            const data = new SystemDeleteTransaction()
                .setContractId(contractId)
                ._makeTransactionData();

            expect(data.contractID.contractNum.toInt()).to.equal(4444);
            expect(data.fileID).to.be.null;
            expect(data.expirationTime).to.be.null;
        });
    });

    describe("_fromProtobuf", function () {
        const mockTransaction = {
            bodyBytes: Uint8Array.from([0]),
            sigMap: { sigPair: [] },
        };

        /**
         * A decoded body only ever carries one of the two ids: protobufjs
         * deletes the losing field of a `oneof` while decoding.
         */
        function fromBody(systemDelete, ids) {
            return SystemDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockTransaction],
                [ids.transactionId],
                [ids.nodeId],
                [{ systemDelete }],
            );
        }

        it("should deserialize a file body with an expiration", function () {
            const transaction = fromBody(
                {
                    fileID: fileId._toProtobuf(),
                    expirationTime: expirationTime._toProtobuf(),
                },
                { transactionId, nodeId },
            );

            expect(transaction).to.be.instanceOf(SystemDeleteTransaction);
            expect(transaction.fileId.toString()).to.equal(fileId.toString());
            expect(transaction.contractId).to.be.null;
            expect(transaction.expirationTime.seconds.toInt()).to.equal(
                expirationTime.seconds.toInt(),
            );
        });

        it("should deserialize a contract body", function () {
            const transaction = fromBody(
                { contractID: contractId._toProtobuf() },
                { transactionId, nodeId },
            );

            expect(transaction.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(transaction.fileId).to.be.null;
        });

        it("should deserialize an empty body", function () {
            const transaction = fromBody({}, { transactionId, nodeId });

            expect(transaction.fileId).to.be.null;
            expect(transaction.contractId).to.be.null;
            expect(transaction.expirationTime).to.be.null;
        });
    });

    describe("_validateChecksums", function () {
        /**
         * @param {string} field
         */
        function spyId(field, value) {
            return {
                shard: 0,
                realm: 0,
                [field]: value,
                _checksum: "abcde",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };
        }

        it("should validate both ids when present", function () {
            const client = new Client({ ledgerId: new LedgerId("mainnet") });
            const mockFileId = spyId("file", 5005);
            const mockContractId = spyId("contract", 4444);

            const transaction = new SystemDeleteTransaction();
            transaction._fileId = mockFileId;
            transaction._contractId = mockContractId;

            transaction._validateChecksums(client);

            expect(mockFileId.validateChecksumCalled).to.be.true;
            expect(mockContractId.validateChecksumCalled).to.be.true;
        });

        it("should handle null ids", function () {
            const client = new Client({ ledgerId: new LedgerId("mainnet") });
            const transaction = new SystemDeleteTransaction();

            expect(() => transaction._validateChecksums(client)).to.not.throw();
        });
    });

    describe("_execute", function () {
        function stubChannel(calls) {
            return {
                file: {
                    systemDelete: () => {
                        calls.push("file");
                        return Promise.resolve({});
                    },
                },
                smartContract: {
                    systemDelete: () => {
                        calls.push("smartContract");
                        return Promise.resolve({});
                    },
                },
            };
        }

        it("should submit to the file service when a file id is set", async function () {
            const calls = [];

            await new SystemDeleteTransaction()
                .setFileId(fileId)
                ._execute(stubChannel(calls), {});

            expect(calls).to.deep.equal(["file"]);
        });

        it("should submit to the smart contract service otherwise", async function () {
            const calls = [];

            await new SystemDeleteTransaction()
                .setContractId(contractId)
                ._execute(stubChannel(calls), {});

            expect(calls).to.deep.equal(["smartContract"]);
        });
    });

    describe("serialization/deserialization", function () {
        it("should round-trip a signed file transaction", async function () {
            const transaction = await freezeWithIds(
                new SystemDeleteTransaction()
                    .setFileId(fileId)
                    .setExpirationTime(expirationTime),
            ).sign(privateKey);

            const deserialized = Transaction.fromBytes(transaction.toBytes());

            expect(deserialized).to.be.instanceOf(SystemDeleteTransaction);

            const deserializedDelete = /** @type {SystemDeleteTransaction} */ (
                deserialized
            );

            expect(deserializedDelete.fileId.toString()).to.equal(
                fileId.toString(),
            );
            expect(deserializedDelete.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
        });

        it("should round-trip a contract transaction", function () {
            const transaction = freezeWithIds(
                new SystemDeleteTransaction().setContractId(contractId),
            );

            const deserialized = /** @type {SystemDeleteTransaction} */ (
                Transaction.fromBytes(transaction.toBytes())
            );

            expect(deserialized.contractId.toString()).to.equal(
                contractId.toString(),
            );
            expect(deserialized.fileId).to.be.null;
        });
    });

    describe("_getLogId", function () {
        it("should name the transaction and its valid start", function () {
            const transaction = freezeWithIds(
                new SystemDeleteTransaction().setFileId(fileId),
            );

            expect(transaction._getLogId()).to.equal(
                `SystemDeleteTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
