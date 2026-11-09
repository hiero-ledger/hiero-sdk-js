import {
    TokenUnfreezeTransaction,
    TokenId,
    AccountId,
    TransactionId,
    Timestamp,
    Transaction,
} from "../../src/index.js";

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

describe("TokenUnfreezeTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );

        const tx = new TokenUnfreezeTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenId(TokenId.fromString("0.0.5005"))
            .setAccountId(AccountId.fromString("0.0.5006"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenUnfreezeTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenId.toString()).to.equal("0.0.5005");
        expect(tx2.accountId.toString()).to.equal("0.0.5006");
    });
});
