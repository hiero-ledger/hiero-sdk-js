import {
    AlgorithmIdentifier,
    PrivateKeyInfo,
    EncryptedPrivateKeyInfo,
} from "../../src/primitive/pkcs.js";
import PrivateKey from "../../src/PrivateKey.js";
import * as der from "../../src/encoding/der.js";
import * as base64 from "../../src/encoding/base64.js";
import * as hex from "../../src/encoding/hex.js";

const base64Encoded =
    "MIGbMFcGCSqGSIb3DQEFDTBKMCkGCSqGSIb3DQEFDDAcBAi8WY7Gy2tThQICCAAw" +
    "DAYIKoZIhvcNAgkFADAdBglghkgBZQMEAQIEEOq46NPss58chbjUn20NoK0EQG1x" +
    "R88hIXcWDOECttPTNlMXWJt7Wufm1YwBibrxmCq1QykIyTYhy1TZMyxyPxlYW6aV" +
    "9hlo4YEh3uEaCmfJzWM=";

const passphrase = "this is a passphrase";

const keyStr =
    "302e020100300506032b657004220420db484b828e64b2d8f12ce3c0a0e93a0b8cce7af1bb8f39c97732394482538e10";

// otherwise the types produced by `.subarray()` won't match
const data = base64.decode(base64Encoded);

describe("primitive/pkcs", function () {
    describe("AlgorithmIdentifier", function () {
        it("constructs from a valid SEQUENCE with OID and parameters", function () {
            const asn = { seq: [{ ident: "1.2.3.4" }, { int: 42 }] };
            const alg = new AlgorithmIdentifier(asn);
            expect(alg.algIdent).to.equal("1.2.3.4");
            expect(alg.parameters).to.deep.equal({ int: 42 });
        });

        it("constructs from a SEQUENCE with OID only (no parameters)", function () {
            const asn = { seq: [{ ident: "1.3.101.112" }] };
            const alg = new AlgorithmIdentifier(asn);
            expect(alg.algIdent).to.equal("1.3.101.112");
            expect(alg.parameters).to.be.undefined;
        });

        it("toString returns JSON representation", function () {
            const asn = { seq: [{ ident: "1.2.3" }, { int: 5 }] };
            const alg = new AlgorithmIdentifier(asn);
            expect(JSON.parse(alg.toString())).to.deep.equal(alg);
        });

        it("throws when input is not a SEQUENCE", function () {
            const asn = { int: 42 };
            expect(() => new AlgorithmIdentifier(asn)).to.throw(
                "error parsing AlgorithmIdentifier",
            );
        });

        it("throws when SEQUENCE is empty", function () {
            const asn = { seq: [] };
            expect(() => new AlgorithmIdentifier(asn)).to.throw(
                "error parsing AlgorithmIdentifier",
            );
        });

        it("throws when first element is not an OID", function () {
            const asn = { seq: [{ int: 99 }] };
            expect(() => new AlgorithmIdentifier(asn)).to.throw(
                "error parsing AlgorithmIdentifier",
            );
        });
    });

    describe("PrivateKeyInfo", function () {
        it("parses a valid Ed25519 PKCS#8 DER-encoded private key", async function () {
            const encrypted = EncryptedPrivateKeyInfo.parse(data);
            const decrypted = await encrypted.decrypt(passphrase);

            expect(decrypted.version).to.equal(0);
            expect(decrypted.algId.algIdent).to.equal("1.3.101.112");

            const keyData = der.decode(decrypted.privateKey);
            expect("bytes" in keyData).to.be.true;
        });

        it("constructs from a valid ASN object directly", function () {
            const asn = {
                seq: [
                    { int: 0 },
                    { seq: [{ ident: "1.3.101.112" }] },
                    { bytes: new Uint8Array([1, 2, 3]) },
                ],
            };
            const info = new PrivateKeyInfo(asn);
            expect(info.version).to.equal(0);
            expect(info.algId.algIdent).to.equal("1.3.101.112");
            expect(info.privateKey).to.deep.equal(new Uint8Array([1, 2, 3]));
        });

        it("throws when version is not 0", function () {
            const asn = {
                seq: [
                    { int: 1 },
                    { seq: [{ ident: "1.3.101.112" }] },
                    { bytes: new Uint8Array([1, 2, 3]) },
                ],
            };
            expect(() => new PrivateKeyInfo(asn)).to.throw(
                "expected version = 0",
            );
        });

        it("throws when version element is not an integer", function () {
            const asn = {
                seq: [
                    { ident: "not-an-int" },
                    { seq: [{ ident: "1.3.101.112" }] },
                    { bytes: new Uint8Array([1, 2, 3]) },
                ],
            };
            expect(() => new PrivateKeyInfo(asn)).to.throw(
                "expected version = 0",
            );
        });

        it("throws when third element is not an OCTET STRING", function () {
            const asn = {
                seq: [
                    { int: 0 },
                    { seq: [{ ident: "1.3.101.112" }] },
                    { int: 99 },
                ],
            };
            expect(() => new PrivateKeyInfo(asn)).to.throw(
                "expected octet string as 3rd element",
            );
        });

        it("throws when input is not a SEQUENCE", function () {
            const asn = { int: 42 };
            expect(() => new PrivateKeyInfo(asn)).to.throw(
                "error parsing PrivateKeyInfo",
            );
        });

        it("throws when SEQUENCE has wrong number of elements", function () {
            const asn = {
                seq: [{ int: 0 }, { seq: [{ ident: "1.3.101.112" }] }],
            };
            expect(() => new PrivateKeyInfo(asn)).to.throw(
                "error parsing PrivateKeyInfo",
            );
        });
    });

    describe("EncryptedPrivateKeyInfo", function () {
        it("decodes EncryptedPrivateKeyInfo", function () {
            const privateKeyInfo = EncryptedPrivateKeyInfo.parse(data);
            expect(privateKeyInfo).to.deep.equal(
                new EncryptedPrivateKeyInfo({
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
                                                {
                                                    ident: "1.2.840.113549.1.5.12",
                                                },
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
                                                {
                                                    ident: "2.16.840.1.101.3.4.1.2",
                                                },
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
                }),
            );
        });

        it("constructs from a valid ASN object directly", function () {
            const asn = {
                seq: [
                    { seq: [{ ident: "1.2.3" }] },
                    { bytes: new Uint8Array([1, 2, 3]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            expect(info.algId.algIdent).to.equal("1.2.3");
            expect(info.data).to.deep.equal(new Uint8Array([1, 2, 3]));
        });

        it("throws when second element is not OCTET STRING", function () {
            const asn = {
                seq: [{ seq: [{ ident: "1.2.3" }] }, { int: 42 }],
            };
            expect(() => new EncryptedPrivateKeyInfo(asn)).to.throw(
                "error parsing EncryptedPrivateKeyInfo",
            );
        });

        it("throws when SEQUENCE has wrong number of elements", function () {
            const asn = { seq: [{ seq: [{ ident: "1.2.3" }] }] };
            expect(() => new EncryptedPrivateKeyInfo(asn)).to.throw(
                "error parsing EncryptedPrivateKeyInfo",
            );
        });

        it("throws when input is not a SEQUENCE", function () {
            const asn = { bytes: new Uint8Array([1]) };
            expect(() => new EncryptedPrivateKeyInfo(asn)).to.throw(
                "error parsing EncryptedPrivateKeyInfo",
            );
        });
    });

    describe("EncryptedPrivateKeyInfo.decrypt", function () {
        it("decrypts the proper private key", async function () {
            const encrypted = EncryptedPrivateKeyInfo.parse(data);
            const decrypted = await encrypted.decrypt(passphrase);

            expect(decrypted.algId.algIdent).to.deep.equal("1.3.101.112");

            // for the private key data is a DER encoded octet string
            const keyData = der.decode(decrypted.privateKey);
            expect("bytes" in keyData).to.be.true;

            // @ts-ignore Typescript doesn't see that we just checked `keyData`
            expect(
                PrivateKey.fromBytes(keyData.bytes).toString(),
            ).to.deep.equal(keyStr);
        });

        it("throws for unsupported encryption algorithm (not PBES2)", async function () {
            const asn = {
                seq: [
                    { seq: [{ ident: "1.2.3.4.5" }, { int: 0 }] }, // not PBES2 OID
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include(
                    "unsupported key encryption algorithm",
                );
            }
            expect(threw).to.be.true;
        });

        it("throws for PBES2 with no parameters", async function () {
            const asn = {
                seq: [
                    { seq: [{ ident: "1.2.840.113549.1.5.13" }] }, // missing parameters
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include(
                    "unsupported key encryption algorithm",
                );
            }
            expect(threw).to.be.true;
        });

        it("throws for unsupported KDF (not PBKDF2)", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.3.4.5" },
                                            { int: 0 },
                                        ],
                                    }, // KDF OID
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                        ],
                                    }, // Enc scheme
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include(
                    "unsupported key derivation function",
                );
            }
            expect(threw).to.be.true;
        });

        it("throws for PBKDF2 with no KDF parameters", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                        ],
                                    }, // PBKDF2 OID without params
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include(
                    "unsupported key derivation function",
                );
            }
            expect(threw).to.be.true;
        });

        it("throws parsing error for PBKDF2 with no PRF and no keyLength (existing parser bug)", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" }, // PBKDF2 OID
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    }, // salt
                                                    { int: 1000 }, // iterations
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                        ],
                                    }, // Enc scheme
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("error parsing PBKDF2Params");
            }
            expect(threw).to.be.true;
        });

        it("throws for unsupported PRF - wrong OID", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    {
                                                        seq: [
                                                            {
                                                                ident: "1.2.840.113549.2.7",
                                                            },
                                                        ],
                                                    }, // wrong PRF OID
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("unsupported PRF");
            }
            expect(threw).to.be.true;
        });

        it("throws for unsupported encryption scheme (not AES-128-CBC)", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    {
                                                        seq: [
                                                            {
                                                                ident: "1.2.840.113549.2.9",
                                                            },
                                                        ],
                                                    }, // HMAC-SHA-256
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            {
                                                ident: "2.16.840.1.101.3.4.1.42",
                                            },
                                        ],
                                    }, // not AES-128-CBC
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("unsupported encryption scheme");
            }
            expect(threw).to.be.true;
        });

        it("throws when IV is missing (no parameters on encScheme)", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    {
                                                        seq: [
                                                            {
                                                                ident: "1.2.840.113549.2.9",
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                        ],
                                    }, // missing params for IV
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include(
                    "expected IV as bytes for AES-128-CBC",
                );
            }
            expect(threw).to.be.true;
        });

        it("throws when IV is not bytes", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    {
                                                        seq: [
                                                            {
                                                                ident: "1.2.840.113549.2.9",
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                            { int: 42 },
                                        ],
                                    }, // not bytes
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include(
                    "expected IV as bytes for AES-128-CBC",
                );
            }
            expect(threw).to.be.true;
        });

        // PBKDF2Params edge cases
        it("handles PBKDF2 params with keyLength but no prf - triggers HMAC-SHA-1 error", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    { int: 32 }, // keyLength, but no PRF
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                            { bytes: new Uint8Array(16) },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("unsupported PRF HMAC-SHA-1");
            }
            expect(threw).to.be.true;
        });

        it("handles PBKDF2 params with keyLength + prf (4 elements)", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    { int: 32 }, // keyLength
                                                    {
                                                        seq: [
                                                            {
                                                                ident: "1.2.840.113549.2.9",
                                                            },
                                                        ],
                                                    }, // PRF
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            {
                                                ident: "2.16.840.1.101.3.4.1.42",
                                            },
                                        ],
                                    }, // Using wrong enc scheme to fail here, showing it passed PBKDF2 parsing
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("unsupported encryption scheme");
            }
            expect(threw).to.be.true;
        });

        it("handles PBKDF2 params with 3rd element not seq and not int (covers edge case)", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    {
                                                        bytes: new Uint8Array([
                                                            1,
                                                        ]),
                                                    },
                                                    { int: 1000 },
                                                    { ident: "1.2.3" }, // not seq, not int
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                            { bytes: new Uint8Array(16) },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("unsupported PRF HMAC-SHA-1"); // falls back to default PRF
            }
            expect(threw).to.be.true;
        });

        it("PBES2Params throws for invalid structure", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    { ident: "not-a-seq" }, // invalid PBES2 structure
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("error parsing PBES2Params");
            }
            expect(threw).to.be.true;
        });

        it("PBKDF2Params throws for invalid structure", async function () {
            const asn = {
                seq: [
                    {
                        seq: [
                            { ident: "1.2.840.113549.1.5.13" },
                            {
                                seq: [
                                    {
                                        seq: [
                                            { ident: "1.2.840.113549.1.5.12" },
                                            {
                                                seq: [
                                                    { int: 42 }, // First element must be bytes (salt)
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        seq: [
                                            { ident: "2.16.840.1.101.3.4.1.2" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    { bytes: new Uint8Array([]) },
                ],
            };
            const info = new EncryptedPrivateKeyInfo(asn);
            let threw = false;
            try {
                await info.decrypt("pass");
            } catch (err) {
                threw = true;
                expect(err.message).to.include("error parsing PBKDF2Params");
            }
            expect(threw).to.be.true;
        });
    });
});
