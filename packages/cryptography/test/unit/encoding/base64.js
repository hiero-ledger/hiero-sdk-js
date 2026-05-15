import * as base64 from "../../../src/encoding/base64.js";
import * as utf8 from "../../../src/encoding/utf8.js";

// from RFC 4648
const vectors = [
    ["", ""],
    ["f", "Zg=="],
    ["fo", "Zm8="],
    ["foo", "Zm9v"],
    ["foob", "Zm9vYg=="],
    ["fooba", "Zm9vYmE="],
    ["foobar", "Zm9vYmFy"],
];

describe("encoding/base64", function () {
    it("should encode", function () {
        for (const [decoded, encoded] of vectors) {
            expect(base64.encode(utf8.encode(decoded))).to.equal(encoded);
        }
    });

    it("should decode", function () {
        for (const [decoded, encoded] of vectors) {
            expect(utf8.decode(base64.decode(encoded))).to.equal(decoded);
        }
    });

    it("should encode Uint8Array to base64 string", function () {
        expect(base64.encode(new Uint8Array([72, 101, 108, 108, 111]))).to.equal("SGVsbG8=");
        expect(base64.encode(new Uint8Array([0, 255, 128]))).to.equal("AP+A");
    });

    it("should decode base64 string to Uint8Array", function () {
        expect(base64.decode("SGVsbG8=")).to.deep.equal(new Uint8Array([72, 101, 108, 108, 111]));
        expect(base64.decode("AP+A")).to.deep.equal(new Uint8Array([0, 255, 128]));
    });

    it("should round-trip encode and decode", function () {
        const inputs = [
            new Uint8Array([]),
            new Uint8Array([42]),
            new Uint8Array([0, 1, 127, 128, 254, 255]),
            new Uint8Array([72, 101, 108, 108, 111]),
        ];

        for (const input of inputs) {
            expect(base64.decode(base64.encode(input))).to.deep.equal(input);
        }
    });

    it("should handle empty input", function () {
        expect(base64.encode(new Uint8Array([]))).to.equal("");
        expect(base64.decode("")).to.deep.equal(new Uint8Array([]));
    });

    it("should handle single byte", function () {
        expect(base64.encode(new Uint8Array([0]))).to.equal("AA==");
        expect(base64.decode("AA==")).to.deep.equal(new Uint8Array([0]));
    });
});
