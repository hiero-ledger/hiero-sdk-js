import { ContractId, DelegateContractId, Key } from "../../src/index.js";
import * as hex from "../../src/encoding/hex.js";
import Long from "long";

describe("ContractId", function () {
    const evmAddress = "0011223344556677889900112233445577889900";

    it("fromString() with num", function () {
        expect(ContractId.fromString(`1.2.3`).toString()).to.be.equal(`1.2.3`);
    });

    it("fromString() with evmAddress", function () {
        expect(
            ContractId.fromString(`1.2.${evmAddress}`).toString(),
        ).to.be.equal(`1.2.${evmAddress}`);
    });

    it("toEvmAddress() to prioritize evmAddress", function () {
        const emvAddresContractId = ContractId.fromEvmAddress(1, 2, evmAddress);

        expect(emvAddresContractId.toString()).to.be.equal(`1.2.${evmAddress}`);
        expect(emvAddresContractId.toEvmAddress()).to.be.equal(evmAddress);
    });

    it("toString() to prioritize evmAddress", function () {
        const emvAddresContractId = ContractId.fromEvmAddress(1, 2, evmAddress);

        expect(emvAddresContractId.toString()).to.be.equal(`1.2.${evmAddress}`);
    });

    it("toProtobuf() with evmAddres", function () {
        const emvAddresContractId = ContractId.fromEvmAddress(1, 2, evmAddress);

        expect(emvAddresContractId._toProtobuf()).to.deep.equal({
            shardNum: Long.fromNumber(1),
            realmNum: Long.fromNumber(2),
            contractNum: Long.ZERO,
            evmAddress: hex.decode(evmAddress),
        });
    });

    it("toProtobuf() with evmAddress", function () {
        const contractId = new ContractId(1, 2, 3);

        expect(contractId._toProtobuf()).to.deep.equal({
            shardNum: Long.fromNumber(1),
            realmNum: Long.fromNumber(2),
            contractNum: Long.fromNumber(3),
            evmAddress: null,
        });
    });

    it("should return the contract id from long zero address", function () {
        const shard = 0,
            realm = 0,
            num = 5;
        const ADDRESS_LENGTH = 42;
        const contractId = new ContractId(shard, realm, num);
        const longZeroAddress = contractId
            .toEvmAddress()
            .padStart(ADDRESS_LENGTH, "0x");

        const contractIdFromAddress = ContractId.fromEvmAddress(
            shard,
            realm,
            longZeroAddress,
        );

        expect(contractId).to.deep.equal(contractIdFromAddress);
    });

    describe("fromEvmAddress()", function () {
        it("should correctly handle fromEvmAddress with non-zero shard/realm and long-zero address", function () {
            // Given a call to fromEvmAddress(1, 1, longZeroAddress)
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234 in hex

            // When the EVM address contains only the entity number
            const contractId = ContractId.fromEvmAddress(1, 1, longZeroAddress);

            // Then the resulting entity ID is correctly returned
            expect(contractId.toString()).to.equal("1.1.1234");
            expect(contractId.shard.toNumber()).to.equal(1);
            expect(contractId.realm.toNumber()).to.equal(1);
            expect(contractId.num.toNumber()).to.equal(1234);
        });

        it("should correctly handle fromEvmAddress(0, 0, non-long-zero evm address)", function () {
            // Given a call to fromEvmAddress(0, 0, evmAddress)
            const nonLongZeroAddress =
                "742d35cc6634c0532925a3b844bc454e4438f44e";

            // When the EVM address is non long zero evm address
            const contractId = ContractId.fromEvmAddress(
                0,
                0,
                nonLongZeroAddress,
            );

            // Then the resulting entity ID is correctly returned
            expect(contractId.toString()).to.equal(
                "0.0.742d35cc6634c0532925a3b844bc454e4438f44e",
            );
            expect(contractId.shard.toNumber()).to.equal(0);
            expect(contractId.realm.toNumber()).to.equal(0);
            expect(contractId.num.toNumber()).to.equal(0);
            expect(contractId.evmAddress).to.not.be.null;
        });

        it("should respect non-zero shard and realm values in fromEvmAddress", function () {
            // Given a call to fromEvmAddress(shard, realm, evmAddress) with non-zero values
            const evmAddress = "742d35cc6634c0532925a3b844bc454e4438f44e";

            // When non-zero shard and realm values are passed
            const contractId = ContractId.fromEvmAddress(5, 10, evmAddress);

            // Then the method must respect those values
            expect(contractId.toString()).to.equal(
                "5.10.742d35cc6634c0532925a3b844bc454e4438f44e",
            );
            expect(contractId.shard.toNumber()).to.equal(5);
            expect(contractId.realm.toNumber()).to.equal(10);
        });

        it("should handle fromEvmAddress with long-zero address and non-zero shard/realm", function () {
            // Test that fromEvmAddress correctly extracts the num from long-zero address
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234
            const contractId = ContractId.fromEvmAddress(3, 7, longZeroAddress);

            expect(contractId.shard.toNumber()).to.equal(3);
            expect(contractId.realm.toNumber()).to.equal(7);
            expect(contractId.num.toNumber()).to.equal(1234);
            expect(contractId.evmAddress).to.be.null; // Should be null for long-zero addresses
        });

        it("should handle fromEvmAddress with non-long-zero address and non-zero shard/realm", function () {
            // Test that fromEvmAddress correctly handles non-long-zero addresses
            const nonLongZeroAddress =
                "742d35cc6634c0532925a3b844bc454e4438f44e";
            const contractId = ContractId.fromEvmAddress(
                3,
                7,
                nonLongZeroAddress,
            );

            expect(contractId.shard.toNumber()).to.equal(3);
            expect(contractId.realm.toNumber()).to.equal(7);
            expect(contractId.num.toNumber()).to.equal(0); // Should be 0 for non-long-zero addresses
            expect(contractId.evmAddress).to.not.be.null; // Should have the EVM address
        });
    });

    describe("toEvmAddress()", function () {
        it("should encode only entity number for non-zero shard/realm when no EVM address", function () {
            // Given an entity ID with non-zero shard and realm
            const contractId = new ContractId(1, 2, 1234);

            // When toEvmAddress() is called
            const evmAddress = contractId.toEvmAddress();

            // Then the resulting EVM address encodes only the entity number
            // Should be a long-zero address with only the num in the last 8 bytes
            expect(evmAddress).to.equal(
                "00000000000000000000000000000000000004d2",
            );
        });

        it("should maintain backward compatibility for shard=0, realm=0", function () {
            // Given an entity ID with shard and realm both set to 0
            const contractId = new ContractId(0, 0, 1234);

            // When toEvmAddress() is called
            const evmAddress = contractId.toEvmAddress();

            // Then the resulting EVM address should be unchanged (backward compatibility)
            expect(evmAddress).to.equal(
                "00000000000000000000000000000000000004d2",
            );
        });

        it("should return EVM address for entity ID with non-zero shard/realm and EVM address", function () {
            // Given an entity ID with non-zero shard and realm with an evm address
            const evmAddress = "742d35cc6634c0532925a3b844bc454e4438f44e";
            const contractId = ContractId.fromEvmAddress(1, 2, evmAddress);

            // When toEvmAddress() is called
            const result = contractId.toEvmAddress();

            // Then the resulting EVM address is the evm address
            expect(result).to.equal(evmAddress);
        });
    });

    describe("fromString()", function () {
        it("should parse valid entity IDs", function () {
            expect(ContractId.fromString("0.0.123").toString()).to.equal(
                "0.0.123",
            );
            expect(ContractId.fromString("123").toString()).to.equal("0.0.123");
            expect(ContractId.fromString("1.2.3").toString()).to.equal("1.2.3");
            expect(ContractId.fromString("0.0.0123").toString()).to.equal(
                "0.0.123",
            );
            expect(ContractId.fromString("0.0.123-vfmkw").toString()).to.equal(
                "0.0.123",
            );
        });

        it("should throw when the entity number contains letters", function () {
            for (const text of ["0.0.12ab34", "0.0.ff", "0.0.5a", "0.0.1e3"]) {
                expect(() => ContractId.fromString(text)).to.throw(
                    `failed to parse entity id: ${text}`,
                );
            }
        });

        it("should throw for DelegateContractId when the entity number contains letters", function () {
            expect(() => DelegateContractId.fromString("0.0.12ab34")).to.throw(
                "failed to parse entity id: 0.0.12ab34",
            );
        });

        it("should still parse a 40 character EVM address", function () {
            const evm = "0011223344556677889900112233445577889900";
            expect(ContractId.fromString(`0.0.${evm}`).toString()).to.equal(
                `0.0.${evm}`,
            );
        });
    });
    describe("toBytes() / fromBytes()", function () {
        const nonLongZeroAddress = "742d35cc6634c0532925a3b844bc454e4438f44e";

        it("should keep a non-long-zero EVM address", function () {
            const contractId = ContractId.fromEvmAddress(
                0,
                0,
                nonLongZeroAddress,
            );

            const roundTripped = ContractId.fromBytes(contractId.toBytes());

            expect(roundTripped.toString()).to.equal(
                `0.0.${nonLongZeroAddress}`,
            );
            expect(roundTripped.toEvmAddress()).to.equal(nonLongZeroAddress);
            expect(roundTripped.num.toNumber()).to.equal(0);
            expect(roundTripped.equals(contractId)).to.be.true;
        });

        it("should keep a non-long-zero EVM address with non-zero shard/realm", function () {
            const contractId = ContractId.fromEvmAddress(
                5,
                10,
                nonLongZeroAddress,
            );

            const roundTripped = ContractId.fromBytes(contractId.toBytes());

            expect(roundTripped.toString()).to.equal(
                `5.10.${nonLongZeroAddress}`,
            );
            expect(roundTripped.shard.toNumber()).to.equal(5);
            expect(roundTripped.realm.toNumber()).to.equal(10);
            expect(roundTripped.equals(contractId)).to.be.true;
        });

        it("should keep the num of a long-zero EVM address", function () {
            const longZeroAddress = "00000000000000000000000000000000000004d2"; // 1234
            const contractId = ContractId.fromEvmAddress(1, 1, longZeroAddress);

            const roundTripped = ContractId.fromBytes(contractId.toBytes());

            expect(roundTripped.toString()).to.equal("1.1.1234");
            expect(roundTripped.num.toNumber()).to.equal(1234);
            expect(roundTripped.evmAddress).to.be.null;
            expect(roundTripped.toEvmAddress()).to.equal(longZeroAddress);
        });

        it("should leave evmAddress null for a numeric id", function () {
            const contractId = new ContractId(1, 2, 3);

            const roundTripped = ContractId.fromBytes(contractId.toBytes());

            expect(roundTripped.toString()).to.equal("1.2.3");
            expect(roundTripped.evmAddress).to.be.null;
            expect(roundTripped.compare(contractId)).to.equal(0);
        });

        it("should keep the EVM address of a ContractId used as a key", function () {
            const contractId = ContractId.fromEvmAddress(
                0,
                0,
                nonLongZeroAddress,
            );

            const fromKey = Key._fromProtobufKey(contractId._toProtobufKey());

            expect(fromKey).to.be.instanceOf(ContractId);
            expect(fromKey.toString()).to.equal(`0.0.${nonLongZeroAddress}`);
        });

        it("_fromProtobuf() should copy the EVM address", function () {
            const evmAddressBytes = hex.decode(nonLongZeroAddress);

            const contractId = ContractId._fromProtobuf({
                shardNum: Long.ZERO,
                realmNum: Long.ZERO,
                evmAddress: evmAddressBytes,
            });
            evmAddressBytes.fill(0);

            expect(contractId.toEvmAddress()).to.equal(nonLongZeroAddress);
        });

        it("_fromProtobuf() should treat an empty EVM address as unset", function () {
            const contractId = ContractId._fromProtobuf({
                shardNum: Long.ZERO,
                realmNum: Long.ZERO,
                contractNum: Long.fromNumber(7),
                evmAddress: new Uint8Array(),
            });

            expect(contractId.evmAddress).to.be.null;
            expect(contractId.toString()).to.equal("0.0.7");
        });
    });
});
