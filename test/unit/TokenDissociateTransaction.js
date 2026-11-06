import {
    AccountId,
    Timestamp,
    TokenDissociateTransaction,
    TokenId,
    Transaction,
    TransactionId,
} from "../../src/index.js";

describe("TokenDissociateTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );

        const tx = new TokenDissociateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenIds([
                TokenId.fromString("0.0.5005"),
                TokenId.fromString("0.0.5006"),
            ])
            .setAccountId(AccountId.fromString("0.0.5007"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenDissociateTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenIds.map((id) => id.toString())).to.deep.equal([
            "0.0.5005",
            "0.0.5006",
        ]);
        expect(tx2.accountId.toString()).to.equal("0.0.5007");
    });
});
