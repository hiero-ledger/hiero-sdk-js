import * as sdk from "../../../src/exports.js";
import * as hex from "../../../src/encoding/hex.js";
import vectors from "../utils/ClprOwnershipVectors.js";

const modules = import.meta.glob("../../../src/clpr/*.js");

describe("CLPR OwnershipProof", function () {
    let OwnershipProof;

    beforeEach(async function () {
        const load = modules["../../../src/clpr/OwnershipProof.js"];
        expect(load, "CLPR proof value must exist").toBeTypeOf("function");
        OwnershipProof = (await load()).default;
    });

    for (const vector of vectors.vectors) {
        describe(vector.signatureScheme, function () {
            function wireProof() {
                return {
                    publicKey: hex.decode(vector.publicKey),
                    signature: hex.decode(vector.channelSignature),
                    signatureScheme:
                        vector.signatureScheme === "ECDSA_SECP256K1" ? 0 : 1,
                };
            }

            it("decodes and encodes the shared completion fields unchanged", function () {
                const body = wireProof();
                const proof = OwnershipProof._fromProtobuf(body);

                expect(proof.scheme).toBe(
                    sdk.ClprSignatureScheme[vector.signatureScheme],
                );
                expect(hex.encode(proof.publicKey)).toBe(vector.publicKey);
                expect(hex.encode(proof.signature)).toBe(
                    vector.channelSignature,
                );
                expect(proof.isComplete()).toBe(true);
                expect(proof._toProtobuf()).toEqual({
                    ...body,
                    publicKey: new Uint8Array(body.publicKey),
                    signature: new Uint8Array(body.signature),
                });
            });

            it.each(["Uint8Array", "decoded hex"])(
                "copies constructor %s inputs and returned bytes",
                function (format) {
                    const body = wireProof();
                    const publicKey =
                        format === "Uint8Array"
                            ? new Uint8Array(body.publicKey)
                            : body.publicKey;
                    const signature =
                        format === "Uint8Array"
                            ? new Uint8Array(body.signature)
                            : body.signature;
                    const proof = new OwnershipProof({
                        scheme: sdk.ClprSignatureScheme[vector.signatureScheme],
                        publicKey,
                        signature,
                    });

                    publicKey.fill(0);
                    signature.fill(0);
                    proof.publicKey.fill(0);
                    proof.signature.fill(0);

                    expect(hex.encode(proof.publicKey)).toBe(vector.publicKey);
                    expect(hex.encode(proof.signature)).toBe(
                        vector.channelSignature,
                    );
                },
            );

            it("copies decoded bytes and encoded body bytes", function () {
                const body = wireProof();
                const proof = OwnershipProof._fromProtobuf(body);
                body.publicKey.fill(0);
                body.signature.fill(0);
                const encoded = proof._toProtobuf();
                encoded.publicKey.fill(0);
                encoded.signature.fill(0);

                expect(hex.encode(proof.publicKey)).toBe(vector.publicKey);
                expect(hex.encode(proof.signature)).toBe(
                    vector.channelSignature,
                );
                expect(proof._toProtobuf()).toEqual({
                    publicKey: new Uint8Array(hex.decode(vector.publicKey)),
                    signature: new Uint8Array(
                        hex.decode(vector.channelSignature),
                    ),
                    signatureScheme: wireProof().signatureScheme,
                });
            });

            it("keeps the signature scheme immutable", function () {
                const proof = OwnershipProof._fromProtobuf(wireProof());
                const otherScheme =
                    sdk.ClprSignatureScheme[
                        vector.signatureScheme === "ED25519"
                            ? "ECDSA_SECP256K1"
                            : "ED25519"
                    ];

                expect(Reflect.set(proof, "scheme", otherScheme)).toBe(false);
                expect(proof.scheme.toString()).toBe(vector.signatureScheme);
            });
        });
    }

    it("keeps ECDSA scheme zero when decoding non-empty proof bytes", function () {
        const vector = vectors.vectors[0];
        const proof = OwnershipProof._fromProtobuf({
            publicKey: hex.decode(vector.publicKey),
            signature: hex.decode(vector.channelSignature),
            signatureScheme: 0,
        });

        expect(proof.scheme).toBe(sdk.ClprSignatureScheme.ECDSA_SECP256K1);
        expect(proof.scheme.toString()).toBe("ECDSA_SECP256K1");
        expect(proof._toProtobuf().signatureScheme).toBe(0);
    });

    it.each([
        [0, 0, false],
        [32, 0, false],
        [0, 64, false],
        [32, 64, true],
        [1, 1, true],
    ])(
        "completeness for %i key bytes and %i signature bytes is %s",
        function (publicKeyLength, signatureLength, complete) {
            const proof = OwnershipProof._fromProtobuf({
                publicKey: new Uint8Array(publicKeyLength),
                signature: new Uint8Array(signatureLength),
                signatureScheme: 1,
            });

            expect(proof.isComplete()).toBe(complete);
        },
    );
});
