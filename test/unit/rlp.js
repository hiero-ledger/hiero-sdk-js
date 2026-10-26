import { decodeRlp, encodeRlp, getBytes, hexlify } from "ethers";
import * as rlp from "../../src/encoding/rlp.js";

/**
 * @param {number} length
 * @param {number} fill
 * @returns {Uint8Array}
 */
function filled(length, fill) {
    return new Uint8Array(length).fill(fill);
}

/**
 * Convert an ethers decodeRlp result (hex strings) into bytes.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function toBytesTree(value) {
    return Array.isArray(value)
        ? value.map(toBytesTree)
        : getBytes(/** @type {string} */ (value));
}

describe("rlp", function () {
    const cases = {
        "empty bytes": new Uint8Array(),
        "single byte below 0x80": Uint8Array.of(0x7f),
        "single byte 0x80": Uint8Array.of(0x80),
        "zero byte": Uint8Array.of(0x00),
        "55-byte string": filled(55, 0xaa),
        "56-byte string": filled(56, 0xbb),
        "256-byte string": filled(256, 0xcc),
        "70000-byte string": filled(70000, 0xdd),
        "empty list": [],
        "nested empty lists": [[], [[]], [[], [[]]]],
        "list with a 55-byte payload": [filled(54, 0x01)],
        "list with a 56-byte payload": [filled(55, 0x01)],
        "mixed list": [
            Uint8Array.of(0x01),
            filled(20, 0x02),
            [filled(32, 0x03), [filled(32, 0x04), new Uint8Array()]],
        ],
    };

    for (const [name, value] of Object.entries(cases)) {
        it(`encodes and decodes ${name} like ethers`, function () {
            const encoded = rlp.encode(value);

            expect(hexlify(encoded)).to.equal(encodeRlp(value));
            expect(rlp.decode(encoded)).to.deep.equal(
                toBytesTree(decodeRlp(encoded)),
            );
        });
    }

    it("accepts 0x hex strings as items", function () {
        expect(hexlify(rlp.encode(["0x", "0x01", "0xdeadbeef"]))).to.equal(
            encodeRlp(["0x", "0x01", "0xdeadbeef"]),
        );
    });

    it("rejects hex strings without a 0x prefix or with odd length", function () {
        expect(() => rlp.encode("dead")).to.throw("invalid RLP item");
        expect(() => rlp.encode("0x123")).to.throw("invalid RLP item");
    });

    it("prefixes typed payloads with the type byte", function () {
        const payload = [Uint8Array.of(0x01), filled(60, 0x02)];

        expect(hexlify(rlp.encodeTyped(0x02, payload))).to.equal(
            "0x02" + encodeRlp(payload).substring(2),
        );
    });

    it("returns copies rather than views of the input", function () {
        const encoded = rlp.encode([filled(4, 0x05)]);
        const decoded = rlp.asList(rlp.decode(encoded));

        rlp.asBytes(decoded[0])[0] = 0xff;
        expect(encoded[2]).to.equal(0x05);
    });

    it("rejects empty input", function () {
        expect(() => rlp.decode(new Uint8Array())).to.throw("data too short");
    });

    it("rejects trailing bytes", function () {
        expect(() => rlp.decode(Uint8Array.of(0x01, 0x02))).to.throw(
            "unexpected junk",
        );
    });

    it("rejects truncated strings and lists", function () {
        expect(() => rlp.decode(Uint8Array.of(0x83, 0x01))).to.throw(
            "data too short",
        );
        expect(() => rlp.decode(Uint8Array.of(0xb8, 0x38))).to.throw(
            "data too short",
        );
        expect(() => rlp.decode(Uint8Array.of(0xc2, 0x01))).to.throw(
            "data too short",
        );
    });

    it("rejects a child that runs past its list", function () {
        expect(() =>
            rlp.decode(Uint8Array.of(0xc1, 0x82, 0x01, 0x02)),
        ).to.throw("child data too short");
    });

    it("narrows decoded items", function () {
        expect(() => rlp.asBytes([])).to.throw("expected a byte string");
        expect(() => rlp.asList(new Uint8Array())).to.throw("expected a list");
    });
});
