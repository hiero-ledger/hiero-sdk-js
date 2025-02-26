import {
    AccountId,
    CustomFeeLimit,
    CustomFixedFee,
    TokenId,
} from "../../src/index.js";

describe("CustomFeeLimit", function () {
    it("should set the correct account id", function () {
        const accountId = new AccountId(0, 0, 2);
        const customFeeLimit = new CustomFeeLimit().setAccountId(accountId);

        expect(customFeeLimit.getAccountId().toString()).to.eql(
            accountId.toString(),
        );
    });

    it("should set the correct custom fixed fees", function () {
        const tokenId = new TokenId(0);

        const amount = 100;

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.toString()).to.eql(
            amount.toString(),
        );

        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });
});
