import { FeeComponents } from "../../src/index.js";
import Long from "long";

describe("FeeComponents", function () {
    let defaultProps;

    beforeEach(function () {
        defaultProps = {
            min: Long.fromNumber(10),
            max: Long.fromNumber(100),
            constant: Long.fromNumber(5),
            transactionBandwidthByte: Long.fromNumber(1),
            transactionVerification: Long.fromNumber(2),
            transactionRamByteHour: Long.fromNumber(3),
            transactionStorageByteHour: Long.fromNumber(4),
            contractTransactionGas: Long.fromNumber(5),
            transferVolumeHbar: Long.fromNumber(6),
            responseMemoryByte: Long.fromNumber(7),
            responseDiskByte: Long.fromNumber(8),
        };
    });

    describe("constructor", function () {
        it("should create with default empty props", function () {
            const feeComponents = new FeeComponents();
            expect(feeComponents.min).to.be.undefined;
            expect(feeComponents.max).to.be.undefined;
            expect(feeComponents.constant).to.be.undefined;
            expect(feeComponents.transactionBandwidthByte).to.be.undefined;
            expect(feeComponents.transactionVerification).to.be.undefined;
            expect(feeComponents.transactionRamByteHour).to.be.undefined;
            expect(feeComponents.transactionStorageByteHour).to.be.undefined;
            expect(feeComponents.contractTransactionGas).to.be.undefined;
            expect(feeComponents.transferVolumeHbar).to.be.undefined;
            expect(feeComponents.responseMemoryByte).to.be.undefined;
            expect(feeComponents.responseDiskByte).to.be.undefined;
        });

        it("should create with given props", function () {
            const feeComponents = new FeeComponents(defaultProps);
            expect(feeComponents.min.toNumber()).to.equal(10);
            expect(feeComponents.max.toNumber()).to.equal(100);
            expect(feeComponents.constant.toNumber()).to.equal(5);
            expect(feeComponents.transactionBandwidthByte.toNumber()).to.equal(
                1,
            );
            expect(feeComponents.transactionVerification.toNumber()).to.equal(
                2,
            );
            expect(feeComponents.transactionRamByteHour.toNumber()).to.equal(3);
            expect(
                feeComponents.transactionStorageByteHour.toNumber(),
            ).to.equal(4);
            expect(feeComponents.contractTransactionGas.toNumber()).to.equal(5);
            expect(feeComponents.transferVolumeHbar.toNumber()).to.equal(6);
            expect(feeComponents.responseMemoryByte.toNumber()).to.equal(7);
            expect(feeComponents.responseDiskByte.toNumber()).to.equal(8);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create from protobuf with all fields", function () {
            const protoObj = {
                min: Long.fromNumber(10),
                max: Long.fromNumber(100),
                constant: Long.fromNumber(5),
                bpt: Long.fromNumber(1),
                vpt: Long.fromNumber(2),
                rbh: Long.fromNumber(3),
                sbh: Long.fromNumber(4),
                gas: Long.fromNumber(5),
                tv: Long.fromNumber(6),
                bpr: Long.fromNumber(7),
                sbpr: Long.fromNumber(8),
            };

            const feeComponents = FeeComponents._fromProtobuf(protoObj);

            expect(feeComponents.min.toNumber()).to.equal(10);
            expect(feeComponents.max.toNumber()).to.equal(100);
            expect(feeComponents.constant.toNumber()).to.equal(5);
            expect(feeComponents.transactionBandwidthByte.toNumber()).to.equal(
                1,
            );
            expect(feeComponents.transactionVerification.toNumber()).to.equal(
                2,
            );
            expect(feeComponents.transactionRamByteHour.toNumber()).to.equal(3);
            expect(
                feeComponents.transactionStorageByteHour.toNumber(),
            ).to.equal(4);
            expect(feeComponents.contractTransactionGas.toNumber()).to.equal(5);
            expect(feeComponents.transferVolumeHbar.toNumber()).to.equal(6);
            expect(feeComponents.responseMemoryByte.toNumber()).to.equal(7);
            expect(feeComponents.responseDiskByte.toNumber()).to.equal(8);
        });

        it("should handle missing fields in protobuf", function () {
            const protoObj = {
                min: Long.fromNumber(10),
                constant: Long.fromNumber(5),
            };

            const feeComponents = FeeComponents._fromProtobuf(protoObj);

            expect(feeComponents.min.toNumber()).to.equal(10);
            expect(feeComponents.max).to.be.undefined;
            expect(feeComponents.constant.toNumber()).to.equal(5);
            expect(feeComponents.transactionBandwidthByte).to.be.undefined;
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const feeComponents = new FeeComponents(defaultProps);
            const protoObj = feeComponents._toProtobuf();

            expect(protoObj.min.toNumber()).to.equal(10);
            expect(protoObj.max.toNumber()).to.equal(100);
            expect(protoObj.constant.toNumber()).to.equal(5);
            expect(protoObj.bpt.toNumber()).to.equal(1);
            expect(protoObj.vpt.toNumber()).to.equal(2);
            expect(protoObj.rbh.toNumber()).to.equal(3);
            expect(protoObj.sbh.toNumber()).to.equal(4);
            expect(protoObj.gas.toNumber()).to.equal(5);
            expect(protoObj.tv.toNumber()).to.equal(6);
            expect(protoObj.bpr.toNumber()).to.equal(7);
            expect(protoObj.sbpr.toNumber()).to.equal(8);
        });

        it("should handle missing fields when converting to protobuf", function () {
            const feeComponents = new FeeComponents({
                min: Long.fromNumber(10),
                constant: Long.fromNumber(5),
            });

            const protoObj = feeComponents._toProtobuf();

            expect(protoObj.min.toNumber()).to.equal(10);
            expect(protoObj.max).to.be.undefined;
            expect(protoObj.constant.toNumber()).to.equal(5);
            expect(protoObj.bpt).to.be.undefined;
        });
    });

    describe("fromBytes/toBytes", function () {
        it("should serialize and deserialize correctly", function () {
            const original = new FeeComponents(defaultProps);
            const bytes = original.toBytes();
            const deserialized = FeeComponents.fromBytes(bytes);

            expect(deserialized.min.toNumber()).to.equal(
                original.min.toNumber(),
            );
            expect(deserialized.max.toNumber()).to.equal(
                original.max.toNumber(),
            );
            expect(deserialized.constant.toNumber()).to.equal(
                original.constant.toNumber(),
            );
            expect(deserialized.transactionBandwidthByte.toNumber()).to.equal(
                original.transactionBandwidthByte.toNumber(),
            );
            expect(deserialized.transactionVerification.toNumber()).to.equal(
                original.transactionVerification.toNumber(),
            );
            expect(deserialized.transactionRamByteHour.toNumber()).to.equal(
                original.transactionRamByteHour.toNumber(),
            );
            expect(deserialized.transactionStorageByteHour.toNumber()).to.equal(
                original.transactionStorageByteHour.toNumber(),
            );
            expect(deserialized.contractTransactionGas.toNumber()).to.equal(
                original.contractTransactionGas.toNumber(),
            );
            expect(deserialized.transferVolumeHbar.toNumber()).to.equal(
                original.transferVolumeHbar.toNumber(),
            );
            expect(deserialized.responseMemoryByte.toNumber()).to.equal(
                original.responseMemoryByte.toNumber(),
            );
            expect(deserialized.responseDiskByte.toNumber()).to.equal(
                original.responseDiskByte.toNumber(),
            );
        });

        it("should serialize and deserialize with partial fields", function () {
            const original = new FeeComponents({
                min: Long.fromNumber(10),
                constant: Long.fromNumber(5),
                responseMemoryByte: Long.fromNumber(7),
            });

            const bytes = original.toBytes();
            const deserialized = FeeComponents.fromBytes(bytes);

            expect(deserialized.min.toInt()).to.equal(10);
            expect(deserialized.constant.toInt()).to.equal(5);
            expect(deserialized.responseMemoryByte.toNumber()).to.equal(7);
        });
    });

    describe("Edge cases", function () {
        it("should handle large long values", function () {
            const largeValue = Long.fromString("9223372036854775807"); // max 64-bit signed

            const feeComponents = new FeeComponents({
                min: largeValue,
                max: largeValue,
            });

            expect(feeComponents.min.toString()).to.equal(
                "9223372036854775807",
            );
            expect(feeComponents.max.toString()).to.equal(
                "9223372036854775807",
            );

            // Test serialization with large values
            const bytes = feeComponents.toBytes();
            const deserialized = FeeComponents.fromBytes(bytes);

            expect(deserialized.min.toString()).to.equal("9223372036854775807");
            expect(deserialized.max.toString()).to.equal("9223372036854775807");
        });

        it("should handle negative long values", function () {
            const negativeValue = Long.fromNumber(-1000);

            const feeComponents = new FeeComponents({
                min: negativeValue,
            });

            expect(feeComponents.min.toNumber()).to.equal(-1000);

            // Test serialization with negative values
            const bytes = feeComponents.toBytes();
            const deserialized = FeeComponents.fromBytes(bytes);

            expect(deserialized.min.toNumber()).to.equal(-1000);
        });
    });
});
