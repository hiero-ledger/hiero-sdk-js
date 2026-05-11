import { describe, it, expect } from "vitest";
import {
    bytesToBits,
    crc8,
    convertRadix,
    legacy1,
} from "../../../src/util/entropy.js";
import legacyWords from "../../../src/words/legacy.js";

describe("entropy utilities", function () {
    // bytesToBits
    describe("bytesToBits", function () {
        it("should convert 0x00 to eight false bits", function () {
            const bits = bytesToBits(new Uint8Array([0x00]));
            expect(bits).to.have.length(8);
            expect(bits.every((b) => b === false)).to.be.true;
        });

        it("should convert 0xFF to eight true bits", function () {
            const bits = bytesToBits(new Uint8Array([0xff]));
            expect(bits).to.have.length(8);
            expect(bits.every((b) => b === true)).to.be.true;
        });

        it("should convert 0x80 to [true, false, false, false, false, false, false, false]", function () {
            const bits = bytesToBits(new Uint8Array([0x80]));
            expect(bits).to.deep.equal([
                true,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
            ]);
        });

        it("should convert 0x01 to [false, false, false, false, false, false, false, true]", function () {
            const bits = bytesToBits(new Uint8Array([0x01]));
            expect(bits).to.deep.equal([
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                true,
            ]);
        });

        it("should convert multiple bytes", function () {
            const bits = bytesToBits(new Uint8Array([0xca, 0xfe]));
            // 0xCA = 1100_1010, 0xFE = 1111_1110
            expect(bits).to.have.length(16);
            expect(bits).to.deep.equal([
                true,
                true,
                false,
                false,
                true,
                false,
                true,
                false,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                false,
            ]);
        });

        it("should return an empty array for empty input", function () {
            const bits = bytesToBits(new Uint8Array([]));
            expect(bits).to.have.length(0);
        });
    });

    // crc8
    describe("crc8", function () {
        it("should return 0xFF XOR 0xFF = 0 for a single-byte input (only checksum byte, no data)", function () {
            // With one byte, the loop runs 0 times, so crc stays 0xFF.
            // Final: 0xFF ^ 0xFF = 0x00
            const result = crc8(new Uint8Array([0x42]));
            expect(result).to.equal(0x00);
        });

        it("should compute a deterministic checksum for known data", function () {
            const data = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x00]);
            const checksum = crc8(data);
            // Run again to verify determinism
            expect(crc8(data)).to.equal(checksum);
            expect(typeof checksum).to.equal("number");
            expect(checksum).to.be.gte(0);
            expect(checksum).to.be.lte(255);
        });

        it("should produce different checksums for different data", function () {
            const a = crc8(new Uint8Array([0x01, 0x02, 0x00]));
            const b = crc8(new Uint8Array([0x03, 0x04, 0x00]));
            expect(a).to.not.equal(b);
        });

        it("should process all bytes except the last", function () {
            // Changing the last byte should not affect the checksum
            const a = crc8(new Uint8Array([0x01, 0x02, 0xAA]));
            const b = crc8(new Uint8Array([0x01, 0x02, 0xBB]));
            expect(a).to.equal(b);
        });
    });

    // convertRadix
    describe("convertRadix", function () {
        it("should convert base-10 digits to base-256 bytes", function () {
            // 256 in base-10 = [2, 5, 6]
            // In base-256 that is [1, 0] (256 = 1*256 + 0)
            const result = convertRadix([2, 5, 6], 10, 256, 2);
            expect(result).to.deep.equal(new Uint8Array([1, 0]));
        });

        it("should convert [0] to all zeros", function () {
            const result = convertRadix([0], 10, 256, 4);
            expect(result).to.deep.equal(new Uint8Array([0, 0, 0, 0]));
        });

        it("should convert single digit in same radix", function () {
            // 42 in base-256 → base-256 with length 1 = [42]
            const result = convertRadix([42], 256, 256, 1);
            expect(result).to.deep.equal(new Uint8Array([42]));
        });

        it("should pad with leading zeros when toLength is larger", function () {
            // 1 in base-10 = [0, 0, 1] in base-256 with length 3
            const result = convertRadix([1], 10, 256, 3);
            expect(result).to.deep.equal(new Uint8Array([0, 0, 1]));
        });

        it("should handle large radix (BIP-39 wordlist size 2048)", function () {
            // index 0 in a 2048-word list → should be all zeros
            const result = convertRadix([0], 2048, 256, 2);
            expect(result).to.deep.equal(new Uint8Array([0, 0]));
        });
    });

    // legacy1
    describe("legacy1", function () {
        it("should decode a known 22-word legacy mnemonic", function () {
            const words = [
                "jolly",
                "kidnap",
                "tom",
                "lawn",
                "drunk",
                "chick",
                "optic",
                "lust",
                "mutter",
                "mole",
                "bride",
                "galley",
                "dense",
                "member",
                "sage",
                "neural",
                "widow",
                "decide",
                "curb",
                "aboard",
                "margin",
                "manure",
            ];

            const [entropy, checksum] = legacy1(words, legacyWords);

            // Should return 32 bytes of entropy
            expect(entropy).to.be.instanceOf(Uint8Array);
            expect(entropy).to.have.length(32);

            // Checksum should be a byte value
            expect(checksum).to.be.gte(0);
            expect(checksum).to.be.lte(255);
        });

        it("should return consistent results for the same input", function () {
            const words = [
                "jolly",
                "kidnap",
                "tom",
                "lawn",
                "drunk",
                "chick",
                "optic",
                "lust",
                "mutter",
                "mole",
                "bride",
                "galley",
                "dense",
                "member",
                "sage",
                "neural",
                "widow",
                "decide",
                "curb",
                "aboard",
                "margin",
                "manure",
            ];

            const [entropy1, checksum1] = legacy1(words, legacyWords);
            const [entropy2, checksum2] = legacy1(words, legacyWords);

            expect(entropy1).to.deep.equal(entropy2);
            expect(checksum1).to.equal(checksum2);
        });

        it("should produce different entropy for different words", function () {
            // Use first 22 words from the legacy wordlist
            const words1 = legacyWords.slice(0, 22);
            const words2 = legacyWords.slice(22, 44);

            const [entropy1] = legacy1(words1, legacyWords);
            const [entropy2] = legacy1(words2, legacyWords);

            expect(entropy1).to.not.deep.equal(entropy2);
        });

        it("should be case-insensitive", function () {
            const lower = ["jolly", "kidnap", "tom", "lawn", "drunk", "chick",
                "optic", "lust", "mutter", "mole", "bride", "galley",
                "dense", "member", "sage", "neural", "widow", "decide",
                "curb", "aboard", "margin", "manure"];
            const upper = lower.map((w) => w.toUpperCase());

            const [entropyLower] = legacy1(lower, legacyWords);
            const [entropyUpper] = legacy1(upper, legacyWords);

            expect(entropyLower).to.deep.equal(entropyUpper);
        });
    });
});
