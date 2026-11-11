import * as hex from "../../src/encoding/hex.js";
import Authorization from "../../src/Authorization.js";

const address = "00000000000000000000000000000000000003f9";
const r = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const s = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

describe("Authorization", function () {
    it("getChainIdBytes() returns the chain ID as minimal bytes", function () {
        const authorization = new Authorization(298, address, 7, 1, r, s);

        expect(authorization.getChainIdBytes()).to.deep.equal(
            hex.decode("012a"),
        );
    });

    it("getAddressBytes() returns the address bytes", function () {
        const authorization = new Authorization(
            298,
            `0x${address}`,
            7,
            1,
            r,
            s,
        );

        expect(authorization.getAddressBytes()).to.deep.equal(
            hex.decode(address),
        );
    });

    it("getNonceBytes() returns the nonce as minimal bytes", function () {
        const authorization = new Authorization(298, address, 7, 1, r, s);

        expect(authorization.getNonceBytes()).to.deep.equal(hex.decode("07"));
    });

    it("the byte getters return the bytes of a decoded tuple", function () {
        const authorization = Authorization.fromTuple([
            hex.decode("012a"),
            hex.decode(address),
            hex.decode("07"),
            hex.decode("01"),
            hex.decode(r),
            hex.decode(s),
        ]);

        expect(authorization.getChainIdBytes()).to.deep.equal(
            hex.decode("012a"),
        );
        expect(authorization.getAddressBytes()).to.deep.equal(
            hex.decode(address),
        );
        expect(authorization.getNonceBytes()).to.deep.equal(hex.decode("07"));
    });
});
