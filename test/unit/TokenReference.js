import TokenReference from "../../src/token/TokenReference.js";
import TokenId from "../../src/token/TokenId.js";
import NftId from "../../src/token/NftId.js";

describe("TokenReference", function () {
    it("initializes fungibleToken and nft to null", function () {
        const reference = new TokenReference();
        expect(reference.fungibleToken).to.be.null;
        expect(reference.nft).to.be.null;
    });

    it("maps fungibleToken from protobuf", function () {
        const tokenId = new TokenId(0, 0, 5);
        const reference = TokenReference._fromProtobuf({
            fungibleToken: tokenId._toProtobuf(),
        });
        expect(reference.fungibleToken).to.be.instanceOf(TokenId);
        expect(reference.fungibleToken.toString()).to.equal("0.0.5");
        expect(reference.nft).to.be.null;
    });

    it("maps nft from protobuf", function () {
        const nftId = new NftId(new TokenId(0, 0, 5), 7);
        const reference = TokenReference._fromProtobuf({
            nft: nftId._toProtobuf(),
        });
        expect(reference.nft).to.be.instanceOf(NftId);
        expect(reference.nft.toString()).to.equal("0.0.5/7");
        expect(reference.fungibleToken).to.be.null;
    });

    it("maps an empty protobuf reference to nulls", function () {
        const reference = TokenReference._fromProtobuf({});
        expect(reference.fungibleToken).to.be.null;
        expect(reference.nft).to.be.null;
    });
});
