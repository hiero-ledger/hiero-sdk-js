import {
    AccountId,
    Hbar,
    Long,
    RegisteredNodeDeleteTransaction,
    Timestamp,
    TransactionId,
} from "../../../src/index.js";

describe("RegisteredNodeDeleteTransaction", function () {
    const VALID_START = new Timestamp(1596210382, 0);

    /**
     * @returns {RegisteredNodeDeleteTransaction}
     */
    function makeTransaction() {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];

        return new RegisteredNodeDeleteTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            )
            .setRegisteredNodeId(Long.fromNumber(123))
            .setMaxTransactionFee(new Hbar(1));
    }

    it("should convert from and to bytes", function () {
        const tx = makeTransaction();
        const tx2 = RegisteredNodeDeleteTransaction.fromBytes(tx.toBytes());

        expect(tx.transactionId.toString()).to.equal(
            tx2.transactionId.toString(),
        );
        expect(tx2.registeredNodeId.toString()).to.equal("123");
    });

    it("should throw error when setting a negative id", function () {
        const tx = new RegisteredNodeDeleteTransaction();
        expect(() => tx.setRegisteredNodeId(-1)).to.throw(
            "RegisteredNodeDeleteTransaction: 'registeredNodeId' must be positive.",
        );
    });

    it("should require registeredNodeId before freeze", function () {
        const nodeAccountIds = [AccountId.fromString("0.0.5005")];
        const tx = new RegisteredNodeDeleteTransaction()
            .setNodeAccountIds(nodeAccountIds)
            .setTransactionId(
                TransactionId.withValidStart(nodeAccountIds[0], VALID_START),
            );

        expect(() => tx.freeze()).to.throw(
            "RegisteredNodeDeleteTransaction: 'registeredNodeId' must be explicitly set before calling freeze().",
        );
    });
});
