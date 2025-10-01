import { TokenAllowance, AccountId, TokenId } from "../../src/index.js";
import Long from "long";
import BigNumber from "bignumber.js";

describe("TokenAllowance", function () {
    it("toProtobuf()", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);
        const tokenAmount = Long.fromNumber(100);

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: tokenAmount,
        });

        expect(allowance._toProtobuf()).to.deep.equal({
            owner: ownerAccountId._toProtobuf(),
            tokenId: tokenId._toProtobuf(),
            spender: spenderAccountId._toProtobuf(),
            amount: tokenAmount,
        });
    });

    it("should handle BigNumber amount", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);
        const tokenAmount = new BigNumber("1000.5");

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: tokenAmount,
        });

        expect(allowance.amount.toString()).to.equal("1000");
    });

    it("should handle bigint amount", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);
        const tokenAmount = 2000n;

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: tokenAmount,
        });

        expect(allowance.amount.toString()).to.equal("2000");
    });

    it("should handle number amount", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);
        const tokenAmount = 3000;

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: tokenAmount,
        });

        expect(allowance.amount.toNumber()).to.equal(tokenAmount);
    });

    it("should handle null amount", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: null,
        });

        expect(allowance.amount).to.be.null;
    });

    it("should handle large BigNumber amount", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);
        const tokenAmount = new BigNumber("9000000000000000000");

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: tokenAmount,
        });

        expect(allowance.amount.toString()).to.equal("9000000000000000000");
    });

    it("should handle large bigint amount", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);
        const tokenAmount = 9000000000000000000n;

        const allowance = new TokenAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            amount: tokenAmount,
        });

        expect(allowance.amount.toString()).to.equal("9000000000000000000");
    });
});
