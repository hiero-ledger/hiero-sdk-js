import { ContractId, DelegateContractId, Key } from "../../src/index.js";
import Long from "long";

describe("DelegateContractId", function () {
    it("constructors", function () {
        expect(() => new DelegateContractId(3)).to.not.throw();
        expect(() => new DelegateContractId(0, 0, 3)).to.not.throw();
        expect(
            () => new DelegateContractId({ shard: 0, realm: 0, num: 3 }),
        ).to.not.throw();
    });

    it(".[to|from]Protobuf()", function () {
        const id = new DelegateContractId(1, 2, 3);
        const idProto = {
            shardNum: Long.fromNumber(1),
            realmNum: Long.fromNumber(2),
            contractNum: Long.fromNumber(3),
            evmAddress: null,
        };
        const idProtoKey = {
            delegatableContractId: idProto,
        };
        const keyToId = Key._fromProtobufKey(idProtoKey);

        expect(id.toString()).to.be.equal("1.2.3");

        expect(id._toProtobuf()).to.deep.equal(idProto);
        expect(id._toProtobufKey()).to.deep.equal(idProtoKey);
        expect(
            DelegateContractId._fromProtobuf(idProto).toString(),
        ).to.deep.equal("1.2.3");
        expect(keyToId.toString()).to.deep.equal("1.2.3");
        expect(keyToId instanceof DelegateContractId).to.be.true;
        expect(keyToId instanceof ContractId).to.be.true;
    });

    it("should keep the checksum when parsed with fromString (#4757)", function () {
        const id = DelegateContractId.fromString("0.0.123-vfmkw");
        expect(id.checksum).to.equal("vfmkw");
        expect(id.toString()).to.equal("0.0.123");

        expect(DelegateContractId.fromString("0.0.123").checksum).to.be.null;

        const evm = "0011223344556677889900112233445577889900";
        expect(DelegateContractId.fromString(`0.0.${evm}-vfmkw`).checksum).to.be
            .null;
    });
});
