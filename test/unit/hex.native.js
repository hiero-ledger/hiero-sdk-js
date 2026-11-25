import {
    decode,
    decodeFromByteString,
    encode,
    encodeToByteString,
    isHexString,
} from "../../src/encoding/hex.native.js";

describe("hex (native)", function () {
    const data = new Uint8Array([0, 15, 16, 171, 255]);

    it("encode produces lowercase hex with two characters per byte", function () {
        expect(encode(data)).to.equal("000f10abff");
    });

    it("round-trip: decode(encode(data)) equals original data", function () {
        expect(Array.from(decode(encode(data)))).to.deep.equal(
            Array.from(data),
        );
    });

    it("isHexString returns false for a value that is not a string", function () {
        expect(isHexString(/** @type {any} */ (123))).to.equal(false);
    });

    it("isHexString returns false when nothing is left after 0x", function () {
        expect(isHexString("0x")).to.equal(false);
    });

    it("isHexString returns false for an odd number of characters", function () {
        expect(isHexString("abc")).to.equal(false);
    });

    it("isHexString returns false for a non-hexadecimal character", function () {
        expect(isHexString("0g")).to.equal(false);
    });

    it("isHexString returns true for valid hex, with or without 0x", function () {
        expect(isHexString("0xAbCd")).to.equal(true);
        expect(isHexString("00ff")).to.equal(true);
    });

    it("encodeToByteString maps each byte to the character with that code", function () {
        expect(encodeToByteString(new Uint8Array([72, 105, 0, 255]))).to.equal(
            "Hi\x00\xff",
        );
    });

    it("decodeFromByteString maps each character code back to a byte", function () {
        expect(Array.from(decodeFromByteString("Hi\x00\xff"))).to.deep.equal([
            72, 105, 0, 255,
        ]);
    });

    it("round-trip: decodeFromByteString(encodeToByteString(data)) equals original data", function () {
        expect(
            Array.from(decodeFromByteString(encodeToByteString(data))),
        ).to.deep.equal(Array.from(data));
    });
});
