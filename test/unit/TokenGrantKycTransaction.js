import {
    TokenGrantKycTransaction,
    TokenId,
    AccountId,
    TransactionId,
    Client,
    LedgerId,
    Transaction,
    PrivateKey,
} from "../../src/index.js";
import Long from "long";

describe("TokenGrantKycTransaction", function () {
    let tokenId;
    let accountId;
    let transactionId;
    let nodeId;
    let privateKey;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 5005);
        accountId = new AccountId(0, 0, 3333);
        transactionId = TransactionId.generate(new AccountId(0, 0, 4444));
        nodeId = new AccountId(0, 0, 3);
        privateKey = PrivateKey.generateED25519();
    });

    describe("getters and setters", function () {
        it("should get and set tokenId", function () {
            const transaction = new TokenGrantKycTransaction().setTokenId(
                tokenId,
            );

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should set tokenId from string", function () {
            const transaction = new TokenGrantKycTransaction().setTokenId(
                tokenId.toString(),
            );

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should get and set accountId", function () {
            const transaction = new TokenGrantKycTransaction().setAccountId(
                accountId,
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should set accountId from string", function () {
            const transaction = new TokenGrantKycTransaction().setAccountId(
                accountId.toString(),
            );

            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should set values in constructor", function () {
            const transaction = new TokenGrantKycTransaction({
                tokenId,
                accountId,
            });

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });
    });

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf correctly", function () {
            // Create mock protobuf objects
            const mockTokenGrantKycBody = {
                tokenGrantKyc: {
                    token: tokenId._toProtobuf(),
                    account: accountId._toProtobuf(),
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
            const transaction = TokenGrantKycTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockTokenGrantKycBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(TokenGrantKycTransaction);
            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
            expect(transaction.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });

        it("should handle null values in protobuf", function () {
            // Create minimal mock protobuf objects
            const mockTokenGrantKycBody = {
                tokenGrantKyc: {},
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
            const transaction = TokenGrantKycTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockTokenGrantKycBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(TokenGrantKycTransaction);
            expect(transaction.tokenId).to.be.null;
            expect(transaction.accountId).to.be.null;
        });
    });

    describe("serialization/deserialization", function () {
        it("should serialize and deserialize correctly", async function () {
            // Create a transaction with all properties set
            const transaction = await new TokenGrantKycTransaction()
                .setTokenId(tokenId)
                .setAccountId(accountId)
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserialized = Transaction.fromBytes(transactionBytes);

            // Verify the transaction properties
            expect(deserialized).to.be.instanceOf(TokenGrantKycTransaction);

            const deserializedGrantKyc =
                /** @type {TokenGrantKycTransaction} */ (deserialized);

            expect(deserializedGrantKyc.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(deserializedGrantKyc.accountId.toString()).to.equal(
                accountId.toString(),
            );
        });
    });

    describe("_validateChecksums", function () {
        it("should validate token and account ID checksums", function () {
            // Create a client with a ledger ID
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            // Create mock objects with validation tracking
            const mockTokenId = {
                shard: 0,
                realm: 0,
                token: 5005,
                _checksum: "abcde",
                // eslint-disable-next-line no-unused-vars
                validateChecksum: function (client) {
                    this.validateChecksumCalled = true;
                },
            };

            const mockAccountId = {
                shard: 0,
                realm: 0,
                account: 3333,
                _checksum: "fghij",
                // eslint-disable-next-line no-unused-vars
                validateChecksum: function (client) {
                    this.validateChecksumCalled = true;
                },
            };

            // Create a transaction with mock objects
            const transaction = new TokenGrantKycTransaction();
            transaction._tokenId = mockTokenId;
            transaction._accountId = mockAccountId;

            // Validate checksums
            transaction._validateChecksums(client);

            // Verify validation was called for both IDs
            expect(mockTokenId.validateChecksumCalled).to.be.true;
            expect(mockAccountId.validateChecksumCalled).to.be.true;
        });

        it("should handle null IDs during checksum validation", function () {
            const client = new Client({
                ledgerId: new LedgerId("mainnet"),
            });

            const transaction = new TokenGrantKycTransaction();
            // IDs are already null in a new transaction

            // Should not throw an error
            expect(() => transaction._validateChecksums(client)).to.not.throw();
        });
    });

    describe("_makeTransactionData", function () {
        it("should create transaction data with all fields", function () {
            const transaction = new TokenGrantKycTransaction()
                .setTokenId(tokenId)
                .setAccountId(accountId);

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.token).to.deep.include({
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                tokenNum: Long.fromNumber(5005),
            });

            expect(transactionData.account).to.deep.include({
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                accountNum: Long.fromNumber(3333),
            });
        });

        it("should handle null values in transaction data", function () {
            const transaction = new TokenGrantKycTransaction();

            const transactionData = transaction._makeTransactionData();

            expect(transactionData.token).to.be.null;
            expect(transactionData.account).to.be.null;
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return the correct transaction type", function () {
            const transaction = new TokenGrantKycTransaction();

            expect(transaction._getTransactionDataCase()).to.equal(
                "tokenGrantKyc",
            );
        });
    });

    describe("_getLogId", function () {
        it("should return a log ID with transaction timestamp", function () {
            const transaction = new TokenGrantKycTransaction()
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId);

            const logId = transaction._getLogId();

            expect(logId).to.include("TokenGrantKycTransaction:");
            expect(logId).to.be.a("string");
        });
    });
});
