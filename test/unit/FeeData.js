import { FeeData, FeeComponents, FeeDataType } from "../../src/index.js";

import Long from "long";

describe("FeeData", function () {
    // Sample fee component values for testing
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

    describe("constructor", function () {
        it("should create an empty instance when no parameters provided", function () {
            const feeData = new FeeData();
            expect(feeData.nodedata).to.be.undefined;
            expect(feeData.networkdata).to.be.undefined;
            expect(feeData.servicedata).to.be.undefined;
            expect(feeData.feeDataType).to.be.undefined;
        });

        it("should correctly set provided properties", function () {
            const nodedata = new FeeComponents(sampleFeeComponents);
            const networkdata = new FeeComponents({
                ...sampleFeeComponents,
                min: Long.fromNumber(20),
            });
            const servicedata = new FeeComponents({
                ...sampleFeeComponents,
                max: Long.fromNumber(200),
            });
            const feeDataType = FeeDataType.Default;

            const feeData = new FeeData({
                nodedata,
                networkdata,
                servicedata,
                feeDataType,
            });

            expect(feeData.nodedata).to.equal(nodedata);
            expect(feeData.networkdata).to.equal(networkdata);
            expect(feeData.servicedata).to.equal(servicedata);
            expect(feeData.feeDataType).to.equal(feeDataType);
        });

        it("should handle partial properties", function () {
            const nodedata = new FeeComponents(sampleFeeComponents);
            const feeDataType = FeeDataType.Default;

            const feeData = new FeeData({
                nodedata,
                feeDataType,
            });

            expect(feeData.nodedata).to.equal(nodedata);
            expect(feeData.networkdata).to.be.undefined;
            expect(feeData.servicedata).to.be.undefined;
            expect(feeData.feeDataType).to.equal(feeDataType);
        });
    });

    describe("_fromProtobuf", function () {
        it("should correctly deserialize from protobuf with all fields", function () {
            // Create protobuf data with all fields
            const protoData = {
                nodedata: createFeeComponentsProto(sampleFeeComponents),
                networkdata: createFeeComponentsProto({
                    ...sampleFeeComponents,
                    min: Long.fromNumber(20),
                }),
                servicedata: createFeeComponentsProto({
                    ...sampleFeeComponents,
                    max: Long.fromNumber(200),
                }),
                subType: 0,
            };

            // Deserialize using _fromProtobuf
            const feeData = FeeData._fromProtobuf(protoData);

            // Verify all properties
            expect(feeData.nodedata).to.deep.include(sampleFeeComponents);
            expect(feeData.networkdata).to.deep.include({
                ...sampleFeeComponents,
                min: Long.fromNumber(20),
            });
            expect(feeData.servicedata).to.deep.include({
                ...sampleFeeComponents,
                max: Long.fromNumber(200),
            });
            expect(feeData.feeDataType).to.equal(FeeDataType.Default);
        });

        it("should correctly deserialize from protobuf with missing fields", function () {
            // Create protobuf data with some fields missing
            const protoData = {
                nodedata: createFeeComponentsProto(sampleFeeComponents),
                // networkdata is missing
                // servicedata is missing
                subType: 1,
            };

            // Deserialize using _fromProtobuf
            const feeData = FeeData._fromProtobuf(protoData);

            // Verify properties
            expect(feeData.nodedata).to.deep.include(sampleFeeComponents);
            expect(feeData.networkdata).to.be.undefined;
            expect(feeData.servicedata).to.be.undefined;
            expect(feeData.feeDataType).to.equal(
                FeeDataType.TokenFungibleCommon,
            );
        });

        it("should handle completely empty protobuf object", function () {
            const protoData = {};
            const feeData = FeeData._fromProtobuf(protoData);

            expect(feeData.nodedata).to.be.undefined;
            expect(feeData.networkdata).to.be.undefined;
            expect(feeData.servicedata).to.be.undefined;
            expect(feeData.feeDataType).to.be.undefined;
        });
    });

    describe("_toProtobuf", function () {
        it("should correctly serialize to protobuf with all fields", function () {
            // Create a FeeData instance with all fields
            const nodedata = new FeeComponents(sampleFeeComponents);
            const networkdata = new FeeComponents({
                ...sampleFeeComponents,
                min: Long.fromNumber(20),
            });
            const servicedata = new FeeComponents({
                ...sampleFeeComponents,
                max: Long.fromNumber(200),
            });
            const feeDataType = FeeDataType.Default;

            const feeData = new FeeData({
                nodedata,
                networkdata,
                servicedata,
                feeDataType,
            });

            // Serialize to protobuf
            const proto = feeData._toProtobuf();

            // Verify fields
            expect(proto.nodedata).to.deep.equal(
                createFeeComponentsProto(sampleFeeComponents),
            );
            expect(proto.networkdata).to.deep.equal(
                createFeeComponentsProto({
                    ...sampleFeeComponents,
                    min: Long.fromNumber(20),
                }),
            );
            expect(proto.servicedata).to.deep.equal(
                createFeeComponentsProto({
                    ...sampleFeeComponents,
                    max: Long.fromNumber(200),
                }),
            );
            expect(proto.subType).to.equal(0);
        });

        it("should correctly serialize to protobuf with missing fields", function () {
            // Create a FeeData instance with some fields missing
            const nodedata = new FeeComponents(sampleFeeComponents);
            const feeDataType = FeeDataType.TokenFungibleCommon;

            const feeData = new FeeData({
                nodedata,
                feeDataType,
            });

            // Serialize to protobuf
            const proto = feeData._toProtobuf();

            // Verify fields
            expect(proto.nodedata).to.deep.equal(
                createFeeComponentsProto(sampleFeeComponents),
            );
            expect(proto.networkdata).to.be.undefined;
            expect(proto.servicedata).to.be.undefined;
            expect(proto.subType).to.equal(1);
        });

        it("should handle completely empty instance", function () {
            const feeData = new FeeData();
            const proto = feeData._toProtobuf();

            expect(proto.nodedata).to.be.undefined;
            expect(proto.networkdata).to.be.undefined;
            expect(proto.servicedata).to.be.undefined;
            expect(proto.subType).to.be.undefined;
        });
    });

    describe("round-trip conversion", function () {
        it("should correctly round-trip from FeeData -> protobuf -> FeeData with all fields", function () {
            // Create original FeeData with all fields
            const original = new FeeData({
                nodedata: new FeeComponents(sampleFeeComponents),
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

            // Convert to protobuf and back
            const proto = original._toProtobuf();
            const roundTripped = FeeData._fromProtobuf(proto);

            // Verify all properties match
            expect(roundTripped).to.deep.equal(original);
        });

        it("should correctly round-trip with toBytes/fromBytes", function () {
            // Create original FeeData
            const original = new FeeData({
                nodedata: new FeeComponents(sampleFeeComponents),
                networkdata: new FeeComponents({
                    ...sampleFeeComponents,
                    min: Long.fromNumber(20),
                }),
                feeDataType: FeeDataType.TokenFungibleCommon,
            });

            // Convert to bytes and back
            const bytes = original.toBytes();
            const roundTripped = FeeData.fromBytes(bytes);

            expectFeeComponentValues(
                roundTripped.nodedata,
                sampleFeeComponents,
            );
            expectFeeComponentValues(roundTripped.networkdata, {
                ...sampleFeeComponents,
                min: Long.fromNumber(20),
            });
            expect(roundTripped.servicedata).to.be.undefined;
            expect(roundTripped.feeDataType).to.equal(
                FeeDataType.TokenFungibleCommon,
            );
        });
    });

    function expectFeeComponentValues(actual, expected) {
        for (const [field, value] of Object.entries(expected)) {
            expect(actual[field]?.toString(), field).to.equal(value.toString());
        }
    }

    // Helper function to create a FeeComponents protobuf object
    function createFeeComponentsProto(props) {
        return {
            min: props.min,
            max: props.max,
            constant: props.constant,
            bpt: props.transactionBandwidthByte,
            vpt: props.transactionVerification,
            rbh: props.transactionRamByteHour,
            sbh: props.transactionStorageByteHour,
            gas: props.contractTransactionGas,
            tv: props.transferVolumeHbar,
            bpr: props.responseMemoryByte,
            sbpr: props.responseDiskByte,
        };
    }
});
