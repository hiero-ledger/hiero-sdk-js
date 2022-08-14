import { expect } from "chai";

import { TokenNftAllowance, TokenId, AccountId } from "../../src/index.js";
import Long from "long";
import * as symbols from "../../src/Symbols.js";

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
        });

        expect(allowance[symbols.toProtobuf]()).to.deep.equal({
            owner: ownerAccountId[symbols.toProtobuf](),
            tokenId: tokenId[symbols.toProtobuf](),
            spender: spenderAccountId[symbols.toProtobuf](),
            serialNumbers: [serial],
            approvedForAll: null,
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
        });

        expect(allowance[symbols.toProtobuf]()).to.deep.equal({
            owner: ownerAccountId[symbols.toProtobuf](),
            tokenId: tokenId[symbols.toProtobuf](),
            spender: spenderAccountId[symbols.toProtobuf](),
            serialNumbers: null,
            approvedForAll: { value: true },
        });
    });
});
