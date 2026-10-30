import { ContractId, DelegateContractId, Key } from "../../src/index.js";
import Long from "long";
import * as hex from "../../src/encoding/hex.js";

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

    it.each(["contract", "key"])(
        "keeps a copied EVM address when decoding a delegate %s",
        function (path) {
            const address = "0011223344556677889900112233445577889900";
            const input = new Uint8Array(hex.decode(address));
            const protobuf = {
                shardNum: Long.fromNumber(1),
                realmNum: Long.fromNumber(2),
                evmAddress: input,
            };
            const decoded =
                path === "contract"
                    ? DelegateContractId._fromProtobuf(protobuf)
                    : Key._fromProtobufKey({ delegatableContractId: protobuf });

            expect(decoded).toBeInstanceOf(DelegateContractId);
            expect(decoded.toString()).toBe(`1.2.${address}`);
            expect(decoded.toEvmAddress()).toBe(address);
            input.fill(0);
            expect(hex.encode(decoded.evmAddress)).toBe(address);
            expect(
                hex.encode(
                    decoded._toProtobufKey().delegatableContractId.evmAddress,
                ),
            ).toBe(address);
        },
    );
});
