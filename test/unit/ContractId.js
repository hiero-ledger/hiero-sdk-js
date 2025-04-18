import { expect } from "chai";

import { ContractId } from "../../src/index.js";
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

    it("toSolidityAddress() to prioritize evmAddress", function () {
        const emvAddresContractId = ContractId.fromEvmAddress(1, 2, evmAddress);

        expect(emvAddresContractId.toString()).to.be.equal(`1.2.${evmAddress}`);
        expect(emvAddresContractId.toSolidityAddress()).to.be.equal(evmAddress);
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
            .toSolidityAddress()
            .padStart(ADDRESS_LENGTH, "0x");

        const contractIdFromAddress = ContractId.fromEvmAddress(
            shard,
            realm,
            longZeroAddress,
        );

        expect(contractId).to.deep.equal(contractIdFromAddress);
    });
    it("should handle long-zero format addresses", function () {
        // Create a contract address that represents a Hiero contract (0.0.5)
        const contractId = new ContractId(0, 0, 5);
        const solAddress = contractId.toSolidityAddress();

        // Convert it back using fromEvmAddress
        const result = ContractId.fromEvmAddress(0, 0, solAddress);

        // Should reconstruct the original contract ID
        expect(result.shard.toNumber()).to.equal(0);
        expect(result.realm.toNumber()).to.equal(0);
        expect(result.num.toNumber()).to.equal(5);
        expect(result.evmAddress).to.be.null;
    });

    it("should handle native EVM addresses", function () {
        const evmAddress = "742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const shard = 1;
        const realm = 2;

        const result = ContractId.fromEvmAddress(shard, realm, evmAddress);

        // For EVM addresses, should store shard/realm and keep the EVM address
        expect(result.shard.toNumber()).to.equal(shard);
        expect(result.realm.toNumber()).to.equal(realm);
        expect(result.num.toNumber()).to.equal(0);
        expect(result.evmAddress).to.not.be.null;
        expect(hex.encode(result.evmAddress)).to.equal(
            evmAddress.toLowerCase(),
        );
    });

    it("should handle non-zero shard and realm with long-zero format", function () {
        // Create a contract address that represents a Hiero contract (1.2.5)
        const contractId = new ContractId(1, 2, 5);
        const solAddress = contractId.toSolidityAddress();

        // Convert it back using fromEvmAddress
        const result = ContractId.fromEvmAddress(1, 2, solAddress);

        // Should reconstruct the original contract ID
        expect(result.shard.toNumber()).to.equal(1);
        expect(result.realm.toNumber()).to.equal(2);
        expect(result.num.toNumber()).to.equal(5);
        expect(result.evmAddress).to.be.null;
    });

    it("should handle addresses with 0x prefix", function () {
        const evmAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const result = ContractId.fromEvmAddress(1, 2, evmAddress);

        expect(hex.encode(result.evmAddress)).to.equal(
            evmAddress.slice(2).toLowerCase(),
        );
    });

    it("should handle very large contract numbers in long-zero format", function () {
        // Create a contract with a large number
        const contractId = new ContractId(0, 0, Long.fromString("123456789"));
        const solAddress = contractId.toSolidityAddress();

        const result = ContractId.fromEvmAddress(0, 0, solAddress);

        expect(result.num.toString()).to.equal("123456789");
        expect(result.evmAddress).to.be.null;
    });

    it("should handle negative shard/realm values", function () {
        const evmAddress = "742d35Cc6634C0532925a3b844Bc454e4438f44e";

        expect(() => {
            ContractId.fromEvmAddress(-1, 0, evmAddress);
        }).to.throw();

        expect(() => {
            ContractId.fromEvmAddress(0, -1, evmAddress);
        }).to.throw();
    });
});
