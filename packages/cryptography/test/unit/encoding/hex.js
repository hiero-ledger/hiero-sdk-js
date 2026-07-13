import * as hex from "../../../src/encoding/hex.js";

const bytes = new Uint8Array([
    -37, 72, 75, -126, -114, 100, -78, -40, -15, 44, -29, -64, -96, -23, 58, 11,
    -116, -50, 122, -15, -69, -113, 57, -55, 119, 50, 57, 68, -126, 83, -114,
    16,
]);

const string =
    "db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10";

describe("encoding/hex", function () {
    it("should encode", function () {
        expect(hex.encode(bytes)).to.deep.equal(string);
    });

    it("should decode", function () {
        expect(hex.decode(string)).to.deep.equal(bytes);
    });

    it("should decode with a 0x prefix and either case", function () {
        expect(hex.decode(`0x${string}`)).to.deep.equal(bytes);
        expect(hex.decode(string.toUpperCase())).to.deep.equal(bytes);
    });

    it("should decode the empty string to no bytes", function () {
        expect(hex.decode("")).to.deep.equal(new Uint8Array());
        expect(hex.decode("0x")).to.deep.equal(new Uint8Array());
    });

    // `parseInt` yields NaN for non-hex (which a Uint8Array coerces to 0) and
    // stops at the first invalid character. Either way a malformed string used
    // to decode to a wrong-but-plausible byte string instead of failing.
    it("should reject a non-hex character rather than decoding it to zero", function () {
        expect(() => hex.decode("zz")).to.throw(/Invalid hex string/);
        expect(() => hex.decode("ag")).to.throw(/Invalid hex string/);
        expect(() => hex.decode("ab_d")).to.throw(/Invalid hex string/);
        expect(() => hex.decode("abcdzz")).to.throw(/Invalid hex string/);
    });

    it("should reject an odd number of digits", function () {
        expect(() => hex.decode("abc")).to.throw(/Invalid hex string/);
        expect(() => hex.decode("0xabc")).to.throw(/Invalid hex string/);
    });

    it("should reject surrounding whitespace", function () {
        expect(() => hex.decode(" abcd")).to.throw(/Invalid hex string/);
        expect(() => hex.decode("ab cd")).to.throw(/Invalid hex string/);
    });
});
