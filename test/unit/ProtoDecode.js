import * as HieroProto from "@hiero-ledger/proto";

describe("Proto decoding", function () {
    it("decodes messages with reader.tag() correctly", function () {
        // 0a021005: field 1 (contractID) -> length 2 -> field 2 (realmNum) -> varint 5
        const decoded = HieroProto.proto.Key.decode(
            new Uint8Array([0x0a, 0x02, 0x10, 0x05]),
        );
        expect(decoded.contractID).to.exist;
        expect(decoded.contractID.realmNum.toNumber()).to.be.equal(5);
    });

    it("throws on illegal tag (field number 0)", function () {
        expect(() => {
            HieroProto.proto.Key.decode(new Uint8Array([0x00]));
        }).to.throw(/illegal tag/);
    });
});
