import { FeeData, FeeComponents, FeeDataType } from "../../src/index.js";

import Long from "long";

describe("FeeData", function () {
    // Sample fee component values for testing
    const sampleFeeComponents = {
        min: Long.fromNumber(10),
        max: Long.fromNumber(100),
        constant: Long.fromNumber(5),
        bpt: Long.fromNumber(2),
        vpt: Long.fromNumber(1),
        rbh: Long.fromNumber(3),
        sbh: Long.fromNumber(4),
        gas: Long.fromNumber(6),
        tv: Long.fromNumber(7),
        bpr: Long.fromNumber(8),
        sbpr: Long.fromNumber(9),
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
            const feeDataType = FeeDataType.DEFAULT;

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
            const feeDataType = FeeDataType.DEFAULT;

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
                subType: 0, // DEFAULT
            };

            // Deserialize using _fromProtobuf
            const feeData = FeeData._fromProtobuf(protoData);

            // Verify all properties
            expect(feeData.nodedata.min.toNumber()).to.equal(10);
            expect(feeData.networkdata.min.toNumber()).to.equal(20);
            expect(feeData.servicedata.max.toNumber()).to.equal(200);
            expect(feeData.feeDataType.valueOf()).to.equal(0); // DEFAULT
        });

        it("should correctly deserialize from protobuf with missing fields", function () {
            // Create protobuf data with some fields missing
            const protoData = {
                nodedata: createFeeComponentsProto(sampleFeeComponents),
                // networkdata is missing
                // servicedata is missing
                subType: 1, // HANDLING
            };

            // Deserialize using _fromProtobuf
            const feeData = FeeData._fromProtobuf(protoData);

            // Verify properties
            expect(feeData.nodedata.min.toNumber()).to.equal(10);
            expect(feeData.networkdata).to.be.undefined;
            expect(feeData.servicedata).to.be.undefined;
            expect(feeData.feeDataType.valueOf()).to.equal(1); // HANDLING
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
            const feeDataType = FeeDataType.DEFAULT;

            const feeData = new FeeData({
                nodedata,
                networkdata,
                servicedata,
                feeDataType,
            });

            // Serialize to protobuf
            const proto = feeData._toProtobuf();

            // Verify fields
            expect(proto.nodedata).to.exist;
            expect(proto.nodedata.min.toNumber()).to.equal(10);
            expect(proto.networkdata).to.exist;
            expect(proto.networkdata.min.toNumber()).to.equal(20);
            expect(proto.servicedata).to.exist;
            expect(proto.servicedata.max.toNumber()).to.equal(200);
            expect(proto.subType).to.equal(FeeDataType.DEFAULT); // DEFAULT
        });

        it("should correctly serialize to protobuf with missing fields", function () {
            // Create a FeeData instance with some fields missing
            const nodedata = new FeeComponents(sampleFeeComponents);
            const feeDataType = FeeDataType.HANDLING; // 1

            const feeData = new FeeData({
                nodedata,
                feeDataType,
            });

            // Serialize to protobuf
            const proto = feeData._toProtobuf();

            // Verify fields
            expect(proto.nodedata).to.exist;
            expect(proto.nodedata.min.toNumber()).to.equal(10);
            expect(proto.networkdata).to.be.undefined;
            expect(proto.servicedata).to.be.undefined;
            expect(proto.subType).to.equal(FeeDataType.HANDLING); // HANDLING
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
                feeDataType: FeeDataType.DEFAULT,
            });

            // Convert to protobuf and back
            const proto = original._toProtobuf();
            const roundTripped = FeeData._fromProtobuf(proto);

            // Verify all properties match
            expect(roundTripped.nodedata.min.toNumber()).to.equal(
                original.nodedata.min.toNumber(),
            );
            expect(roundTripped.networkdata.min.toNumber()).to.equal(
                original.networkdata.min.toNumber(),
            );
            expect(roundTripped.servicedata.max.toNumber()).to.equal(
                original.servicedata.max.toNumber(),
            );
        });

        it("should correctly round-trip with toBytes/fromBytes", function () {
            // Create original FeeData
            const original = new FeeData({
                nodedata: new FeeComponents(sampleFeeComponents),
                networkdata: new FeeComponents({
                    ...sampleFeeComponents,
                    min: Long.fromNumber(20),
                }),
                feeDataType: FeeDataType.HANDLING,
            });

            // Convert to bytes and back
            const bytes = original.toBytes();
            const roundTripped = FeeData.fromBytes(bytes);

            // Verify properties match
            expect(roundTripped.nodedata.min.toNumber()).to.equal(
                original.nodedata.min.toNumber(),
            );
            expect(roundTripped.networkdata.min.toNumber()).to.equal(
                original.networkdata.min.toNumber(),
            );
            expect(roundTripped.servicedata).to.equal(original.servicedata); // Both undefined
        });
    });

    // Helper function to create a FeeComponents protobuf object
    function createFeeComponentsProto(props) {
        return {
            min: props.min,
            max: props.max,
            constant: props.constant,
            bpt: props.bpt,
            vpt: props.vpt,
            rbh: props.rbh,
            sbh: props.sbh,
            gas: props.gas,
            tv: props.tv,
            bpr: props.bpr,
            sbpr: props.sbpr,
        };
    }
});
