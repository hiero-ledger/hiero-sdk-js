import { ContractId, DelegateContractId } from "../../src/index.js";
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

    it("round-trips an EVM ContractId through bytes", function () {
        const contractId = ContractId.fromEvmAddress(1, 2, evmAddress);
        const bytes = contractId.toBytes();
        const decoded = ContractId.fromBytes(bytes);

        expect(decoded.toString()).toBe(`1.2.${evmAddress}`);
        expect(decoded.toEvmAddress()).toBe(evmAddress);
        expect(decoded.toBytes()).toEqual(bytes);
    });

    it("clones EVM ContractId bytes independently", function () {
        const contractId = ContractId.fromEvmAddress(1, 2, evmAddress);
        const cloned = contractId.clone();

        cloned.evmAddress.fill(0);
        expect(contractId.toEvmAddress()).toBe(evmAddress);
        contractId.evmAddress.fill(255);
        expect(cloned.evmAddress).toEqual(new Uint8Array(20));
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
});
