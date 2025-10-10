import EvmHookSpec from "../../src/hooks/EvmHookSpec.js";
import { ContractId } from "../../src/index.js";

describe("EvmHookSpec", function () {
    describe("constructor", function () {
        it("should create an instance with default null contractId", function () {
            const spec = new EvmHookSpec();

            expect(spec.contractId).to.be.null;
        });

        it("should create an instance with provided contractId", function () {
            const contractId = new ContractId(1, 2, 3);
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId).to.equal(contractId);
        });

        it("should create an instance with contractId from string", function () {
            const contractId = ContractId.fromString("0.0.12345");
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId.toString()).to.equal("0.0.12345");
        });

        it("should create an instance with contractId from evmAddress", function () {
            const evmAddress = "0011223344556677889900112233445577889900";
            const contractId = ContractId.fromEvmAddress(1, 2, evmAddress);
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId.toString()).to.equal(`1.2.${evmAddress}`);
        });
    });

    describe("setContractId", function () {
        it("should set contractId and return this for chaining", function () {
            const spec = new EvmHookSpec();
            const contractId = new ContractId(5, 6, 7);

            const result = spec.setContractId(contractId);

            expect(result).to.equal(spec);
            expect(spec.contractId).to.equal(contractId);
        });

        it("should overwrite existing contractId", function () {
            const oldContractId = new ContractId(1, 2, 3);
            const newContractId = new ContractId(4, 5, 6);
            const spec = new EvmHookSpec({ contractId: oldContractId });

            spec.setContractId(newContractId);

            expect(spec.contractId).to.equal(newContractId);
            expect(spec.contractId).to.not.equal(oldContractId);
        });

        it("should handle setting different types of ContractId", function () {
            const spec = new EvmHookSpec();

            // Set numeric ContractId
            const numericId = new ContractId(1, 2, 100);
            spec.setContractId(numericId);
            expect(spec.contractId.toString()).to.equal("1.2.100");

            // Set EVM address ContractId
            const evmAddress = "1122334455667788990011223344556677889900";
            const evmId = ContractId.fromEvmAddress(0, 0, evmAddress);
            spec.setContractId(evmId);
            expect(spec.contractId.toString()).to.equal(`0.0.${evmAddress}`);
        });
    });

    describe("getter", function () {
        it("should get contractId using getter", function () {
            const contractId = new ContractId(10, 20, 30);
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId).to.equal(contractId);
        });

        it("should return null for unset contractId", function () {
            const spec = new EvmHookSpec();

            expect(spec.contractId).to.be.null;
        });

        it("should get updated contractId after setter is called", function () {
            const initialId = new ContractId(1, 1, 1);
            const spec = new EvmHookSpec({ contractId: initialId });

            const newId = new ContractId(2, 2, 2);
            spec.setContractId(newId);

            expect(spec.contractId).to.equal(newId);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with contractId", function () {
            const contractId = new ContractId(3, 4, 5);
            const spec = new EvmHookSpec({ contractId });

            const proto = spec._toProtobuf();

            expect(proto.contractId).to.not.be.null;
            expect(proto.contractId).to.deep.equal(contractId._toProtobuf());
        });

        it("should convert to protobuf with null contractId", function () {
            const spec = new EvmHookSpec();

            const proto = spec._toProtobuf();

            expect(proto.contractId).to.be.undefined;
        });

        it("should handle contractId with EVM address in protobuf", function () {
            const evmAddress = "AABBCCDDEEFF00112233445566778899AABBCCDD";
            const contractId = ContractId.fromEvmAddress(1, 2, evmAddress);
            const spec = new EvmHookSpec({ contractId });

            const proto = spec._toProtobuf();

            expect(proto.contractId).to.not.be.null;
            expect(proto.contractId.evmAddress).to.not.be.null;
        });

        it("should produce valid protobuf structure", function () {
            const contractId = new ContractId(7, 8, 9);
            const spec = new EvmHookSpec({ contractId });

            const proto = spec._toProtobuf();

            expect(proto).to.be.an("object");
            expect(proto).to.have.property("contractId");
        });
    });

    describe("method chaining", function () {
        it("should support method chaining with setContractId", function () {
            const contractId = new ContractId(11, 12, 13);

            const spec = new EvmHookSpec().setContractId(contractId);

            expect(spec.contractId).to.equal(contractId);
        });

        it("should support multiple setter calls", function () {
            const firstId = new ContractId(1, 1, 1);
            const secondId = new ContractId(2, 2, 2);
            const thirdId = new ContractId(3, 3, 3);

            const spec = new EvmHookSpec()
                .setContractId(firstId)
                .setContractId(secondId)
                .setContractId(thirdId);

            expect(spec.contractId).to.equal(thirdId);
        });
    });

    describe("edge cases", function () {
        it("should handle contractId with shard 0, realm 0, num 0", function () {
            const contractId = new ContractId(0, 0, 0);
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId.toString()).to.equal("0.0.0");
        });

        it("should handle very large contract numbers", function () {
            const contractId = new ContractId(0, 0, 999999999);
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId.toString()).to.equal("0.0.999999999");
        });

        it("should handle empty object in constructor", function () {
            const spec = new EvmHookSpec({});

            expect(spec.contractId).to.be.null;
        });

        it("should not mutate the original contractId object", function () {
            const contractId = new ContractId(5, 5, 5);
            const originalString = contractId.toString();

            const spec = new EvmHookSpec({ contractId });
            spec.setContractId(new ContractId(9, 9, 9));

            expect(contractId.toString()).to.equal(originalString);
        });
    });

    describe("integration with ContractId", function () {
        it("should work with ContractId.fromString", function () {
            const contractId = ContractId.fromString("1.2.3");
            const spec = new EvmHookSpec({ contractId });

            const proto = spec._toProtobuf();

            expect(proto.contractId).to.deep.equal(contractId._toProtobuf());
        });

        it("should preserve ContractId properties", function () {
            const contractId = new ContractId(10, 20, 30);
            const spec = new EvmHookSpec({ contractId });

            expect(spec.contractId.shard.toNumber()).to.equal(10);
            expect(spec.contractId.realm.toNumber()).to.equal(20);
            expect(spec.contractId.num.toNumber()).to.equal(30);
        });

        it("should handle different ContractId representations", function () {
            const numericId = new ContractId(1, 2, 3);
            const spec1 = new EvmHookSpec({ contractId: numericId });

            const evmId = ContractId.fromEvmAddress(
                1,
                2,
                "0123456789abcdef0123456789abcdef01234567",
            );
            const spec2 = new EvmHookSpec({ contractId: evmId });

            expect(spec1.contractId.toString()).to.equal("1.2.3");
            expect(spec2.contractId.toString()).to.include("0123456789abcdef");
        });
    });
});
