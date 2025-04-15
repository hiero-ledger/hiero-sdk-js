import { FreezeTransaction, Timestamp, FreezeType } from "../../src/index.js";

describe("FreezeTransaction", function () {
    it("create transaction and set", function () {
        const seconds = Math.round(Date.now() / 1000);
        const validStart = new Timestamp(seconds, 0);
        const freezeType = new FreezeType(1);

        const transaction = new FreezeTransaction()
            .setStartTimestamp(validStart)
            .setFreezeType(freezeType);

        expect(transaction).to.be.instanceof(FreezeTransaction);
        expect(transaction.startTimestamp).to.be.equal(validStart);
        expect(transaction.freezeType).to.be.instanceof(FreezeType);
        expect(transaction.freezeType.toString()).to.be.equal(
            freezeType.toString(),
        );
    });
});
