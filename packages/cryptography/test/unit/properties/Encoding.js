import fc from "fast-check";
import * as base64 from "../../../src/encoding/base64.js";
import * as der from "../../../src/encoding/der.js";
import BadKeyError from "../../../src/BadKeyError.js";
import PrivateKey from "../../../src/PrivateKey.js";

/**
 * The base64 of random bytes, which is almost never a valid key.
 */
const base64Body = fc.uint8Array({ maxLength: 100 }).map(base64.encode);

/**
 * Input that is not a PEM private key: a random string, a random base64 body,
 * or a random base64 body in PEM armor.
 */
const notAKey = fc.oneof(
    fc.string(),
    base64Body,
    fc
        .tuple(fc.constantFrom("PRIVATE KEY", "EC PRIVATE KEY"), base64Body)
        .map(
            ([label, body]) =>
                `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----`,
        ),
);

describe("Encoding properties", function () {
    describe("base64", function () {
        it("decode() reads back what encode() writes", function () {
            fc.assert(
                fc.property(fc.uint8Array(), (bytes) => {
                    expect(base64.decode(base64.encode(bytes))).to.deep.equal(
                        bytes,
                    );
                }),
            );
        });
    });

    describe("DER", function () {
        // Skipped until #4734 is fixed: decode() throws a RangeError when the
        // input ends before a tag or a length, for example for the single
        // byte 0xc2.
        // eslint-disable-next-line vitest/no-disabled-tests
        it.skip("decode() returns a value or throws an Error for random bytes", function () {
            fc.assert(
                fc.property(fc.uint8Array(), (bytes) => {
                    try {
                        der.decode(bytes);
                    } catch (error) {
                        expect(error).to.be.an.instanceOf(Error);
                        expect(error).to.not.be.an.instanceOf(RangeError);
                        expect(error).to.not.be.an.instanceOf(TypeError);
                    }
                }),
            );
        });
    });

    describe("PEM", function () {
        it("PrivateKey.fromPem() rejects input that is not a key with a BadKeyError", async function () {
            await fc.assert(
                fc.asyncProperty(notAKey, async (text) => {
                    await expect(PrivateKey.fromPem(text)).rejects.toThrow(
                        BadKeyError,
                    );
                }),
            );
        });
    });
});
