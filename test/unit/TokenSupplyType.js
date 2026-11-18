import { TokenSupplyType } from "../../src/exports.js";

describe("TokenSupplyType", function () {
    it.each([
        [0, "INFINITE", TokenSupplyType.Infinite],
        [1, "FINITE", TokenSupplyType.Finite],
    ])("maps code %i to %s", function (code, name, type) {
        expect(TokenSupplyType._fromCode(code)).to.equal(type);
        expect(type.toString()).to.equal(name);
        expect(type.valueOf()).to.equal(code);
    });

    it("throws for an unknown code", function () {
        expect(() => TokenSupplyType._fromCode(99)).to.throw(
            "(BUG) TokenSupplyType.fromCode() does not handle code: 99",
        );
    });

    it("returns UNKNOWN (code) for a non-static instance", function () {
        expect(new TokenSupplyType(99).toString()).to.equal("UNKNOWN (99)");
    });
});
