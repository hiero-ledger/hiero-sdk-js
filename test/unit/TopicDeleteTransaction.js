import {
    AccountId,
    TopicDeleteTransaction,
    TopicId,
    Timestamp,
    Transaction,
    TransactionId,
} from "../../src/index.js";

describe("TopicDeleteTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );

        const tx = new TopicDeleteTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTopicId(TopicId.fromString("0.0.5005"))
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TopicDeleteTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.topicId.toString()).to.equal("0.0.5005");
    });
});
