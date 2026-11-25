import { decode, encode } from "../../src/encoding/utf8.native.js";

describe("utf8 (native)", function () {
    // "€" is 3 bytes in UTF-8
    const text = "a€";
    const bytes = [0x61, 0xe2, 0x82, 0xac];

    it("encode produces the UTF-8 bytes", function () {
        expect(Array.from(encode(text))).to.deep.equal(bytes);
    });

    it("decode converts UTF-8 bytes back to the string", function () {
        expect(decode(new Uint8Array(bytes))).to.equal(text);
    });

    it("round-trip: decode(encode(text)) equals original text", function () {
        expect(decode(encode(text))).to.equal(text);
    });
});
