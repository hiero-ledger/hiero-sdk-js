import { HbarAllowance, AccountId, Hbar } from "../../src/index.js";

describe("HbarAllowance", function () {
    it("toProtobuf()", function () {
        const ownerAccountId = new AccountId(3);
        const spenderAccountId = new AccountId(4);
        const hbarAmount = Hbar.fromTinybars(100);

        const allowance = new HbarAllowance({
            ownerAccountId,
            spenderAccountId,
            amount: hbarAmount,
        });

        expect(allowance._toProtobuf()).to.deep.equal({
            owner: ownerAccountId._toProtobuf(),
            spender: spenderAccountId._toProtobuf(),
            amount: hbarAmount.toTinybars(),
        });
    });
});
