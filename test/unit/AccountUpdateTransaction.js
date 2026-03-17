import { AccountUpdateTransaction } from "../../src/index.js";

describe("AccountUpdateTransaction", function () {
    describe("deserialization of optional parameters", function () {
        let tx, txBytes, tx2;

        beforeAll(function () {
            tx = new AccountUpdateTransaction();
            txBytes = tx.toBytes();
            tx2 = AccountUpdateTransaction.fromBytes(txBytes);
        });

        it("should deserialize with accountMemo being null", function () {
            expect(tx.accountMemo).to.be.null;
            expect(tx2.accountMemo).to.be.null;
        });

        it("should deserialize with declineReward, receiverSignatureRequired being null", function () {
            expect(tx.declineStakingRewards).to.be.null;
            expect(tx2.declineStakingRewards).to.be.null;

            expect(tx.receiverSignatureRequired).to.be.null;
            expect(tx2.receiverSignatureRequired).to.be.null;
        });

        it("should deserialize with maxAutomaticTokenAssociations being null", function () {
            expect(tx.maxAutomaticTokenAssociations).to.be.null;
            expect(tx2.maxAutomaticTokenAssociations).to.be.null;
        });
    });
});
