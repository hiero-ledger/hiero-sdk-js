import PrivateKey from "../../src/PrivateKey.js";
import PublicKey from "../../src/PublicKey.js";
import * as hex from "../../src/encoding/hex.js";

const RAW_KEY =
    "033a514176466fa815ed481ffad09110a2d344f6c9b78c1d14afc351c3a51be33d";
const RAW_KEY_BYTES = hex.decode(RAW_KEY);

const TRUFFLE_KEY =
    "03af80b90d25145da28c583359beb47b21796b2fe1a23c1511e443e7a64dfdb27d";
const TRUFFLE_KEY_BYTES = hex.decode(TRUFFLE_KEY);
const TRUFFLE_ADDRESS = "627306090abab3a6e1400e9345bc60c78a8bef57";

const ECDSA_PRIVATE_RAW =
    "4c6c731ed7123a213eaf37dd72f19220b7005d243cfd52d080708ec5fe032b36";
const ECDSA_PRIVATE_DER =
    "3030020100300706052b8104000a042204204c6c731ed7123a213eaf37dd72f19220b7005d243cfd52d080708ec5fe032b36";
const ED25519_PRIVATE_RAW =
    "ee417dd399722ef8920b2c8ec047cf0c51d6c7d3413e9a660ca28205a5f249cd";
const ED25519_PRIVATE_DER =
    "302e020100300506032b657004220420ee417dd399722ef8920b2c8ec047cf0c51d6c7d3413e9a660ca28205a5f249cd";

const ECDSA_PUBLIC_RAW =
    "038592559824a68150512e5c23736885208382859ac5aad7a73adc48226fe122b5";
const ECDSA_PUBLIC_DER =
    "302d300706052b8104000a032200038592559824a68150512e5c23736885208382859ac5aad7a73adc48226fe122b5";
const ED25519_PUBLIC_RAW =
    "6efd7f7de3ce5caadc830818a8a0bbab7da2c2cdfa6778e9b351c8f519801ae2";
const ED25519_PUBLIC_DER =
    "302a300506032b65700321006efd7f7de3ce5caadc830818a8a0bbab7da2c2cdfa6778e9b351c8f519801ae2";

describe("PublicKey", function () {
    it("ECDSA serializes to same string as Java", function () {
        const key = PublicKey.fromBytesECDSA(RAW_KEY_BYTES);

        expect(key.toString()).to.be.equal(
            "302d300706052b8104000a032200033a514176466fa815ed481ffad09110a2d344f6c9b78c1d14afc351c3a51be33d",
        );
    });

    it("ECDSA public key to ethereum address", function () {
        const key = PublicKey.fromBytesECDSA(TRUFFLE_KEY_BYTES);

        expect(key.toEthereumAddress()).to.be.equal(TRUFFLE_ADDRESS);
    });

    it("equals", async function () {
        const ed25519 = PrivateKey.generate().publicKey;
        const ed25519Copy = PublicKey.fromString(ed25519.toStringRaw());
        const ecdsa = PrivateKey.generateECDSA().publicKey;

        expect(ed25519.toStringRaw()).to.be.equal(ed25519Copy.toStringRaw());

        expect(ed25519.equals(ed25519Copy)).to.be.true;
        expect(ed25519.equals(ecdsa)).to.be.false;
    });

    it("ECDSA consistent toString", function () {
        const key = PrivateKey.fromString(ECDSA_PRIVATE_DER);
        const publicKey = PublicKey.fromString(key.publicKey.toString());

        expect(key.toString()).to.be.equal(ECDSA_PRIVATE_DER);
        expect(key.toStringDer()).to.be.equal(ECDSA_PRIVATE_DER);
        expect(key.toStringRaw()).to.be.equal(ECDSA_PRIVATE_RAW);

        expect(publicKey.toString()).to.be.equal(ECDSA_PUBLIC_DER);
        expect(publicKey.toStringDer()).to.be.equal(ECDSA_PUBLIC_DER);
        expect(publicKey.toStringRaw()).to.be.equal(ECDSA_PUBLIC_RAW);
    });

    it("ED25519 consistent toString", function () {
        const key = PrivateKey.fromString(ED25519_PRIVATE_DER);
        const publicKey = PublicKey.fromString(key.publicKey.toString());

        expect(key.toString()).to.be.equal(ED25519_PRIVATE_DER);
        expect(key.toStringDer()).to.be.equal(ED25519_PRIVATE_DER);
        expect(key.toStringRaw()).to.be.equal(ED25519_PRIVATE_RAW);

        expect(publicKey.toString()).to.be.equal(ED25519_PUBLIC_DER);
        expect(publicKey.toStringDer()).to.be.equal(ED25519_PUBLIC_DER);
        expect(publicKey.toStringRaw()).to.be.equal(ED25519_PUBLIC_RAW);
    });

    it("ECDSA verify message", function () {
        const key = PrivateKey.fromStringECDSA(ECDSA_PRIVATE_DER);
        const publicKey = PublicKey.fromString(key.publicKey.toString());
        const message = new TextEncoder().encode("hello world");
        const signature = key.sign(message);

        expect(publicKey.verify(message, signature)).to.be.true;
    });

    it("ED25519 verify message", function () {
        const key = PrivateKey.fromStringED25519(ED25519_PRIVATE_DER);
        const publicKey = PublicKey.fromString(key.publicKey.toString());
        const message = new TextEncoder().encode("hello world");
        const signature = key.sign(message);

        expect(publicKey.verify(message, signature)).to.be.true;
    });
});
