import {
    AccountId,
    TokenDeleteTransaction,
    TokenId,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";

describe("TokenDeleteTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );

        const tx = new TokenDeleteTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenId(TokenId.fromString("0.0.5005"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenDeleteTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenId.toString()).to.equal("0.0.5005");
    });
});
