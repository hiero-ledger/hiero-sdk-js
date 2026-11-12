import { ContractId, DelegateContractId, Key } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
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
    describe("EVM address", function () {
        const evmAddress = "742d35cc6634c0532925a3b844bc454e4438f44e";

        it("fromBytes() should keep the EVM address", function () {
            const id = DelegateContractId.fromString(`0.0.${evmAddress}`);

            const roundTripped = DelegateContractId.fromBytes(id.toBytes());

            expect(roundTripped).to.be.instanceOf(DelegateContractId);
            expect(roundTripped.toString()).to.equal(`0.0.${evmAddress}`);
            expect(roundTripped.toEvmAddress()).to.equal(evmAddress);
        });

        it("fromString() should keep the EVM address", function () {
            const id = DelegateContractId.fromString(`1.2.${evmAddress}`);

            expect(id.toString()).to.equal(`1.2.${evmAddress}`);
            expect(id.evmAddress).to.deep.equal(hex.decode(evmAddress));
        });

        it("should keep the EVM address through a key round trip", function () {
            const id = DelegateContractId.fromString(`0.0.${evmAddress}`);

            const keyToId = Key._fromProtobufKey(id._toProtobufKey());

            expect(keyToId).to.be.instanceOf(DelegateContractId);
            expect(keyToId.toString()).to.equal(`0.0.${evmAddress}`);
        });

        it("clone() should keep the EVM address", function () {
            const id = DelegateContractId.fromString(`0.0.${evmAddress}`);

            const clone = id.clone();

            expect(clone).to.be.instanceOf(DelegateContractId);
            expect(clone.toString()).to.equal(`0.0.${evmAddress}`);
        });

        it("should leave evmAddress null for a numeric id", function () {
            const id = new DelegateContractId(1, 2, 3);

            const roundTripped = DelegateContractId.fromBytes(id.toBytes());

            expect(roundTripped.toString()).to.equal("1.2.3");
            expect(roundTripped.evmAddress).to.be.null;
            expect(id.clone().evmAddress).to.be.null;
        });
    });
});
