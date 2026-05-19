import {
    AccountId,
    Timestamp,
    TransactionId,
    TransferTransaction,
} from "../../src/index.js";
import TransactionHashMap from "../../src/transaction/TransactionHashMap.js";

describe("TransactionHashMap", function () {
    describe("_fromTransaction", function () {
        it("returns a 48-byte SHA-384 hash per node account ID", async function () {
            const validStart = new Timestamp(Math.floor(Date.now() / 1000), 0);
            const txId = new TransactionId(new AccountId(0), validStart);
            const nodeAccountId = new AccountId(3);

            const tx = new TransferTransaction()
                .setNodeAccountIds([nodeAccountId])
                .setTransactionId(txId)
                .freeze();
            await tx._buildAllTransactionsAsync();

            const hashMap = await TransactionHashMap._fromTransaction(tx);

            expect(hashMap).to.be.an.instanceof(TransactionHashMap);
            expect(hashMap.size).to.equal(1);

            const hash = hashMap.get(nodeAccountId);
            expect(hash).to.be.an.instanceof(Uint8Array);
            expect(hash.length).to.equal(48);
        });
    });
});
