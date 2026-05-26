import { decode,encode } from "../../src/encoding/base64.native.js";

describe("base64 (native)", function () {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encoded = "SGVsbG8=";

    it("encode produces a valid base64 string", function () {
        expect(encode(data)).to.equal(encoded);
    });

    it("decode converts a base64 string back to bytes", function () {
        const result = decode(encoded);
        expect(Array.from(result)).to.deep.equal(Array.from(data));
    });

    it("round-trip: decode(encode(data)) equals original data", function () {
        const result = decode(encode(data));
        expect(Array.from(result)).to.deep.equal(Array.from(data));
    });
});
