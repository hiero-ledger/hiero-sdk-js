import {
    TokenFreezeTransaction,
    TokenUnfreezeTransaction,
    TokenId,
    AccountId,
    TransactionId,
} from "../../src/index.js";

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
