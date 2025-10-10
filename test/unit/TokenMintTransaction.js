import {
    TokenMintTransaction,
    TokenId,
    AccountId,
    TransactionId,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import Long from "long";
import BigNumber from "bignumber.js";

describe("TokenMintTransaction", function () {
    const tokenId = new TokenId(1, 2, 3);
    const accountId = new AccountId(1);
    const timestamp = new Timestamp(1234567890, 0);

    it("should create transaction with number amount", function () {
        const amount = 1000;
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toNumber()).to.equal(amount);
    });

    it("should create transaction with Long amount", function () {
        const amount = Long.fromNumber(2000);
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.equals(amount)).to.be.true;
    });

    it("should create transaction with BigNumber amount", function () {
        const amount = new BigNumber("3000.5");
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("3000");
    });

    it("should create transaction with bigint amount", function () {
        const amount = 4000n;
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("4000");
    });

    it("should round trip from bytes with BigNumber amount", function () {
        const amount = new BigNumber("5000.7");
        const originalTransaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        const transactionBytes = originalTransaction.toBytes();
        const reconstructedTransaction =
            Transaction.fromBytes(transactionBytes);

        expect(reconstructedTransaction.tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(reconstructedTransaction.amount.toString()).to.equal("5000");
    });

    it("should round trip from bytes with bigint amount", function () {
        const amount = 6000n;
        const originalTransaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        const transactionBytes = originalTransaction.toBytes();
        const reconstructedTransaction =
            Transaction.fromBytes(transactionBytes);

        expect(reconstructedTransaction.tokenId.toString()).to.equal(
            tokenId.toString(),
        );
        expect(reconstructedTransaction.amount.toString()).to.equal("6000");
    });

    it("should handle large BigNumber amounts", function () {
        const amount = new BigNumber("9000000000000000000");
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("9000000000000000000");
    });

    it("should handle large bigint amounts", function () {
        const amount = 9000000000000000000n;
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("9000000000000000000");
    });

    it("should handle zero amounts", function () {
        const amount = new BigNumber("0");
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("0");
    });

    it("should handle decimal BigNumber amounts (truncated)", function () {
        const amount = new BigNumber("1234.56789");
        const transaction = new TokenMintTransaction()
            .setTokenId(tokenId)
            .setAmount(amount)
            .setTransactionId(
                TransactionId.withValidStart(accountId, timestamp),
            )
            .setNodeAccountIds([accountId])
            .freeze();

        expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        expect(transaction.amount.toString()).to.equal("1234");
    });
});
