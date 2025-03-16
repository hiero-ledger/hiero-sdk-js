import { ContractUpdateTransaction } from "../../src/index.js";

describe("ContractUpdateTransaction", function () {
    describe("deserialization of optional parameters", function () {
        it("should deserialize with contractMemo being null", function () {
            const tx = new ContractUpdateTransaction();
            const tx2 = ContractUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.contractMemo).to.be.null;
            expect(tx2.contractMemo).to.be.null;
        });
    });
});
