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

    it("should throw TypeError when setting a null id", function () {
        const tx = new RegisteredNodeDeleteTransaction();
        expect(() => tx.setRegisteredNodeId(null)).to.throw(TypeError);
    });

    // Note: missing/negative/non-existent registeredNodeId is rejected by
    // the consensus node with INVALID_REGISTERED_NODE_ID — see integration
    // tests.

    describe("_execute", function () {
        it("should call addressBook.deleteRegisteredNode() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                addressBook: {
                    deleteRegisteredNode: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new RegisteredNodeDeleteTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.deep.equal([request]);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return registeredNodeDelete", function () {
            expect(
                new RegisteredNodeDeleteTransaction()._getTransactionDataCase(),
            ).to.equal("registeredNodeDelete");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const validStart = new Timestamp(1596210382, 0);
            const transaction = new RegisteredNodeDeleteTransaction()
                .setRegisteredNodeId(7)
                .setNodeAccountIds([new AccountId(0, 0, 3)])
                .setTransactionId(
                    TransactionId.withValidStart(
                        new AccountId(0, 0, 1001),
                        validStart,
                    ),
                )
                .freeze();

            expect(transaction._getLogId()).to.equal(
                `RegisteredNodeDeleteTransaction:${validStart.toString()}`,
            );
        });
    });
});
