import {
    Client,
    TokenFreezeTransaction,
    TokenUnfreezeTransaction,
    TokenId,
    AccountId,
    TransactionId,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";

describe("TokenFreezeTransaction._fromProtobuf", function () {
    let tokenId;
    let accountId;
    let transactionId;
    let nodeId;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 5005);
        accountId = new AccountId(0, 0, 3333);
        transactionId = TransactionId.generate(new AccountId(0, 0, 4444));
        nodeId = new AccountId(0, 0, 3);
    });

    it("should deserialize from protobuf correctly with all fields", function () {
        // Create mock protobuf objects
        const mockTokenFreezeBody = {
            tokenFreeze: {
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
        const transaction = TokenFreezeTransaction._fromProtobuf(
            [mockTransaction],
            [mockSignedTransaction],
            [transactionId],
            [nodeId],
            [mockTokenFreezeBody],
        );

        // Verify the transaction properties
        expect(transaction).to.be.instanceOf(TokenFreezeTransaction);
        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.accountId.toString()).to.equal(accountId.toString());
    });

    it("should handle null values in protobuf", function () {
        // Create minimal mock protobuf objects
        const mockTokenFreezeBody = {
            tokenFreeze: {},
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
        const transaction = TokenFreezeTransaction._fromProtobuf(
            [mockTransaction],
            [mockSignedTransaction],
            [transactionId],
            [nodeId],
            [mockTokenFreezeBody],
        );

        // Verify the transaction properties
        expect(transaction).to.be.instanceOf(TokenFreezeTransaction);
        expect(transaction.tokenId).to.be.null;
        expect(transaction.accountId).to.be.null;
    });
});

describe("TokenUnfreezeTransaction._fromProtobuf", function () {
    let tokenId;
    let accountId;
    let transactionId;
    let nodeId;

    beforeEach(function () {
        tokenId = new TokenId(0, 0, 5005);
        accountId = new AccountId(0, 0, 3333);
        transactionId = TransactionId.generate(new AccountId(0, 0, 4444));
        nodeId = new AccountId(0, 0, 3);
    });

    it("should deserialize from protobuf correctly with all fields", function () {
        // Create mock protobuf objects
        const mockTokenUnfreezeBody = {
            tokenUnfreeze: {
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
        const transaction = TokenUnfreezeTransaction._fromProtobuf(
            [mockTransaction],
            [mockSignedTransaction],
            [transactionId],
            [nodeId],
            [mockTokenUnfreezeBody],
        );

        // Verify the transaction properties
        expect(transaction).to.be.instanceOf(TokenUnfreezeTransaction);
        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.accountId.toString()).to.equal(accountId.toString());
    });

    it("should handle null values in protobuf", function () {
        // Create minimal mock protobuf objects
        const mockTokenUnfreezeBody = {
            tokenUnfreeze: {},
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
        const transaction = TokenUnfreezeTransaction._fromProtobuf(
            [mockTransaction],
            [mockSignedTransaction],
            [transactionId],
            [nodeId],
            [mockTokenUnfreezeBody],
        );

        // Verify the transaction properties
        expect(transaction).to.be.instanceOf(TokenUnfreezeTransaction);
        expect(transaction.tokenId).to.be.null;
        expect(transaction.accountId).to.be.null;
    });
});

describe("TokenFreezeTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );

        const tx = new TokenFreezeTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenId(TokenId.fromString("0.0.5005"))
            .setAccountId(AccountId.fromString("0.0.5006"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenFreezeTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenId.toString()).to.equal("0.0.5005");
        expect(tx2.accountId.toString()).to.equal("0.0.5006");
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            const tokenId = new TokenId(0, 0, 5005);
            const accountId = new AccountId(0, 0, 5006);
            const transaction = new TokenFreezeTransaction()
                .setTokenId(tokenId)
                .setAccountId(accountId);

            expect(transaction._makeTransactionData()).to.deep.equal({
                token: tokenId._toProtobuf(),
                account: accountId._toProtobuf(),
            });
        });

        it("should encode unset fields as null", function () {
            expect(
                new TokenFreezeTransaction()._makeTransactionData(),
            ).to.deep.equal({
                token: null,
                account: null,
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

        it("should check the token ID checksum", function () {
            const transaction = new TokenFreezeTransaction().setTokenId(
                TokenId.fromString("0.0.123-vfmkw"),
            );

            expect(() =>
                transaction._validateChecksums(mainnet),
            ).to.not.throw();
            expect(() => transaction._validateChecksums(testnet)).to.throw(
                BadEntityIdError,
            );
        });

        it("should check the account ID checksum", function () {
            const accountId = new AccountId(0, 0, 123);
            accountId._checksum = "vfmkw";

            const transaction = new TokenFreezeTransaction().setAccountId(
                accountId,
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
                new TokenFreezeTransaction()._validateChecksums(testnet),
            ).to.not.throw();
        });
    });

    describe("_execute", function () {
        it("should call token.freezeTokenAccount() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    freezeTokenAccount: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenFreezeTransaction()._execute(channel, request),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new TokenFreezeTransaction()
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `TokenFreezeTransaction:${validStart.toString()}`,
            );
        });
    });
});
