import { TokenNftAllowance, TokenId, AccountId } from "../../src/index.js";
import Long from "long";

describe("TokenNftAllowance", function () {
    it("toProtobuf() with serial numbers", function () {
        const tokenId = new TokenId(1);
        const serial = Long.fromNumber(3);
        const spenderAccountId = new AccountId(4);
        const ownerAccountId = new AccountId(3);

        const allowance = new TokenNftAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            serialNumbers: [serial],
            allSerials: false,
            delegatingSpender: null,
        });

        expect(allowance._toProtobuf()).to.deep.equal({
            owner: ownerAccountId._toProtobuf(),
            tokenId: tokenId._toProtobuf(),
            spender: spenderAccountId._toProtobuf(),
            serialNumbers: [serial],
            approvedForAll: null,
            delegatingSpender: null,
        });
    });

    it("toProtobuf() with no serial numbers", function () {
        const ownerAccountId = new AccountId(3);
        const tokenId = new TokenId(1);
        const spenderAccountId = new AccountId(4);

        const allowance = new TokenNftAllowance({
            ownerAccountId,
            tokenId,
            spenderAccountId,
            serialNumbers: null,
            allSerials: true,
            delegatingSpender: null,
        });

        expect(allowance._toProtobuf()).to.deep.equal({
            owner: ownerAccountId._toProtobuf(),
            tokenId: tokenId._toProtobuf(),
            spender: spenderAccountId._toProtobuf(),
            serialNumbers: null,
            approvedForAll: { value: true },
            delegatingSpender: null,
        });
    });
});
