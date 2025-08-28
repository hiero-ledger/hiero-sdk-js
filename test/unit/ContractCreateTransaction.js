import { AccountId, ContractCreateTransaction } from "../../src/index.js";
import Long from "long";

describe("ContractDeleteTransaction", function () {
    let stakedAccountId;
    let stakedNodeId;

    beforeEach(function () {
        stakedAccountId = new AccountId(0, 0, 3333);
        stakedNodeId = Long.fromNumber(5);
    });

    it("should throw an error if gas is negative", function () {
        const tx = new ContractCreateTransaction();

        let err = false;
        try {
            tx.setGas(-1);
        } catch (error) {
            if (error.message.includes("Gas must be greater than 0"))
                err = true;
        }

        expect(err).to.be.true;
    });

    it("should get the last called if both stakedAccountId and stakedNodeId are present", function () {
        const tx = new ContractCreateTransaction({
            stakedAccountId: stakedAccountId,
            stakedNodeId: stakedNodeId,
        });

        expect(tx.stakedAccountId).to.be.null;
        expect(tx.stakedNodeId.toString()).to.equal(stakedNodeId.toString());

        tx.setStakedAccountId(stakedAccountId);

        expect(tx.stakedAccountId.toString()).to.equal(
            stakedAccountId.toString(),
        );
        expect(tx.stakedNodeId).to.be.null;
    });
});
