// SPDX-License-Identifier: Apache-2.0

import fc from "fast-check";
import * as hex from "../../../src/encoding/hex.js";
import * as utf8 from "../../../src/encoding/utf8.js";
import * as rlp from "../../../src/encoding/rlp.js";

/**
 * A value RLP can encode: a byte string, or a list of such values nested at
 * most four levels deep.
 */
const { rlpValue } = fc.letrec((tie) => ({
    rlpValue: fc.oneof(
        { maxDepth: 4 },
        fc.uint8Array(),
        fc.array(tie("rlpValue"), { maxLength: 5 }),
    ),
}));

// The browser run replaces hex.js and utf8.js with their .browser.js
// versions, so these properties cover both.
//
// A retry runs with a new seed and could hide a failing property, so these
// tests never retry (the browser config sets `retry: 1`).
describe("Encoding properties", { retry: 0 }, function () {
    describe("hex", function () {
        it("decode() reads back what encode() writes", function () {
            fc.assert(
                fc.property(fc.uint8Array(), (bytes) => {
                    expect(
                        new Uint8Array(hex.decode(hex.encode(bytes))),
                    ).to.deep.equal(bytes);
                }),
            );
        });
    });

    describe("UTF-8", function () {
        it("decode() reads back what encode() writes", function () {
            fc.assert(
                fc.property(fc.string({ unit: "grapheme" }), (text) => {
                    expect(utf8.decode(utf8.encode(text))).to.equal(text);
                }),
            );
        });
    });

    describe("RLP", function () {
        it("decode() reads back what encode() writes", function () {
            fc.assert(
                fc.property(rlpValue, (value) => {
                    expect(rlp.decode(rlp.encode(value))).to.deep.equal(value);
                }),
            );
        });

        // A hang would fail the test by running past its timeout.
        it("decode() returns a value or throws an invalid RLP error for random bytes", function () {
            fc.assert(
                fc.property(fc.uint8Array(), (bytes) => {
                    try {
                        rlp.decode(bytes);
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(/** @type {Error} */ (error).message).to.match(
                            /^invalid RLP/,
                        );
                    }
                }),
            );
        });
    });
});
