import {
    TransactionFeeSchedule,
    RequestType,
    FeeData,
    FeeComponents,
    FeeDataType,
} from "../../src/index.js";
import Long from "long";

describe("TransactionFeeSchedule", function () {
    const sampleFeeComponents = {
        min: Long.fromNumber(10),
        max: Long.fromNumber(100),
        constant: Long.fromNumber(5),
        transactionBandwidthByte: Long.fromNumber(2),
        transactionVerification: Long.fromNumber(1),
        transactionRamByteHour: Long.fromNumber(3),
        transactionStorageByteHour: Long.fromNumber(4),
        contractTransactionGas: Long.fromNumber(6),
        transferVolumeHbar: Long.fromNumber(7),
        responseMemoryByte: Long.fromNumber(8),
        responseDiskByte: Long.fromNumber(9),
    };

    function createSampleFeeData(minVal = 10) {
        return new FeeData({
            nodedata: new FeeComponents({
                ...sampleFeeComponents,
                min: Long.fromNumber(minVal),
            }),
            networkdata: new FeeComponents({
                ...sampleFeeComponents,
                min: Long.fromNumber(20),
            }),
            servicedata: new FeeComponents({
                ...sampleFeeComponents,
                max: Long.fromNumber(200),
            }),
            feeDataType: FeeDataType.Default,
        });
    }

    describe("constructor", function () {
        it("should create an empty instance when no parameters provided", function () {
            const schedule = new TransactionFeeSchedule();
            expect(schedule.hederaFunctionality).to.be.undefined;
            expect(schedule.feeData).to.be.undefined;
            expect(schedule.fees).to.be.undefined;
        });

        it("should correctly set provided properties", function () {
            const feeData = createSampleFeeData();
            const fees = [createSampleFeeData(10), createSampleFeeData(20)];
            const schedule = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.CryptoTransfer,
                feeData,
                fees,
            });

            expect(schedule.hederaFunctionality).to.equal(
                RequestType.CryptoTransfer,
            );
            expect(schedule.feeData).to.equal(feeData);
            expect(schedule.fees).to.equal(fees);
        });

        it("should handle partial properties", function () {
            const schedule = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.None,
            });

            expect(schedule.hederaFunctionality).to.equal(RequestType.None);
            expect(schedule.feeData).to.be.undefined;
            expect(schedule.fees).to.be.undefined;
        });
    });

    describe("_fromProtobuf", function () {
        describe("null-guard behavior", function () {
            it("should handle missing hederaFunctionality", function () {
                const feeData = createSampleFeeData();
                const proto = {
                    feeData: feeData._toProtobuf(),
                    fees: [feeData._toProtobuf()],
                };

                const schedule = TransactionFeeSchedule._fromProtobuf(proto);
                expect(schedule.hederaFunctionality).to.be.undefined;
                expect(schedule.feeData).to.be.instanceOf(FeeData);
                expect(schedule.fees).to.have.lengthOf(1);
                expect(schedule.fees[0]).to.be.instanceOf(FeeData);
            });

            it("should handle missing feeData", function () {
                const feeData = createSampleFeeData();
                const proto = {
                    hederaFunctionality: 0,
                    fees: [feeData._toProtobuf()],
                };

                const schedule = TransactionFeeSchedule._fromProtobuf(proto);
                expect(schedule.hederaFunctionality).to.equal(RequestType.None);
                expect(schedule.feeData).to.be.undefined;
                expect(schedule.fees).to.have.lengthOf(1);
                expect(schedule.fees[0]).to.be.instanceOf(FeeData);
            });

            it("should handle missing fees", function () {
                const feeData = createSampleFeeData();
                const proto = {
                    hederaFunctionality: 0,
                    feeData: feeData._toProtobuf(),
                };

                const schedule = TransactionFeeSchedule._fromProtobuf(proto);
                expect(schedule.hederaFunctionality).to.equal(RequestType.None);
                expect(schedule.feeData).to.be.instanceOf(FeeData);
                expect(schedule.fees).to.be.undefined;
            });

            it("should handle completely empty protobuf object", function () {
                const schedule = TransactionFeeSchedule._fromProtobuf({});
                expect(schedule.hederaFunctionality).to.be.undefined;
                expect(schedule.feeData).to.be.undefined;
                expect(schedule.fees).to.be.undefined;
            });

            it("should handle explicit null fields in protobuf object", function () {
                const schedule = TransactionFeeSchedule._fromProtobuf({
                    hederaFunctionality: null,
                    feeData: null,
                    fees: null,
                });
                expect(schedule.hederaFunctionality).to.be.undefined;
                expect(schedule.feeData).to.be.undefined;
                expect(schedule.fees).to.be.undefined;
            });
        });

        describe("protobuf conversion", function () {
            it("should correctly convert valid protobuf values with code 0 (NONE)", function () {
                const feeData = createSampleFeeData();
                const proto = {
                    hederaFunctionality: 0,
                    feeData: feeData._toProtobuf(),
                    fees: [feeData._toProtobuf()],
                };

                const schedule = TransactionFeeSchedule._fromProtobuf(proto);
                expect(schedule.hederaFunctionality).to.equal(RequestType.None);
                expect(schedule.hederaFunctionality.toString()).to.equal(
                    "NONE",
                );
                expect(schedule.hederaFunctionality.valueOf()).to.equal(0);
                expect(schedule.feeData.nodedata.min.toNumber()).to.equal(10);
                expect(
                    schedule.feeData.nodedata.transactionBandwidthByte.toNumber(),
                ).to.equal(2);
                expect(schedule.fees).to.have.lengthOf(1);
                expect(schedule.fees[0].nodedata.min.toNumber()).to.equal(10);
                expect(
                    schedule.fees[0].nodedata.contractTransactionGas.toNumber(),
                ).to.equal(6);
            });

            it("should correctly convert non-zero hederaFunctionality", function () {
                const proto = {
                    hederaFunctionality: 1, // CryptoTransfer
                };

                const schedule = TransactionFeeSchedule._fromProtobuf(proto);
                expect(schedule.hederaFunctionality).to.equal(
                    RequestType.CryptoTransfer,
                );
                expect(schedule.hederaFunctionality.toString()).to.equal(
                    "CryptoTransfer",
                );
                expect(schedule.hederaFunctionality.valueOf()).to.equal(1);
            });
        });
    });

    describe("_toProtobuf", function () {
        it("should correctly serialize to protobuf with all fields", function () {
            const feeData = createSampleFeeData();
            const fees = [createSampleFeeData(10), createSampleFeeData(20)];
            const schedule = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.CryptoTransfer,
                feeData,
                fees,
            });

            const proto = schedule._toProtobuf();
            expect(proto.hederaFunctionality).to.equal(1);
            expect(proto.feeData).to.exist;
            expect(proto.feeData.nodedata.min.toNumber()).to.equal(10);
            expect(proto.feeData.nodedata.bpt.toNumber()).to.equal(2);
            expect(proto.fees).to.exist;
            expect(proto.fees).to.have.lengthOf(2);
            expect(proto.fees[0].nodedata.min.toNumber()).to.equal(10);
            expect(proto.fees[0].nodedata.gas.toNumber()).to.equal(6);
            expect(proto.fees[1].nodedata.min.toNumber()).to.equal(20);
        });

        it("should correctly serialize with hederaFunctionality 0 (NONE)", function () {
            const schedule = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.None,
            });

            const proto = schedule._toProtobuf();
            expect(proto.hederaFunctionality).to.equal(0);
            expect(proto.feeData).to.be.undefined;
            expect(proto.fees).to.be.undefined;
        });

        it("should handle completely empty instance", function () {
            const schedule = new TransactionFeeSchedule();
            const proto = schedule._toProtobuf();

            expect(proto.hederaFunctionality).to.be.undefined;
            expect(proto.feeData).to.be.undefined;
            expect(proto.fees).to.be.undefined;
        });
    });

    describe("round-trip conversion", function () {
        it("should preserve original values when serialized and deserialized via protobuf with all fields", function () {
            const feeData = createSampleFeeData();
            const fees = [createSampleFeeData(10), createSampleFeeData(30)];
            const original = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.CryptoTransfer,
                feeData,
                fees,
            });

            const proto = original._toProtobuf();
            const roundTripped = TransactionFeeSchedule._fromProtobuf(proto);

            expect(roundTripped.hederaFunctionality.valueOf()).to.equal(
                original.hederaFunctionality.valueOf(),
            );
            expect(roundTripped.hederaFunctionality.toString()).to.equal(
                original.hederaFunctionality.toString(),
            );
            expect(roundTripped.feeData.nodedata.min.toNumber()).to.equal(
                original.feeData.nodedata.min.toNumber(),
            );
            expect(
                roundTripped.feeData.nodedata.transactionBandwidthByte.toNumber(),
            ).to.equal(
                original.feeData.nodedata.transactionBandwidthByte.toNumber(),
            );
            expect(
                roundTripped.feeData.nodedata.contractTransactionGas.toNumber(),
            ).to.equal(
                original.feeData.nodedata.contractTransactionGas.toNumber(),
            );
            expect(roundTripped.fees).to.have.lengthOf(original.fees.length);
            expect(roundTripped.fees[0].nodedata.min.toNumber()).to.equal(
                original.fees[0].nodedata.min.toNumber(),
            );
            expect(
                roundTripped.fees[0].nodedata.contractTransactionGas.toNumber(),
            ).to.equal(
                original.fees[0].nodedata.contractTransactionGas.toNumber(),
            );
            expect(roundTripped.fees[1].nodedata.min.toNumber()).to.equal(
                original.fees[1].nodedata.min.toNumber(),
            );
        });

        it("should preserve original values with hederaFunctionality 0 (NONE)", function () {
            const original = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.None,
            });

            const proto = original._toProtobuf();
            const roundTripped = TransactionFeeSchedule._fromProtobuf(proto);

            expect(roundTripped.hederaFunctionality.valueOf()).to.equal(0);
            expect(roundTripped.hederaFunctionality.toString()).to.equal(
                "NONE",
            );
            expect(roundTripped.feeData).to.be.undefined;
            expect(roundTripped.fees).to.be.undefined;
        });
    });

    describe("binary serialization", function () {
        it("should preserve fields through toBytes() and fromBytes() with hederaFunctionality 0 (NONE)", function () {
            const schedule = TransactionFeeSchedule._fromProtobuf({
                hederaFunctionality: 0,
            });
            const bytes = schedule.toBytes();
            const recovered = TransactionFeeSchedule.fromBytes(bytes);

            expect(recovered.hederaFunctionality.toString()).to.equal(
                schedule.hederaFunctionality.toString(),
            );
            expect(recovered.hederaFunctionality.valueOf()).to.equal(0);
        });

        it("should preserve all fields through toBytes() and fromBytes() with full data", function () {
            const feeData = createSampleFeeData();
            const fees = [createSampleFeeData(10), createSampleFeeData(40)];
            const original = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.CryptoTransfer,
                feeData,
                fees,
            });

            const bytes = original.toBytes();
            const recovered = TransactionFeeSchedule.fromBytes(bytes);

            expect(recovered.hederaFunctionality.toString()).to.equal(
                original.hederaFunctionality.toString(),
            );
            expect(recovered.hederaFunctionality.valueOf()).to.equal(
                original.hederaFunctionality.valueOf(),
            );
            expect(recovered.feeData.nodedata.min.toNumber()).to.equal(
                original.feeData.nodedata.min.toNumber(),
            );
            expect(
                recovered.feeData.nodedata.transactionBandwidthByte.toNumber(),
            ).to.equal(
                original.feeData.nodedata.transactionBandwidthByte.toNumber(),
            );
            expect(
                recovered.feeData.nodedata.contractTransactionGas.toNumber(),
            ).to.equal(
                original.feeData.nodedata.contractTransactionGas.toNumber(),
            );
            expect(recovered.feeData.networkdata.min.toNumber()).to.equal(
                original.feeData.networkdata.min.toNumber(),
            );
            expect(recovered.feeData.servicedata.max.toNumber()).to.equal(
                original.feeData.servicedata.max.toNumber(),
            );
            expect(recovered.fees).to.have.lengthOf(2);
            expect(recovered.fees[0].nodedata.min.toNumber()).to.equal(
                original.fees[0].nodedata.min.toNumber(),
            );
            expect(
                recovered.fees[0].nodedata.contractTransactionGas.toNumber(),
            ).to.equal(
                original.fees[0].nodedata.contractTransactionGas.toNumber(),
            );
            expect(recovered.fees[1].nodedata.min.toNumber()).to.equal(
                original.fees[1].nodedata.min.toNumber(),
            );
        });

        it("should preserve fields with multiple fee entries and distinct feeDataTypes", function () {
            const feeData1 = createSampleFeeData();
            const feeData2 = new FeeData({
                nodedata: new FeeComponents({
                    ...sampleFeeComponents,
                    min: Long.fromNumber(50),
                }),
                feeDataType: FeeDataType.TokenFungibleCommon,
            });

            const original = new TransactionFeeSchedule({
                hederaFunctionality: RequestType.None,
                feeData: feeData1,
                fees: [feeData1, feeData2],
            });

            const bytes = original.toBytes();
            const recovered = TransactionFeeSchedule.fromBytes(bytes);

            expect(recovered.hederaFunctionality.toString()).to.equal("NONE");
            expect(recovered.hederaFunctionality.valueOf()).to.equal(0);
            expect(recovered.fees).to.have.lengthOf(2);
            expect(recovered.fees[0].nodedata.min.toNumber()).to.equal(10);
            expect(
                recovered.fees[0].nodedata.transactionBandwidthByte.toNumber(),
            ).to.equal(2);
            expect(recovered.fees[1].nodedata.min.toNumber()).to.equal(50);
            expect(recovered.fees[1].feeDataType.valueOf()).to.equal(
                FeeDataType.TokenFungibleCommon.valueOf(),
            );
        });
    });
});
