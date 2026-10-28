import EcdsaPublicKey from "../../src/EcdsaPublicKey.js";
import PrivateKey from "../../src/PrivateKey.js";
import * as hex from "../../src/encoding/hex.js";
import vectors from "../../../../test/unit/utils/ClprOwnershipVectors.js";

describe("EcdsaPublicKey.toBytesRawUncompressed", function () {
    const vector = vectors.vectors.find(
        (value) => value.signatureScheme === "ECDSA_SECP256K1",
    );

    /** @returns {EcdsaPublicKey} */
    function publicKey() {
        const key = PrivateKey.fromStringECDSA(vector.privateKeyOrSeed);
        return EcdsaPublicKey.fromBytes(key.publicKey.toBytesRaw());
    }

    it("returns the HIP-1535 64-byte x || y without a SEC1 prefix", function () {
        const key = publicKey();
        expect(key.toBytesRawUncompressed).toBeTypeOf("function");

        const bytes = key.toBytesRawUncompressed();
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes).toHaveLength(64);
        expect(hex.encode(bytes)).toBe(vector.publicKey);
        expect(key.toBytesRaw()).toHaveLength(33);
    });

    it("returns independent bytes without changing the key or EVM address", function () {
        const key = publicKey();
        expect(key.toBytesRawUncompressed).toBeTypeOf("function");
        const address = key.toEthereumAddress();

        key.toBytesRawUncompressed().fill(0);

        expect(hex.encode(key.toBytesRawUncompressed())).toBe(vector.publicKey);
        expect(key.toEthereumAddress()).toBe(address);
    });
});
