import * as der from "../../../src/encoding/der.js";
import * as base64 from "../../../src/encoding/base64.js";
import * as hex from "../../../src/encoding/hex.js";

describe("encoding/der", function () {
    //Tag-level tests
    it("should decode INTEGER (1 byte)", function () {
        // 0x02 = INTEGER tag, 0x01 = length 1, 0x05 = value 5
        expect(der.decode(new Uint8Array([0x02, 0x01, 0x05]))).to.deep.equal({
            int: 5,
        });
    });

    it("should decode INTEGER (2 bytes)", function () {
        // 0x08 0x00 = 2048
        expect(
            der.decode(new Uint8Array([0x02, 0x02, 0x08, 0x00])),
        ).to.deep.equal({ int: 2048 });
    });

    it("should decode INTEGER (3 bytes)", function () {
        // 0x01 0x00 0x00 = 65536 (prefixed with 0x00 internally to form 4-byte uint32)
        expect(
            der.decode(new Uint8Array([0x02, 0x03, 0x01, 0x00, 0x00])),
        ).to.deep.equal({ int: 65536 });
    });

    it("should decode INTEGER (4 bytes)", function () {
        // 0x00 0x01 0x00 0x00 = 65536
        expect(
            der.decode(new Uint8Array([0x02, 0x04, 0x00, 0x01, 0x00, 0x00])),
        ).to.deep.equal({ int: 65536 });
    });

    it("should throw for INTEGER with length > 4", function () {
        expect(() =>
            der.decode(
                new Uint8Array([0x02, 0x05, 0x00, 0x00, 0x00, 0x00, 0x01]),
            ),
        ).to.throw("unsupported DER integer length of 5 bytes");
    });

    it("should decode OCTET STRING", function () {
        // 0x04 = OCTET STRING tag
        expect(
            der.decode(new Uint8Array([0x04, 0x03, 0x01, 0x02, 0x03])),
        ).to.deep.equal({ bytes: new Uint8Array([0x01, 0x02, 0x03]) });
    });

    it("should decode NULL", function () {
        // 0x05 = NULL tag, 0x00 = length 0
        expect(der.decode(new Uint8Array([0x05, 0x00]))).to.deep.equal({});
    });

    it("should decode OBJECT IDENTIFIER", function () {
        // OID 1.2.840: first byte = 40*1+2 = 42 (0x2a), then 840 = 6*128+72 → 0x86 0x48
        expect(
            der.decode(new Uint8Array([0x06, 0x03, 0x2a, 0x86, 0x48])),
        ).to.deep.equal({ ident: "1.2.840" });
    });

    it("should decode empty SEQUENCE", function () {
        expect(der.decode(new Uint8Array([0x30, 0x00]))).to.deep.equal({
            seq: [],
        });
    });

    it("should decode nested SEQUENCE", function () {
        // SEQUENCE { SEQUENCE { INTEGER 5 } }
        expect(
            der.decode(
                new Uint8Array([0x30, 0x05, 0x30, 0x03, 0x02, 0x01, 0x05]),
            ),
        ).to.deep.equal({ seq: [{ seq: [{ int: 5 }] }] });
    });

    it("should decode SEQUENCE with multiple elements", function () {
        // SEQUENCE { INTEGER 1, NULL, OCTET STRING [0xAB] }
        expect(
            der.decode(
                new Uint8Array([
                    0x30, 0x08, 0x02, 0x01, 0x01, 0x05, 0x00, 0x04, 0x01, 0xab,
                ]),
            ),
        ).to.deep.equal({
            seq: [{ int: 1 }, {}, { bytes: new Uint8Array([0xab]) }],
        });
    });

    it("should throw for unsupported DER type tag", function () {
        // 0x07 is not a supported tag
        expect(() => der.decode(new Uint8Array([0x07, 0x00]))).to.throw(
            "unsupported DER type tag: 7",
        );
    });

    // Length encoding
    it("should handle long-form DER length", function () {
        // OCTET STRING with 128 bytes — length encoded as 0x81 0x80 (long form)
        const payload = new Uint8Array(128);
        const encoded = new Uint8Array([0x04, 0x81, 0x80, ...payload]);
        expect(der.decode(encoded)).to.deep.equal({ bytes: payload });
    });

    it("should decode ed25519 private key", function () {
        // taken from Keys.test.js
        const privateKey =
            "302e020100300506032b657004220420db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10";
        const rawPrivKey =
            "db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10";

        const privKeyBytes = hex.decode(privateKey);
        const rawPrivKeyBytes = hex.decode(rawPrivKey);

        const decoded = der.decode(privKeyBytes);

        expect(decoded).to.deep.equal({
            seq: [
                { int: 0 },
                {
                    seq: [{ ident: "1.3.101.112" }],
                },
                // in PKCS `PrivateKeyInfo` the key data is an opaque byte string
                // for Ed25519 the contents is another tagged DER `OCTET STRING`, kind of redundant
                // but for other key types this could be a complex structure
                { bytes: Uint8Array.of(4, 32, ...rawPrivKeyBytes) },
            ],
        });
    });

    it("should decode EncryptedPrivateKeyInfo", function () {
        const base64Encoded =
            "MIGbMFcGCSqGSIb3DQEFDTBKMCkGCSqGSIb3DQEFDDAcBAi8WY7Gy2tThQICCAAw" +
            "DAYIKoZIhvcNAgkFADAdBglghkgBZQMEAQIEEOq46NPss58chbjUn20NoK0EQG1x" +
            "R88hIXcWDOECttPTNlMXWJt7Wufm1YwBibrxmCq1QykIyTYhy1TZMyxyPxlYW6aV" +
            "9hlo4YEh3uEaCmfJzWM=";

        // otherwise the types produced by `.subarray()` won't match
        const data = base64.decode(base64Encoded);

        const decoded = der.decode(data);

        expect(decoded).to.deep.equal({
            seq: [
                {
                    seq: [
                        // algorithm: PBES2
                        { ident: "1.2.840.113549.1.5.13" },
                        // parameters
                        {
                            seq: [
                                {
                                    seq: [
                                        // PBKDF2
                                        { ident: "1.2.840.113549.1.5.12" },
                                        {
                                            seq: [
                                                // salt
                                                {
                                                    bytes: hex.decode(
                                                        "bc598ec6cb6b5385",
                                                    ),
                                                },
                                                // iterations
                                                { int: 2048 },
                                                {
                                                    seq: [
                                                        // HMAC-SHA-256
                                                        {
                                                            ident: "1.2.840.113549.2.9",
                                                        },
                                                        // no parameters
                                                        {},
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    seq: [
                                        // AES-128-CBC
                                        { ident: "2.16.840.1.101.3.4.1.2" },
                                        // IV
                                        {
                                            bytes: hex.decode(
                                                "eab8e8d3ecb39f1c85b8d49f6d0da0ad",
                                            ),
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                // encrypted key data
                {
                    bytes: hex.decode(
                        "6d7147cf212177160ce102b6d3d3365317589b7b5ae7e6d58c0189baf1982ab5" +
                            "432908c93621cb54d9332c723f19585ba695f61968e18121dee11a0a67c9cd63",
                    ),
                },
            ],
        });
    });
});
