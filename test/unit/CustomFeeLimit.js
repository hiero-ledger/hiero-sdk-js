import {
    AccountId,
    CustomFeeLimit,
    CustomFixedFee,
    TokenId,
    AssessedCustomFee,
} from "../../src/index.js";
import Long from "long";
import BigNumber from "bignumber.js";

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

    it("should handle CustomFixedFee with BigNumber amount", function () {
        const tokenId = new TokenId(0);
        const amount = new BigNumber("1000.5");

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.toString()).to.eql("1000");
        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });

    it("should handle CustomFixedFee with bigint amount", function () {
        const tokenId = new TokenId(0);
        const amount = 2000n;

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.toString()).to.eql("2000");
        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });

    it("should handle CustomFixedFee with Long amount", function () {
        const tokenId = new TokenId(0);
        const amount = Long.fromNumber(3000);

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.equals(amount)).to.be.true;
        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });

    it("should handle CustomFixedFee with number amount", function () {
        const tokenId = new TokenId(0);
        const amount = 4000;

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.toNumber()).to.eql(amount);
        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });

    it("should handle large BigNumber amounts in CustomFixedFee", function () {
        const tokenId = new TokenId(0);
        const amount = new BigNumber("9000000000000000000");

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.toString()).to.eql(
            "9000000000000000000",
        );
        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });

    it("should handle large bigint amounts in CustomFixedFee", function () {
        const tokenId = new TokenId(0);
        const amount = 9000000000000000000n;

        const fixedFee = new CustomFixedFee()
            .setAmount(amount)
            .setDenominatingTokenId(tokenId);

        const customFeeLimit = new CustomFeeLimit().setFees([fixedFee]);

        expect(customFeeLimit.getFees()[0].amount.toString()).to.eql(
            "9000000000000000000",
        );
        expect(
            customFeeLimit.getFees()[0].denominatingTokenId.toString(),
        ).to.eql(tokenId.toString());
    });

    describe("AssessedCustomFee", function () {
        it("should handle AssessedCustomFee with number amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = 1000;
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toNumber()).to.equal(amount);
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with Long amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = Long.fromNumber(2000);
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.equals(amount)).to.be.true;
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with BigNumber amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = new BigNumber("3000.5");
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toString()).to.equal("3000");
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with bigint amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = 4000n;
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toString()).to.equal("4000");
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with large BigNumber amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = new BigNumber("9000000000000000000");
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toString()).to.equal(
                "9000000000000000000",
            );
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with large bigint amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = 9000000000000000000n;
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toString()).to.equal(
                "9000000000000000000",
            );
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with zero amount", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = new BigNumber("0");
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toString()).to.equal("0");
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });

        it("should handle AssessedCustomFee with multiple payer accounts", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = 5000;
            const payerAccountIds = [
                new AccountId(2),
                new AccountId(3),
                new AccountId(4),
            ];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toNumber()).to.equal(amount);
            expect(assessedCustomFee.payerAccountIds.length).to.equal(3);
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
            expect(assessedCustomFee.payerAccountIds[1].toString()).to.equal(
                payerAccountIds[1].toString(),
            );
            expect(assessedCustomFee.payerAccountIds[2].toString()).to.equal(
                payerAccountIds[2].toString(),
            );
        });

        it("should handle AssessedCustomFee with decimal BigNumber amount (truncated)", function () {
            const tokenId = new TokenId(0);
            const feeCollectorAccountId = new AccountId(1);
            const amount = new BigNumber("1234.56789");
            const payerAccountIds = [new AccountId(2)];

            const assessedCustomFee = new AssessedCustomFee({
                tokenId: tokenId,
                feeCollectorAccountId: feeCollectorAccountId,
                amount: amount,
                payerAccountIds: payerAccountIds,
            });

            expect(assessedCustomFee.tokenId.toString()).to.equal(
                tokenId.toString(),
            );
            expect(assessedCustomFee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(assessedCustomFee.amount.toString()).to.equal("1234");
            expect(assessedCustomFee.payerAccountIds[0].toString()).to.equal(
                payerAccountIds[0].toString(),
            );
        });
    });
});
