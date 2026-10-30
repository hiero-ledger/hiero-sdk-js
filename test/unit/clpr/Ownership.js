import { Signature, SigningKey } from "ethers";
import { Key, KeyList, PrivateKey, ContractId } from "../../../src/exports.js";
import * as hex from "../../../src/encoding/hex.js";
import { keccak256 } from "../../../src/cryptography/keccak.js";
import vectors from "../utils/ClprOwnershipVectors.js";

// Discover the new module without a missing import preventing test collection.
const modules = import.meta.glob("../../../src/clpr/*.js");

function privateKey(vector) {
    return vector.signatureScheme === "ECDSA_SECP256K1"
        ? PrivateKey.fromStringECDSA(vector.privateKeyOrSeed)
        : PrivateKey.fromStringED25519(vector.privateKeyOrSeed);
}

function canonicalSignature(bytes) {
    expect(bytes).toHaveLength(64);
    // Append a recovery byte so ethers parses r || s, not compact EIP-2098.
    const signature = Signature.from(`0x${hex.encode(bytes)}1b`).getCanonical();
    return signature.r.substring(2) + signature.s.substring(2);
}

describe("CLPR ownership", function () {
    let ownership;

    beforeEach(async function () {
        const load = modules["../../../src/clpr/ownership.js"];
        expect(load, "CLPR ownership primitive must exist").toBeTypeOf(
            "function",
        );
        ownership = await load();
    });

    for (const vector of vectors.vectors) {
        describe(vector.signatureScheme, function () {
            it("encodes the canonical key and derives its scheme", function () {
                const encoded = ownership.encodePublicKey(
                    privateKey(vector).publicKey,
                );

                expect(encoded.publicKey).toBeInstanceOf(Uint8Array);
                expect(hex.encode(encoded.publicKey)).toBe(vector.publicKey);
                expect(encoded.scheme.toString()).toBe(vector.signatureScheme);
                expect(encoded.scheme.valueOf()).toBe(
                    vector.signatureScheme === "ECDSA_SECP256K1" ? 0 : 1,
                );
            });

            it("computes the Channel commitment from the HIP vector", function () {
                const commitment = ownership.computeChannelCommitment(
                    hex.decode(vectors.channelId),
                    privateKey(vector).publicKey,
                );

                expect(commitment).toBeInstanceOf(Uint8Array);
                expect(hex.encode(commitment)).toBe(vector.channelCommitment);
            });

            it("computes the Connector ID from the HIP vector", function () {
                const connectorId = ownership.computeConnectorId(
                    hex.decode(vectors.channelId),
                    privateKey(vector).publicKey,
                    hex.decode(vectors.salt),
                );

                expect(connectorId).toBeInstanceOf(Uint8Array);
                expect(hex.encode(connectorId)).toBe(vector.connectorId);
            });

            it("computes the Connector commitment from the HIP vector", function () {
                const commitment = ownership.computeConnectorCommitment(
                    hex.decode(vector.connectorId),
                    privateKey(vector).publicKey,
                );

                expect(commitment).toBeInstanceOf(Uint8Array);
                expect(hex.encode(commitment)).toBe(vector.connectorCommitment);
            });

            for (const kind of ["channel", "connector"]) {
                it(`signs the ${kind} reveal and verifies the HIP digest`, function () {
                    const key = privateKey(vector);
                    const preimage =
                        kind === "channel"
                            ? hex.decode(vectors.channelId)
                            : new Uint8Array([
                                  ...hex.decode(vector.connectorId),
                                  ...ownership.CLPR_SERVICE_ADDRESS,
                              ]);
                    const digest = vector[`${kind}Digest`];
                    const expectedSignature = vector[`${kind}Signature`];
                    const proof = ownership.sign(key, preimage);

                    expect(keccak256(`0x${hex.encode(preimage)}`)).toBe(
                        `0x${digest}`,
                    );
                    expect(proof.scheme.toString()).toBe(
                        vector.signatureScheme,
                    );
                    expect(hex.encode(proof.publicKey)).toBe(vector.publicKey);
                    expect(proof.isComplete()).toBe(true);
                    expect(proof.signature).toBeInstanceOf(Uint8Array);
                    expect(proof.signature).toHaveLength(64);

                    if (vector.signatureScheme === "ECDSA_SECP256K1") {
                        expect(canonicalSignature(proof.signature)).toBe(
                            canonicalSignature(hex.decode(expectedSignature)),
                        );
                        const signature = Signature.from(
                            `0x${hex.encode(proof.signature)}1b`,
                        );
                        expect(signature.isValid()).toBe(true);
                        const recoveredKeys = [27, 28].map((v) =>
                            SigningKey.recoverPublicKey(`0x${digest}`, {
                                r: signature.r,
                                s: signature.s,
                                v,
                            }),
                        );
                        expect(recoveredKeys).toContain(
                            `0x04${vector.publicKey}`,
                        );
                    } else {
                        expect(hex.encode(proof.signature)).toBe(
                            expectedSignature,
                        );
                        expect(
                            key.publicKey.verify(
                                hex.decode(digest),
                                proof.signature,
                            ),
                        ).toBe(true);
                    }
                });
            }

            it("keeps signed proof bytes independent of the preimage and returned buffers", function () {
                const preimage = hex.decode(vectors.channelId);
                const proof = ownership.sign(privateKey(vector), preimage);

                preimage.fill(0);
                proof.publicKey.fill(0);
                proof.signature.fill(0);

                expect(hex.encode(proof.publicKey)).toBe(vector.publicKey);
                expect(hex.encode(proof.signature)).toBe(
                    vector.channelSignature,
                );
            });

            it("returns a proof that can be used after the private key is released", function () {
                const { proxy, revoke } = Proxy.revocable(
                    privateKey(vector),
                    {},
                );
                const proof = ownership.sign(
                    proxy,
                    hex.decode(vectors.channelId),
                );

                revoke();

                expect(proof._toProtobuf()).toEqual({
                    publicKey: new Uint8Array(hex.decode(vector.publicKey)),
                    signature: new Uint8Array(
                        hex.decode(vector.channelSignature),
                    ),
                    signatureScheme:
                        vector.signatureScheme === "ECDSA_SECP256K1" ? 0 : 1,
                });
                expect(proof.isComplete()).toBe(true);
            });

            it("computes without changing the input bytes or key", function () {
                const channelId = hex.decode(vectors.channelId);
                const salt = hex.decode(vectors.salt);
                const connectorId = hex.decode(vector.connectorId);
                const key = privateKey(vector).publicKey;
                const originalKey = key.toStringRaw();

                ownership.computeChannelCommitment(channelId, key).fill(0);
                ownership.computeConnectorId(channelId, key, salt).fill(0);
                ownership.computeConnectorCommitment(connectorId, key).fill(0);
                ownership.encodePublicKey(key).publicKey.fill(0);

                expect(hex.encode(channelId)).toBe(vectors.channelId);
                expect(hex.encode(salt)).toBe(vectors.salt);
                expect(hex.encode(connectorId)).toBe(vector.connectorId);
                expect(key.toStringRaw()).toBe(originalKey);
                expect(
                    hex.encode(ownership.encodePublicKey(key).publicKey),
                ).toBe(vector.publicKey);
            });
        });
    }

    it("provides the 20-byte CLPR service address", function () {
        expect(ownership.CLPR_SERVICE_ADDRESS).toBeInstanceOf(Uint8Array);
        expect(ownership.CLPR_SERVICE_ADDRESS).toHaveLength(20);
        expect(hex.encode(ownership.CLPR_SERVICE_ADDRESS)).toBe(
            vectors.clprServiceAddress,
        );
    });

    const argumentsFor = [
        ["computeChannelCommitment", "channelId", (value, key) => [value, key]],
        [
            "computeConnectorId",
            "channelId",
            (value, key) => [value, key, hex.decode(vectors.salt)],
        ],
        [
            "computeConnectorId",
            "salt",
            (value, key) => [hex.decode(vectors.channelId), key, value],
        ],
        [
            "computeConnectorCommitment",
            "connectorId",
            (value, key) => [value, key],
        ],
    ];

    for (const [method, field, args] of argumentsFor) {
        it.each([31, 33])(
            `${method} rejects a %i-byte ${field} before key encoding`,
            function (length) {
                const value = new Uint8Array(length);
                const key = privateKey(vectors.vectors[0]).publicKey;

                expect(() => ownership[method](...args(value, key))).toThrow(
                    new RegExp(field),
                );
                expect(() => ownership[method](...args(value, null))).toThrow(
                    new RegExp(field),
                );
            },
        );
    }

    it.each([
        ["null", () => null],
        ["undefined", () => undefined],
        ["raw bytes", () => hex.decode(vectors.vectors[0].publicKey)],
        ["a string", () => vectors.vectors[0].publicKey],
        ["a plain object", () => ({})],
        ["a private key", () => privateKey(vectors.vectors[0])],
        [
            "a KeyList",
            () => new KeyList([privateKey(vectors.vectors[0]).publicKey]),
        ],
        ["an unsupported Key", () => new Key()],
        ["a contract key", () => new ContractId(123)],
    ])("rejects %s with a clear key error", function (_label, makeKey) {
        const key = makeKey();
        const channelId = hex.decode(vectors.channelId);
        const connectorId = hex.decode(vectors.vectors[0].connectorId);
        const salt = hex.decode(vectors.salt);
        const keyError = /PublicKey|unsupported.*key|key.*unsupported/i;

        expect(() => ownership.encodePublicKey(key)).toThrow(keyError);
        expect(() =>
            ownership.computeChannelCommitment(channelId, key),
        ).toThrow(keyError);
        expect(() =>
            ownership.computeConnectorId(channelId, key, salt),
        ).toThrow(keyError);
        expect(() =>
            ownership.computeConnectorCommitment(connectorId, key),
        ).toThrow(keyError);
    });
});
