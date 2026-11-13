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

        it("clone() should copy the EVM address independently", function () {
            const id = DelegateContractId.fromString(`1.2.${evmAddress}`);
            const originalBytes = new Uint8Array(id.evmAddress);

            const clone = id.clone();

            expect(clone).to.be.instanceOf(DelegateContractId);
            expect(clone.toString()).to.equal(`1.2.${evmAddress}`);
            expect(clone.shard).to.deep.equal(id.shard);
            expect(clone.realm).to.deep.equal(id.realm);
            expect(clone.num).to.deep.equal(id.num);
            expect(clone.evmAddress).to.deep.equal(originalBytes);

            clone.evmAddress.fill(0);
            expect(id.evmAddress).to.deep.equal(originalBytes);
            expect(clone.evmAddress).to.not.equal(id.evmAddress);
            id.evmAddress.fill(255);
            expect(clone.evmAddress).to.deep.equal(new Uint8Array(20));
        });

        it("_fromContractId() should copy the EVM address independently", function () {
            const id = ContractId.fromString(`1.2.${evmAddress}`);
            const originalBytes = new Uint8Array(id.evmAddress);

            const delegateId = DelegateContractId._fromContractId(id);

            expect(delegateId).to.be.instanceOf(DelegateContractId);
            expect(delegateId.toString()).to.equal(`1.2.${evmAddress}`);
            expect(delegateId.shard).to.deep.equal(id.shard);
            expect(delegateId.realm).to.deep.equal(id.realm);
            expect(delegateId.num).to.deep.equal(id.num);
            expect(delegateId.evmAddress).to.deep.equal(originalBytes);

            delegateId.evmAddress.fill(0);
            expect(id.evmAddress).to.deep.equal(originalBytes);
            expect(delegateId.evmAddress).to.not.equal(id.evmAddress);
        });

        it("should leave evmAddress null for a numeric id", function () {
            const id = new DelegateContractId(1, 2, 3);

            const roundTripped = DelegateContractId.fromBytes(id.toBytes());

            expect(roundTripped.toString()).to.equal("1.2.3");
            expect(roundTripped.evmAddress).to.be.null;
            expect(id.clone().evmAddress).to.be.null;
        });

        it("clone() should preserve a numeric id's checksum", function () {
            const id = new DelegateContractId(1, 2, 3);
            id._checksum = "vfmkw";

            const clone = id.clone();

            expect(clone).to.be.instanceOf(DelegateContractId);
            expect(clone.toString()).to.equal("1.2.3");
            expect(clone._checksum).to.equal("vfmkw");
            expect(clone.evmAddress).to.be.null;
        });
    });
});
