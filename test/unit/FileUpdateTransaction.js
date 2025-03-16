import { FileUpdateTransaction } from "../../src/index.js";

describe("FileUpdateTransaction", function () {
    describe("deserialization of optional parameters", function () {
        it("should deserialize with fileMemo being null", function () {
            const tx = new FileUpdateTransaction();
            const tx2 = FileUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.fileMemo).to.be.null;
            expect(tx2.fileMemo).to.be.null;
        });
    });
});
