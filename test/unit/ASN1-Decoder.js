import { ASN1Decoder } from "../../src/util/ASN1-Decoder.js";
import { PrivateKey } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";

describe("ASN1Decoder", function () {
    describe("read() supported types", function () {
        it("should read INTEGER (0x02)", function () {
            // Single-byte integer: 42 (0x2a)
            const decoder1 = new ASN1Decoder(Uint8Array.of(0x02, 0x01, 0x2a));
            expect(decoder1.read()).to.deep.equal({ integer: 42 });
            expect(decoder1.isFullyRead()).to.be.true;

            // Zero integer
            const decoderZero = new ASN1Decoder(
                Uint8Array.of(0x02, 0x01, 0x00),
            );
            expect(decoderZero.read()).to.deep.equal({ integer: 0 });
            expect(decoderZero.isFullyRead()).to.be.true;

            // Multi-byte integer: 256 (0x0100)
            const decoder2 = new ASN1Decoder(
                Uint8Array.of(0x02, 0x02, 0x01, 0x00),
            );
            expect(decoder2.read()).to.deep.equal({ integer: 256 });
            expect(decoder2.isFullyRead()).to.be.true;
        });

        it("should read BIT STRING (0x03)", function () {
            // First byte is unusedBits (0), followed by bytes
            const data = Uint8Array.of(0x03, 0x04, 0x00, 0x01, 0x02, 0x03);
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal({
                unusedBits: 0,
                pubkey: Uint8Array.of(0x01, 0x02, 0x03),
            });
            expect(decoder.isFullyRead()).to.be.true;

            // Non-zero unusedBits
            const dataWithUnused = Uint8Array.of(0x03, 0x02, 0x04, 0xf0);
            const decoderUnused = new ASN1Decoder(dataWithUnused);
            expect(decoderUnused.read()).to.deep.equal({
                unusedBits: 4,
                pubkey: Uint8Array.of(0xf0),
            });
            expect(decoderUnused.isFullyRead()).to.be.true;
        });

        it("should read OCTET STRING (0x04)", function () {
            const data = Uint8Array.of(0x04, 0x04, 0xde, 0xad, 0xbe, 0xef);
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal({
                pkey: Uint8Array.of(0xde, 0xad, 0xbe, 0xef),
            });
            expect(decoder.isFullyRead()).to.be.true;
        });

        it("should read OBJECT IDENTIFIER (0x06)", function () {
            // ED25519 OID: 1.3.101.112
            const data = Uint8Array.of(0x06, 0x03, 0x2b, 0x65, 0x70);
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal({ oid: "1.3.101.112" });
            expect(decoder.isFullyRead()).to.be.true;
            expect(decoder.getOids()).to.deep.equal(["1.3.101.112"]);
        });

        it("should read SEQUENCE (0x30)", function () {
            // SEQUENCE holding two INTEGERs: 1 and 2
            const data = Uint8Array.of(
                0x30,
                0x06,
                0x02,
                0x01,
                0x01,
                0x02,
                0x01,
                0x02,
            );
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal([
                { integer: 1 },
                { integer: 2 },
            ]);
            expect(decoder.isFullyRead()).to.be.true;

            // Nested SEQUENCE
            const nestedData = Uint8Array.of(
                0x30,
                0x05,
                0x30,
                0x03,
                0x02,
                0x01,
                0x07,
            );
            const nestedDecoder = new ASN1Decoder(nestedData);
            expect(nestedDecoder.read()).to.deep.equal([[{ integer: 7 }]]);
            expect(nestedDecoder.isFullyRead()).to.be.true;
        });

        it("should read context tag 0xa0 as a sequence", function () {
            // Context tag 0xa0 holding an INTEGER 5
            const data = Uint8Array.of(0xa0, 0x03, 0x02, 0x01, 0x05);
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal([{ integer: 5 }]);
            expect(decoder.isFullyRead()).to.be.true;
        });

        it("should read context tag 0xa1 as a sequence", function () {
            // Context tag 0xa1 holding an INTEGER 9
            const data = Uint8Array.of(0xa1, 0x03, 0x02, 0x01, 0x09);
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal([{ integer: 9 }]);
            expect(decoder.isFullyRead()).to.be.true;
        });

        it("should throw for unsupported type bytes", function () {
            // NULL type (0x05)
            expect(() =>
                new ASN1Decoder(Uint8Array.of(0x05, 0x00)).read(),
            ).to.throw("Unsupported type: 5");

            // PrintableString type (0x13)
            expect(() =>
                new ASN1Decoder(Uint8Array.of(0x13, 0x00)).read(),
            ).to.throw("Unsupported type: 19");

            // Unknown byte (0xff)
            expect(() =>
                new ASN1Decoder(Uint8Array.of(0xff, 0x00)).read(),
            ).to.throw("Unsupported type: 255");
        });
    });

    describe("readLength() short and long form", function () {
        it("should read short-form lengths (< 128)", function () {
            // Short form length 0
            const emptyOctet = new ASN1Decoder(Uint8Array.of(0x04, 0x00));
            expect(emptyOctet.read()).to.deep.equal({
                pkey: new Uint8Array(0),
            });
            expect(emptyOctet.isFullyRead()).to.be.true;

            // Short form length 5
            const octet5 = new ASN1Decoder(
                Uint8Array.of(0x04, 0x05, 1, 2, 3, 4, 5),
            );
            expect(octet5.read()).to.deep.equal({
                pkey: Uint8Array.of(1, 2, 3, 4, 5),
            });
            expect(octet5.isFullyRead()).to.be.true;
        });

        it("should read long-form lengths with 1 length byte (>= 128)", function () {
            // 0x81 indicates 1 length byte follows: 0x80 = 128 bytes
            const bytes = new Uint8Array(1 + 2 + 128);
            bytes[0] = 0x04; // OCTET STRING
            bytes[1] = 0x81; // long form, 1 byte
            bytes[2] = 0x80; // length 128
            bytes.fill(0xab, 3);

            const decoder = new ASN1Decoder(bytes);
            const result = decoder.read();
            expect(result.pkey).to.have.lengthOf(128);
            expect(result.pkey[0]).to.equal(0xab);
            expect(result.pkey[127]).to.equal(0xab);
            expect(decoder.isFullyRead()).to.be.true;
        });

        it("should read long-form lengths with 2 length bytes", function () {
            // 0x82 indicates 2 length bytes follow: 0x01, 0x00 = 256 bytes
            const bytes = new Uint8Array(1 + 3 + 256);
            bytes[0] = 0x04; // OCTET STRING
            bytes[1] = 0x82; // long form, 2 bytes
            bytes[2] = 0x01;
            bytes[3] = 0x00; // length 256
            bytes.fill(0xcd, 4);

            const decoder = new ASN1Decoder(bytes);
            const result = decoder.read();
            expect(result.pkey).to.have.lengthOf(256);
            expect(result.pkey[0]).to.equal(0xcd);
            expect(result.pkey[255]).to.equal(0xcd);
            expect(decoder.isFullyRead()).to.be.true;
        });
    });

    describe("readObjectIdentifier(), getOids(), and getOidKeyTypes()", function () {
        it("should read single-byte component OIDs", function () {
            // ED25519: 1.3.101.112 -> 0x2b, 0x65, 0x70
            const data = Uint8Array.of(0x06, 0x03, 0x2b, 0x65, 0x70);
            const decoder = new ASN1Decoder(data);
            expect(decoder.read()).to.deep.equal({ oid: "1.3.101.112" });
            expect(decoder.getOids()).to.deep.equal(["1.3.101.112"]);
            expect(decoder.getOidKeyTypes()).to.deep.equal(["ed25519"]);
        });

        it("should read multi-byte component OIDs", function () {
            // ECDSA secp256k1: 1.3.132.0.10
            // 132 in base-128 is 0x81, 0x04 (takes two bytes)
            const ecdsaData = Uint8Array.of(
                0x06,
                0x05,
                0x2b,
                0x81,
                0x04,
                0x00,
                0x0a,
            );
            const ecdsaDecoder = new ASN1Decoder(ecdsaData);
            expect(ecdsaDecoder.read()).to.deep.equal({ oid: "1.3.132.0.10" });
            expect(ecdsaDecoder.getOids()).to.deep.equal(["1.3.132.0.10"]);
            expect(ecdsaDecoder.getOidKeyTypes()).to.deep.equal(["ecdsa"]);

            // pubkey: 1.2.840.10045.2.1
            // 840 is 0x86, 0x48; 10045 is 0xce, 0x3d
            const pubkeyData = Uint8Array.of(
                0x06,
                0x07,
                0x2a,
                0x86,
                0x48,
                0xce,
                0x3d,
                0x02,
                0x01,
            );
            const pubkeyDecoder = new ASN1Decoder(pubkeyData);
            expect(pubkeyDecoder.read()).to.deep.equal({
                oid: "1.2.840.10045.2.1",
            });
            expect(pubkeyDecoder.getOids()).to.deep.equal([
                "1.2.840.10045.2.1",
            ]);
            expect(pubkeyDecoder.getOidKeyTypes()).to.deep.equal(["pubkey"]);
        });

        it("should map unknown OIDs to 'unknown'", function () {
            // Unknown OID: 2.5.4.3 (commonName) -> 2*40+5=85 (0x55), 0x04, 0x03
            const unknownData = Uint8Array.of(0x06, 0x03, 0x55, 0x04, 0x03);
            const decoder = new ASN1Decoder(unknownData);
            expect(decoder.read()).to.deep.equal({ oid: "2.5.4.3" });
            expect(decoder.getOids()).to.deep.equal(["2.5.4.3"]);
            expect(decoder.getOidKeyTypes()).to.deep.equal(["unknown"]);
        });

        it("should accumulate multiple OIDs in getOids() and map each type", function () {
            const data = Uint8Array.of(
                0x30,
                0x16,
                0x06,
                0x03,
                0x2b,
                0x65,
                0x70, // 1.3.101.112 (ed25519)
                0x06,
                0x05,
                0x2b,
                0x81,
                0x04,
                0x00,
                0x0a, // 1.3.132.0.10 (ecdsa)
                0x06,
                0x03,
                0x55,
                0x04,
                0x03, // 2.5.4.3 (unknown)
                0x06,
                0x07,
                0x2a,
                0x86,
                0x48,
                0xce,
                0x3d,
                0x02,
                0x01, // 1.2.840.10045.2.1 (pubkey)
            );
            const decoder = new ASN1Decoder(data);
            decoder.read();
            expect(decoder.isFullyRead()).to.be.true;
            expect(decoder.getOids()).to.deep.equal([
                "1.3.101.112",
                "1.3.132.0.10",
                "2.5.4.3",
                "1.2.840.10045.2.1",
            ]);
            expect(decoder.getOidKeyTypes()).to.deep.equal([
                "ed25519",
                "ecdsa",
                "unknown",
                "pubkey",
            ]);
        });
    });

    describe("isPublicKeyType() and isFullyRead()", function () {
        it("isPublicKeyType() should return false", function () {
            const decoder = new ASN1Decoder(Uint8Array.of());
            expect(decoder.isPublicKeyType()).to.be.false;
        });

        it("isFullyRead() should be true only after every byte is read", function () {
            const data = Uint8Array.of(0x02, 0x01, 0x2a);
            const decoder = new ASN1Decoder(data);
            expect(decoder.isFullyRead()).to.be.false;

            decoder.read();
            expect(decoder.isFullyRead()).to.be.true;
        });

        it("isFullyRead() should return false when there are unread trailing bytes", function () {
            const dataWithTrailing = Uint8Array.of(0x02, 0x01, 0x2a, 0x00);
            const decoder = new ASN1Decoder(dataWithTrailing);
            decoder.read();
            expect(decoder.isFullyRead()).to.be.false;
        });

        it("isFullyRead() should return true for empty input", function () {
            const emptyDecoder = new ASN1Decoder(new Uint8Array(0));
            expect(emptyDecoder.isFullyRead()).to.be.true;
        });
    });

    describe("constructor input handling", function () {
        it("should accept ArrayBuffer input", function () {
            const uint8Array = Uint8Array.of(0x02, 0x01, 0x10);
            const decoder = new ASN1Decoder(uint8Array.buffer);
            expect(decoder.read()).to.deep.equal({ integer: 16 });
            expect(decoder.isFullyRead()).to.be.true;
        });
    });

    describe("real DER key decoding", function () {
        it("should decode real ED25519 DER private key bytes", function () {
            const key = PrivateKey.generateED25519();
            const derBytes = hex.decode(key.toStringDer());
            const decoder = new ASN1Decoder(derBytes);
            const result = decoder.read();

            expect(result).to.be.an("array");
            expect(decoder.isFullyRead()).to.be.true;
            expect(decoder.getOids()).to.include("1.3.101.112");
            expect(decoder.getOidKeyTypes()).to.deep.equal(["ed25519"]);
        });

        it("should decode real ECDSA DER private key bytes", function () {
            const key = PrivateKey.generateECDSA();
            const derBytes = hex.decode(key.toStringDer());
            const decoder = new ASN1Decoder(derBytes);
            const result = decoder.read();

            expect(result).to.be.an("array");
            expect(decoder.isFullyRead()).to.be.true;
            expect(decoder.getOids()).to.include("1.3.132.0.10");
            expect(decoder.getOidKeyTypes()).to.include("ecdsa");
        });
    });
});
