import { TokenNftAllowance, TokenId, AccountId } from "../../src/index.js";
import Long from "long";

describe("TokenNftAllowance", function () {
    const tokenId = new TokenId(1)._toProtobuf();

    it.each([
        ["an empty wrapper", {}, false],
        ["an explicit false", { value: false }, false],
        ["an explicit true", { value: true }, true],
    ])("round trips approvedForAll with %s", function (_, wrapper, allSerials) {
        const allowance = TokenNftAllowance._fromProtobuf({
            tokenId,
            serialNumbers: [],
            approvedForAll: wrapper,
        });

        expect(allowance.allSerials).to.equal(allSerials);
        expect(allowance.serialNumbers).to.be.null;
        expect(allowance._toProtobuf().approvedForAll).to.deep.equal({
            value: allSerials,
        });
    });

    it("round trips serial numbers without approvedForAll", function () {
        const serialNumbers = [Long.fromNumber(3)];
        const allowance = TokenNftAllowance._fromProtobuf({
            tokenId,
            serialNumbers,
        });

        const protobuf = allowance._toProtobuf();
        expect(allowance.allSerials).to.be.false;
        expect(allowance.serialNumbers).to.deep.equal(serialNumbers);
        expect(protobuf.approvedForAll).to.be.null;
        expect(protobuf.serialNumbers).to.deep.equal(serialNumbers);
    });

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
