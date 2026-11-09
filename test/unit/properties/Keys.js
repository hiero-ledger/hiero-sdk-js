import fc from "fast-check";
import PrivateKey from "../../../src/PrivateKey.js";
import PublicKey from "../../../src/PublicKey.js";
import { encode } from "../../../src/encoding/hex.js";

const keyBytes = fc.uint8Array({ minLength: 32, maxLength: 32 });

const ALGORITHMS = [
    {
        name: "ED25519",
        privateFromBytes: (/** @type {Uint8Array} */ bytes) =>
            PrivateKey.fromBytesED25519(bytes),
        privateFromRawString: (/** @type {string} */ text) =>
            PrivateKey.fromStringED25519(text),
        publicFromRawString: (/** @type {string} */ text) =>
            PublicKey.fromStringED25519(text),
    },
    {
        name: "ECDSA",
        privateFromBytes: (/** @type {Uint8Array} */ bytes) =>
            PrivateKey.fromBytesECDSA(bytes),
        privateFromRawString: (/** @type {string} */ text) =>
            PrivateKey.fromStringECDSA(text),
        publicFromRawString: (/** @type {string} */ text) =>
            PublicKey.fromStringECDSA(text),
    },
];

/**
 * @param {(bytes: Uint8Array) => PrivateKey} privateFromBytes
 * @param {Uint8Array} bytes
 * @returns {PrivateKey | null} null when the algorithm rejects these bytes
 */
function tryPrivateKey(privateFromBytes, bytes) {
    try {
        return privateFromBytes(bytes);
    } catch {
        return null;
    }
}

describe("Key properties", { retry: 0 }, function () {
    for (const algorithm of ALGORITHMS) {
        describe(algorithm.name, function () {
            it("a raw private key reads back what toStringRaw() writes", function () {
                fc.assert(
                    fc.property(keyBytes, (bytes) => {
                        const key = tryPrivateKey(
                            algorithm.privateFromBytes,
                            bytes,
                        );
                        fc.pre(key != null);

                        const raw = /** @type {PrivateKey} */ (
                            key
                        ).toStringRaw();
                        const readBack = algorithm.privateFromRawString(raw);

                        expect(readBack.toStringRaw()).to.equal(raw);
                        expect(readBack.toStringDer()).to.equal(
                            /** @type {PrivateKey} */ (key).toStringDer(),
                        );
                    }),
                );
            });

            it("a DER private key reads back through fromStringDer() and fromBytes()", function () {
                fc.assert(
                    fc.property(keyBytes, (bytes) => {
                        const key = tryPrivateKey(
                            algorithm.privateFromBytes,
                            bytes,
                        );
                        fc.pre(key != null);
                        const original = /** @type {PrivateKey} */ (key);

                        const fromString = PrivateKey.fromStringDer(
                            original.toStringDer(),
                        );
                        const fromBytes = PrivateKey.fromBytes(
                            original.toBytesDer(),
                        );

                        expect(fromString.toStringRaw()).to.equal(
                            original.toStringRaw(),
                        );
                        expect(fromString.toStringDer()).to.equal(
                            original.toStringDer(),
                        );
                        expect(fromBytes.toStringRaw()).to.equal(
                            original.toStringRaw(),
                        );
                        expect(fromBytes.toStringDer()).to.equal(
                            original.toStringDer(),
                        );
                    }),
                );
            });

            it("a public key reads back through the raw, DER string and DER bytes constructors", function () {
                fc.assert(
                    fc.property(keyBytes, (bytes) => {
                        const key = tryPrivateKey(
                            algorithm.privateFromBytes,
                            bytes,
                        );
                        fc.pre(key != null);
                        const original = /** @type {PrivateKey} */ (key)
                            .publicKey;

                        const fromRaw = algorithm.publicFromRawString(
                            original.toStringRaw(),
                        );
                        const fromDerString = PublicKey.fromString(
                            original.toStringDer(),
                        );
                        const fromDerBytes = PublicKey.fromBytes(
                            original.toBytesDer(),
                        );

                        for (const readBack of [
                            fromRaw,
                            fromDerString,
                            fromDerBytes,
                        ]) {
                            expect(readBack.toStringRaw()).to.equal(
                                original.toStringRaw(),
                            );
                            expect(readBack.toStringDer()).to.equal(
                                original.toStringDer(),
                            );
                        }
                    }),
                );
            });

            it("isDerKey() is true for DER hex and false for raw hex", function () {
                fc.assert(
                    fc.property(keyBytes, (bytes) => {
                        const key = tryPrivateKey(
                            algorithm.privateFromBytes,
                            bytes,
                        );
                        fc.pre(key != null);
                        const original = /** @type {PrivateKey} */ (key);

                        expect(PrivateKey.isDerKey(original.toStringDer())).to
                            .be.true;
                        expect(PrivateKey.isDerKey(original.toStringRaw())).to
                            .be.false;
                    }),
                );
            });
        });
    }

    describe("isDerKey() on random hex", function () {
        it("only says true when fromStringDer() accepts the hex as a DER key", function () {
            fc.assert(
                fc.property(fc.uint8Array({ maxLength: 200 }), (bytes) => {
                    const hex = encode(bytes);

                    if (PrivateKey.isDerKey(hex)) {
                        expect(() =>
                            PrivateKey.fromStringDer(hex),
                        ).to.not.throw();
                    }
                }),
            );
        });
    });
});
