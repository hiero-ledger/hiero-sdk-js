import {
    AccountDeleteTransaction,
    AccountId,
    TransactionId,
    Client,
    LedgerId,
    Transaction,
    PrivateKey,
} from "../../src/index.js";

describe("AccountDeleteTransaction", function () {
    let accountId;
    let transferAccountId;
    let transactionId;
    let nodeId;
    let privateKey;

    beforeEach(function () {
        accountId = new AccountId(0, 0, 3333);
        transferAccountId = new AccountId(0, 0, 4444);
        transactionId = TransactionId.generate(new AccountId(0, 0, 5555));
        nodeId = new AccountId(0, 0, 3);
        privateKey = PrivateKey.generateED25519();
    });

    describe("getters and setters", function () {
        it("should get and set accountId", function () {
            const transaction = new AccountDeleteTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should set accountId from string", function () {
            const transaction = new AccountDeleteTransaction().setAccountId(
                accountId.toString(),
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should get and set transferAccountId", function () {
            const transaction =
                new AccountDeleteTransaction().setTransferAccountId(
                    transferAccountId,
                );

            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });

        it("should set transferAccountId from string", function () {
            const transaction =
                new AccountDeleteTransaction().setTransferAccountId(
                    transferAccountId.toString(),
                );

            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });

        it("should set values in constructor", function () {
            const transaction = new AccountDeleteTransaction({
                accountId,
                transferAccountId,
            });

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });
    });

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf correctly", function () {
            // Create mock protobuf objects
            const mockAccountDeleteBody = {
                cryptoDelete: {
                    deleteAccountID: accountId._toProtobuf(),
                    transferAccountID: transferAccountId._toProtobuf(),
                },
            };

            const mockTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            const mockSignedTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            // Execute fromProtobuf
            const transaction = AccountDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockAccountDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(AccountDeleteTransaction);
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(transaction.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });

        it("should handle null values in protobuf", function () {
            // Create minimal mock protobuf objects
            const mockAccountDeleteBody = {
                cryptoDelete: {},
            };

            const mockTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            const mockSignedTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            // Execute fromProtobuf
            const transaction = AccountDeleteTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockAccountDeleteBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(AccountDeleteTransaction);
            expect(transaction.accountId).to.be.null;
            expect(transaction.transferAccountId).to.be.null;
        });
    });

    describe("serialization/deserialization", function () {
        it("should serialize and deserialize correctly", async function () {
            // Create a transaction with all properties set
            const transaction = await new AccountDeleteTransaction()
                .setAccountId(accountId)
                .setTransferAccountId(transferAccountId)
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserialized = Transaction.fromBytes(transactionBytes);

            // Verify the transaction properties
            expect(deserialized).to.be.instanceOf(AccountDeleteTransaction);

            const deserializedDelete = /** @type {AccountDeleteTransaction} */ (
                deserialized
            );

            expect(deserializedDelete.accountId.toString()).to.equal(
                accountId.toString(),
            );
            expect(deserializedDelete.transferAccountId.toString()).to.equal(
                transferAccountId.toString(),
            );
        });
    });

    describe("_validateChecksums", function () {
        it("should validate accountId and transferAccountId checksums", function () {
            // Create a client with a ledger ID
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            // Create mock objects with validation tracking
            const mockAccountId = {
                shard: 0,
                realm: 0,
                account: 3333,
                _checksum: "abcde",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const mockTransferAccountId = {
                shard: 0,
                realm: 0,
                account: 4444,
                _checksum: "fghij",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            // Create a transaction with mock objects
            const transaction = new AccountDeleteTransaction();
            transaction._accountId = mockAccountId;
            transaction._transferAccountId = mockTransferAccountId;

            // Validate checksums
            transaction._validateChecksums(client);

            // Verify validation was called for both IDs
            expect(mockAccountId.validateChecksumCalled).to.be.true;
            expect(mockTransferAccountId.validateChecksumCalled).to.be.true;
        });

        it("should handle null accountId during checksum validation", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const mockTransferAccountId = {
                shard: 0,
                realm: 0,
                account: 4444,
                _checksum: "fghij",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const transaction = new AccountDeleteTransaction();
            // accountId is already null
            transaction._transferAccountId = mockTransferAccountId;

            // Should not throw an error
            transaction._validateChecksums(client);

            // Verify validation was called for transferAccountId
            expect(mockTransferAccountId.validateChecksumCalled).to.be.true;
        });

        it("should handle null transferAccountId during checksum validation", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const mockAccountId = {
                shard: 0,
                realm: 0,
                account: 3333,
                _checksum: "abcde",
                validateChecksum: function () {
                    this.validateChecksumCalled = true;
                },
            };

            const transaction = new AccountDeleteTransaction();
            transaction._accountId = mockAccountId;
            // transferAccountId is already null

            // Should not throw an error
            transaction._validateChecksums(client);

            // Verify validation was called for accountId
            expect(mockAccountId.validateChecksumCalled).to.be.true;
        });

        it("should handle both null IDs during checksum validation", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const transaction = new AccountDeleteTransaction();
            // Both IDs are already null in a new transaction

            // Should not throw an error
            expect(() => transaction._validateChecksums(client)).to.not.throw();
        });
    });

    describe("_makeTransactionData", function () {
        it("should create transaction data with all fields", function () {
            const transaction = new AccountDeleteTransaction()
                .setAccountId(accountId)
                .setTransferAccountId(transferAccountId);

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.deleteAccountID).to.not.be.null;
            expect(transactionData.transferAccountID).to.not.be.null;

            if (transactionData.deleteAccountID) {
                expect(
                    new AccountId(
                        transactionData.deleteAccountID.shardNum,
                        transactionData.deleteAccountID.realmNum,
                        transactionData.deleteAccountID.accountNum,
                    ).toString(),
                ).to.equal(accountId.toString());
            }

            if (transactionData.transferAccountID) {
                expect(
                    new AccountId(
                        transactionData.transferAccountID.shardNum,
                        transactionData.transferAccountID.realmNum,
                        transactionData.transferAccountID.accountNum,
                    ).toString(),
                ).to.equal(transferAccountId.toString());
            }
        });

        it("should handle null fields", function () {
            const transaction = new AccountDeleteTransaction();
            // Both IDs are null in a new transaction

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.deleteAccountID).to.be.null;
            expect(transactionData.transferAccountID).to.be.null;
        });
    });
});
