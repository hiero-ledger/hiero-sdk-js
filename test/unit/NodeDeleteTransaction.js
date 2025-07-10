import {
    AccountId,
    Hbar,
    NodeDeleteTransaction,
    Timestamp,
    TransactionId,
} from "../../src/index.js";

describe("NodeDeleteTransaction", function () {
    let tx;

    beforeEach(function () {
        const NODE_ID = 420,
            VALID_START = new Timestamp(1596210382, 0);

        tx = new NodeDeleteTransaction()
            .setNodeAccountIds([
                AccountId.fromString("0.0.5005"),
                AccountId.fromString("0.0.5006"),
            ])
            .setTransactionId(
                TransactionId.withValidStart(
                    AccountId.fromString("0.0.5006"),
                    VALID_START,
                ),
            )
            .setNodeId(NODE_ID)
            .setMaxTransactionFee(new Hbar(1));
    });

    it("should convert from and to bytes", function () {
        const tx2 = NodeDeleteTransaction.fromBytes(tx.toBytes());
        tx.nodeAccountIds.forEach((_, index) => {
            expect(tx.nodeAccountIds[index].toString()).to.equal(
                tx2.nodeAccountIds[index].toString(),
            );
        });
        expect(tx.transactionId.toString()).to.equal(
            tx2.transactionId.toString(),
        );
    });

    it("should return node id", function () {
        expect(tx.nodeId).to.equal(420);
    });

    it("should set node id", function () {
        tx.setNodeId(421);
        expect(tx.nodeId).to.equal(421);
    });

    describe("nodeId validation", function () {
        const VALID_START = new Timestamp(1596210382, 0);
        const ACCOUNT_ID = AccountId.fromString("0.6.9");
        it("should freeze successfully when nodeId is set", function () {
            const transaction = new NodeDeleteTransaction()
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setTransactionId(
                    TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
                )
                .setNodeId(420);

            expect(() => transaction.freeze()).to.not.throw();
        });

        it("should throw error when freezing without setting nodeId", function () {
            const transaction = new NodeDeleteTransaction()
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setTransactionId(
                    TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
                );
            // Note: nodeId is not set

            expect(() => transaction.freeze()).to.throw(
                "NodeDeleteTransaction: 'nodeId' must be explicitly set before calling freeze().",
            );
        });

        it("should throw error when freezing with null nodeId", function () {
            const transaction = new NodeDeleteTransaction()
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setTransactionId(
                    TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
                )
                .setNodeId(null);

            expect(() => transaction.freeze()).to.throw(
                "NodeDeleteTransaction: 'nodeId' must be explicitly set before calling freeze().",
            );
        });

        it("should throw error when freezing with undefined nodeId", function () {
            const transaction = new NodeDeleteTransaction()
                .setNodeAccountIds([AccountId.fromString("0.0.3")])
                .setTransactionId(
                    TransactionId.withValidStart(ACCOUNT_ID, VALID_START),
                )
                .setNodeId(undefined);

            expect(() => transaction.freeze()).to.throw(
                "NodeDeleteTransaction: 'nodeId' must be explicitly set before calling freeze().",
            );
        });
    });
});
