import { TokenAllowance, AccountId, TokenId } from "../../src/index.js";
import Long from "long";

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
});
