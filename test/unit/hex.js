import * as hex from "../../src/encoding/hex.browser.js";

describe("hex", function () {
    describe("encode", function () {
        it("should encode empty array to empty string", function () {
            expect(hex.encode(new Uint8Array([]))).to.equal("");
        });

        it("should encode bytes to hex string", function () {
            expect(hex.encode(new Uint8Array([0x01, 0x02, 0x03]))).to.equal(
                "010203",
            );
        });

        it("should encode bytes with zero values", function () {
            expect(hex.encode(new Uint8Array([0x00, 0x01, 0x00]))).to.equal(
                "000100",
            );
        });

        it("should properly pad single digits with leading zeros", function () {
            expect(hex.encode(new Uint8Array([0x01, 0x0a, 0x0f]))).to.equal(
                "010a0f",
            );
        });

        it("should handle full byte range", function () {
            const array = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                array[i] = i;
            }
            const encoded = hex.encode(array);
            expect(encoded.length).to.equal(512); // Each byte becomes 2 hex chars
            expect(encoded.substring(0, 8)).to.equal("00010203");
            expect(encoded.substring(510)).to.equal("ff");
        });
    });

    describe("decode", function () {
        it("should decode empty string to empty array", function () {
            expect(hex.decode("")).to.deep.equal(new Uint8Array([]));
        });

        it("should decode hex string to bytes", function () {
            expect(hex.decode("010203")).to.deep.equal(
                new Uint8Array([0x01, 0x02, 0x03]),
            );
        });

        it("should decode hex string with 0x prefix", function () {
            expect(hex.decode("0x010203")).to.deep.equal(
                new Uint8Array([0x01, 0x02, 0x03]),
            );
        });

        it("should handle uppercase hex characters", function () {
            expect(hex.decode("0A0B0C")).to.deep.equal(
                new Uint8Array([0x0a, 0x0b, 0x0c]),
            );
        });

        it("should handle lowercase hex characters", function () {
            expect(hex.decode("0a0b0c")).to.deep.equal(
                new Uint8Array([0x0a, 0x0b, 0x0c]),
            );
        });

        it("should properly decode values with leading zeros", function () {
            expect(hex.decode("00010203")).to.deep.equal(
                new Uint8Array([0x00, 0x01, 0x02, 0x03]),
            );
        });

        it("should handle full byte range", function () {
            let hexString = "";
            for (let i = 0; i < 256; i++) {
                hexString += i.toString(16).padStart(2, "0");
            }
            const decoded = hex.decode(hexString);

            expect(decoded.length).to.equal(256);
            for (let i = 0; i < 256; i++) {
                expect(decoded[i]).to.equal(i);
            }
        });
    });

    describe("hexZeroPadded", function () {
        it("should pad a short value to requested length", function () {
            const value = new Uint8Array([0x01, 0x02]);
            expect(hex.hexZeroPadded(value, 4)).to.equal("00000102");
        });

        it("should not pad a value that already matches requested length", function () {
            const value = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
            expect(hex.hexZeroPadded(value, 4)).to.equal("01020304");
        });

        it("should handle empty array with padding", function () {
            const value = new Uint8Array([]);
            expect(hex.hexZeroPadded(value, 2)).to.equal("0000");
        });

        it("should pad values with leading zeros", function () {
            const value = new Uint8Array([0x00, 0x01]);
            expect(hex.hexZeroPadded(value, 4)).to.equal("00000001");
        });

        it("should output hex values without 0x prefix", function () {
            const value = new Uint8Array([0xff]);
            expect(hex.hexZeroPadded(value, 1)).to.equal("ff");
        });

        it("should handle padding with many zeros", function () {
            const value = new Uint8Array([0x01]);
            expect(hex.hexZeroPadded(value, 8)).to.equal("0000000000000001");
        });
    });

    describe("isHexString", function () {
        it("should return true for valid hex strings without 0x prefix", function () {
            expect(hex.isHexString("010203")).to.be.true;
            expect(hex.isHexString("abcdef")).to.be.true;
            expect(hex.isHexString("ABCDEF")).to.be.true;
            expect(hex.isHexString("1234567890abcdef")).to.be.true;
        });

        it("should return true for valid hex strings with 0x prefix", function () {
            expect(hex.isHexString("0x010203")).to.be.true;
            expect(hex.isHexString("0xabcdef")).to.be.true;
            expect(hex.isHexString("0xABCDEF")).to.be.true;
            expect(hex.isHexString("0x1234567890abcdef")).to.be.true;
        });

        it("should return true for hex strings with mixed case", function () {
            expect(hex.isHexString("0aBcDeF0")).to.be.true;
            expect(hex.isHexString("0x0aBcDeF0")).to.be.true;
            expect(hex.isHexString("aBcDeF123456")).to.be.true;
        });

        it("should return true for hex strings with all zeros", function () {
            expect(hex.isHexString("000000")).to.be.true;
            expect(hex.isHexString("0x000000")).to.be.true;
        });

        it("should return true for single byte hex strings", function () {
            expect(hex.isHexString("00")).to.be.true;
            expect(hex.isHexString("0x00")).to.be.true;
            expect(hex.isHexString("ff")).to.be.true;
            expect(hex.isHexString("0xff")).to.be.true;
        });

        it("should return false for non-string inputs", function () {
            expect(hex.isHexString(null)).to.be.false;
            expect(hex.isHexString(undefined)).to.be.false;
            expect(hex.isHexString(123)).to.be.false;
            expect(hex.isHexString({})).to.be.false;
            expect(hex.isHexString([])).to.be.false;
            expect(hex.isHexString(true)).to.be.false;
        });

        it("should return false for empty strings", function () {
            expect(hex.isHexString("")).to.be.false;
        });

        it("should return false for strings with only 0x prefix", function () {
            expect(hex.isHexString("0x")).to.be.false;
        });

        it("should return false for strings with odd length (after removing 0x)", function () {
            expect(hex.isHexString("0")).to.be.false;
            expect(hex.isHexString("123")).to.be.false;
            expect(hex.isHexString("0x123")).to.be.false;
            expect(hex.isHexString("abcdef1")).to.be.false;
        });

        it("should return false for strings with invalid hex characters", function () {
            expect(hex.isHexString("0g")).to.be.false;
            expect(hex.isHexString("0x0g")).to.be.false;
            expect(hex.isHexString("abcdefgh")).to.be.false;
            expect(hex.isHexString("0xabcdefgh")).to.be.false;
            expect(hex.isHexString("12 34")).to.be.false;
            expect(hex.isHexString("12-34")).to.be.false;
            expect(hex.isHexString("12_34")).to.be.false;
        });

        it("should return false for strings with spaces", function () {
            expect(hex.isHexString("01 02 03")).to.be.false;
            expect(hex.isHexString("0x01 02 03")).to.be.false;
            expect(hex.isHexString(" 010203")).to.be.false;
            expect(hex.isHexString("010203 ")).to.be.false;
        });

        it("should return false for strings with special characters", function () {
            expect(hex.isHexString("01@02")).to.be.false;
            expect(hex.isHexString("01#02")).to.be.false;
            expect(hex.isHexString("01$02")).to.be.false;
            expect(hex.isHexString("01%02")).to.be.false;
        });

        it("should return false for strings that start with 0x but have invalid content", function () {
            expect(hex.isHexString("0x0g")).to.be.false;
            expect(hex.isHexString("0xabcdefgh")).to.be.false;
            expect(hex.isHexString("0x12 34")).to.be.false;
        });
    });

    describe("encode/decode roundtrip", function () {
        it("should roundtrip simple values", function () {
            const original = new Uint8Array([0x01, 0x02, 0x03]);
            const encoded = hex.encode(original);
            const decoded = hex.decode(encoded);
            expect(decoded).to.deep.equal(original);
        });

        it("should roundtrip values with zeros", function () {
            const original = new Uint8Array([0x00, 0x00, 0x01, 0x00]);
            const encoded = hex.encode(original);
            const decoded = hex.decode(encoded);
            expect(decoded).to.deep.equal(original);
        });

        it("should roundtrip large values", function () {
            const original = new Uint8Array(100);
            for (let i = 0; i < 100; i++) {
                original[i] = i % 256;
            }
            const encoded = hex.encode(original);
            const decoded = hex.decode(encoded);
            expect(decoded).to.deep.equal(original);
        });

        it("should roundtrip full byte range", function () {
            const original = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                original[i] = i;
            }
            const encoded = hex.encode(original);
            const decoded = hex.decode(encoded);
            expect(decoded).to.deep.equal(original);
        });
    });
});
