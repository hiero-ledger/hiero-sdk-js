import { TokenType } from "../../src/exports.js";

describe("TokenType", function () {
    it.each([
        [0, "FUNGIBLE_COMMON", TokenType.FungibleCommon],
        [1, "NON_FUNGIBLE_UNIQUE", TokenType.NonFungibleUnique],
    ])("maps code %i to %s", function (code, name, type) {
        expect(TokenType._fromCode(code)).to.equal(type);
        expect(type.toString()).to.equal(name);
        expect(type.valueOf()).to.equal(code);
    });

    it("throws for an unknown code", function () {
        expect(() => TokenType._fromCode(99)).to.throw(
            "(BUG) TokenType.fromCode() does not handle code: 99",
        );
    });

    it("returns UNKNOWN (code) for a non-static instance", function () {
        expect(new TokenType(99).toString()).to.equal("UNKNOWN (99)");
    });
});
