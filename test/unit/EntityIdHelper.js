import BigNumber from "bignumber.js";
import Long from "long";
import * as EntityIdHelper from "../../src/EntityIdHelper.js";

describe("EntityIdHelper", function () {
    it("should return hex encoded solidity address using toSolidityAddress", function () {
        let address = EntityIdHelper.toSolidityAddress([
            new Long(1),
            new Long(1),
            new Long(1),
        ]);
        const addressExpected = "0000000100000000000000010000000000000001";
        expect(address).to.eql(addressExpected);

        address = EntityIdHelper.toSolidityAddress([1, 1, 1]);
        expect(address).to.eql(addressExpected);

        address = EntityIdHelper.toSolidityAddress([
            new BigNumber(1),
            new BigNumber(1),
            new BigNumber(1),
        ]);
        expect(address).to.eql(addressExpected);

        address = EntityIdHelper.toSolidityAddress(["1", "1", "1"]);
        expect(address).to.eql(addressExpected);
    });

    it("should prove to|fromSolidityAddress are reversible", function () {
        const arrayLong = [new Long(11), new Long(12), new Long(13)];

        const address = EntityIdHelper.fromSolidityAddress(
            EntityIdHelper.toSolidityAddress(arrayLong),
        );

        expect(address).to.eql(arrayLong);
    });

    it("should deserialise ed25519 alias to public key", function () {
        const alias = "CIQBOMQE74WV37E4XU7GJAJJUP727KUVABF7KY2QF5IC5JIEPZUFK3I";
        const publicKey =
            "173204ff2d5dfc9cbd3e648129a3ffafaa95004bf563502f502ea5047e68556d";
        const result = EntityIdHelper.aliasToPublicKey(alias);
        expect(result.toStringRaw()).to.eql(publicKey);
    });

    it("should deserialise ecdsa alias to public key", function () {
        const alias =
            "HIQQHWKEWBU4IMVRHQKA7ZWXRB5MTVOE3VVIZH75H7ASQSIKXUEDCEGU";
        const publicKey =
            "03d944b069c432b13c140fe6d7887ac9d5c4dd6a8c9ffd3fc128490abd083110d4";
        const result = EntityIdHelper.aliasToPublicKey(alias);
        expect(result.toStringRaw()).to.eql(publicKey);
    });

    it("should error on hollow account alias to public key", function () {
        const alias = "ADYQKZW5EGPUZ63YPBMLTEE2I2ATDXAL";
        let errorThrown = false;
        try {
            EntityIdHelper.aliasToPublicKey(alias);
        } catch (_) {
            errorThrown = true;
        }

        expect(errorThrown).to.be.true;
    });

    it("should deserialise alias to evm address", function () {
        const alias = "ADYQKZW5EGPUZ63YPBMLTEE2I2ATDXAL";
        const evmAddress = "0x00f10566dd219f4cfb787858b9909a468131dc0b";
        const result = EntityIdHelper.aliasToEvmAddress(alias);
        expect(result).to.eql(evmAddress);
    });

    it("should serialize ed25519 public key to alias", function () {
        const alias = "CIQBOMQE74WV37E4XU7GJAJJUP727KUVABF7KY2QF5IC5JIEPZUFK3I";
        const publicKey =
            "173204ff2d5dfc9cbd3e648129a3ffafaa95004bf563502f502ea5047e68556d";
        const result = EntityIdHelper.publicKeyToAlias(publicKey);
        expect(result).to.eql(alias);
    });

    it("should serialize ecdsa public key to alias", function () {
        const alias =
            "HIQQHWKEWBU4IMVRHQKA7ZWXRB5MTVOE3VVIZH75H7ASQSIKXUEDCEGU";
        const publicKey =
            "03d944b069c432b13c140fe6d7887ac9d5c4dd6a8c9ffd3fc128490abd083110d4";
        const result = EntityIdHelper.publicKeyToAlias(publicKey);
        expect(result).to.eql(alias);
    });

    it("should serialize hollow account evmAddress key to alias", function () {
        const alias = "ADYQKZW5EGPUZ63YPBMLTEE2I2ATDXAL";
        const evmAddress = "0x00f10566dd219f4cfb787858b9909a468131dc0b";
        const result = EntityIdHelper.publicKeyToAlias(evmAddress);
        expect(result).to.eql(alias);
    });
});
