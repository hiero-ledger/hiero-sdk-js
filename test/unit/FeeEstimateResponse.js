import FeeEstimateResponse from "../../src/query/FeeEstimateResponse.js";
import FeeEstimateMode from "../../src/query/enums/FeeEstimateMode.js";
import NetworkFee from "../../src/query/NetworkFee.js";
import FeeEstimate from "../../src/query/FeeEstimate.js";
import FeeExtra from "../../src/query/FeeExtra.js";
import Long from "long";

describe("FeeEstimateResponse", function () {
    let defaultProps;
    let mockNetworkFee;
    let mockNodeFee;
    let mockServiceFee;

    beforeEach(function () {
        mockNetworkFee = new NetworkFee({
            multiplier: 2.0,
            subtotal: Long.fromNumber(1000),
        });

        mockNodeFee = new FeeEstimate({
            base: Long.fromNumber(500),
            extras: [
                new FeeExtra({
                    name: "nodeExtra",
                    included: 2,
                    count: 5,
                    charged: 3,
                    feePerUnit: 100,
                    subtotal: 300,
                }),
            ],
        });

        mockServiceFee = new FeeEstimate({
            base: Long.fromNumber(750),
            extras: [
                new FeeExtra({
                    name: "serviceExtra",
                    included: 1,
                    count: 3,
                    charged: 2,
                    feePerUnit: 50,
                    subtotal: 100,
                }),
            ],
        });

        defaultProps = {
            mode: FeeEstimateMode.STATE,
            networkFee: mockNetworkFee,
            nodeFee: mockNodeFee,
            serviceFee: mockServiceFee,
            notes: ["Test note 1", "Test note 2"],
            total: Long.fromNumber(2250),
        };
    });

    describe("constructor", function () {
        it("should create with all required props", function () {
            const response = new FeeEstimateResponse(defaultProps);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
            expect(response.networkFee).to.equal(mockNetworkFee);
            expect(response.nodeFee).to.equal(mockNodeFee);
            expect(response.serviceFee).to.equal(mockServiceFee);
            expect(response.notes).to.deep.equal([
                "Test note 1",
                "Test note 2",
            ]);
            expect(response.total.toNumber()).to.equal(2250);
        });

        it("should handle INTRINSIC mode", function () {
            const props = {
                ...defaultProps,
                mode: FeeEstimateMode.INTRINSIC,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.mode).to.equal(FeeEstimateMode.INTRINSIC);
        });

        it("should handle empty notes array", function () {
            const props = {
                ...defaultProps,
                notes: [],
            };

            const response = new FeeEstimateResponse(props);

            expect(response.notes).to.deep.equal([]);
        });

        it("should handle undefined notes", function () {
            const props = {
                ...defaultProps,
                notes: undefined,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.notes).to.deep.equal([]);
        });

        it("should handle number values for total", function () {
            const props = {
                ...defaultProps,
                total: 3000,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.total.toNumber()).to.equal(3000);
        });

        it("should handle string values for total", function () {
            const props = {
                ...defaultProps,
                total: "4000",
            };

            const response = new FeeEstimateResponse(props);

            expect(response.total.toNumber()).to.equal(4000);
        });

        it("should handle zero total", function () {
            const props = {
                ...defaultProps,
                total: 0,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.total.toNumber()).to.equal(0);
        });

        it("should handle single note", function () {
            const props = {
                ...defaultProps,
                notes: ["Single note"],
            };

            const response = new FeeEstimateResponse(props);

            expect(response.notes).to.deep.equal(["Single note"]);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create from protobuf with all fields", function () {
            const protoObj = {
                mode: FeeEstimateMode.INTRINSIC,
                network: {
                    multiplier: 1.5,
                    subtotal: Long.fromNumber(800),
                },
                node: {
                    base: Long.fromNumber(400),
                    extras: [
                        {
                            name: "protoNodeExtra",
                            included: 1,
                            count: 2,
                            charged: 1,
                            feePerUnit: 200,
                            subtotal: 200,
                        },
                    ],
                },
                service: {
                    base: Long.fromNumber(600),
                    extras: [],
                },
                notes: ["Proto note 1", "Proto note 2"],
                total: Long.fromNumber(1800),
            };

            const response = FeeEstimateResponse._fromProtobuf(protoObj);

            expect(response.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(response.networkFee.multiplier).to.equal(1.5);
            expect(response.networkFee.subtotal.toNumber()).to.equal(800);
            expect(response.nodeFee.base.toNumber()).to.equal(400);
            expect(response.nodeFee.extras).to.have.lengthOf(1);
            expect(response.nodeFee.extras[0].name).to.equal("protoNodeExtra");
            expect(response.serviceFee.base.toNumber()).to.equal(600);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.notes).to.deep.equal([
                "Proto note 1",
                "Proto note 2",
            ]);
            expect(response.total.toNumber()).to.equal(1800);
        });

        it("should handle missing fields in protobuf", function () {
            const protoObj = {
                mode: FeeEstimateMode.STATE,
                total: Long.fromNumber(1000),
            };

            const response = FeeEstimateResponse._fromProtobuf(protoObj);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
            expect(response.networkFee.multiplier).to.equal(0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(0);
            expect(response.nodeFee.base.toNumber()).to.equal(0);
            expect(response.nodeFee.extras).to.have.lengthOf(0);
            expect(response.serviceFee.base.toNumber()).to.equal(0);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.notes).to.deep.equal([]);
            expect(response.total.toNumber()).to.equal(1000);
        });

        it("should handle null/undefined fields in protobuf", function () {
            const protoObj = {
                mode: null,
                network: null,
                node: null,
                service: null,
                notes: null,
                total: null,
            };

            const response = FeeEstimateResponse._fromProtobuf(protoObj);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
            expect(response.networkFee.multiplier).to.equal(0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(0);
            expect(response.nodeFee.base.toNumber()).to.equal(0);
            expect(response.nodeFee.extras).to.have.lengthOf(0);
            expect(response.serviceFee.base.toNumber()).to.equal(0);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.notes).to.deep.equal([]);
            expect(response.total.toNumber()).to.equal(0);
        });

        it("should handle empty protobuf object", function () {
            const protoObj = {};

            const response = FeeEstimateResponse._fromProtobuf(protoObj);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
            expect(response.networkFee.multiplier).to.equal(0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(0);
            expect(response.nodeFee.base.toNumber()).to.equal(0);
            expect(response.nodeFee.extras).to.have.lengthOf(0);
            expect(response.serviceFee.base.toNumber()).to.equal(0);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.notes).to.deep.equal([]);
            expect(response.total.toNumber()).to.equal(0);
        });

        it("should default to STATE mode when mode is null", function () {
            const protoObj = {
                mode: null,
                total: Long.fromNumber(1000),
            };

            const response = FeeEstimateResponse._fromProtobuf(protoObj);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const response = new FeeEstimateResponse(defaultProps);
            const protoObj = response._toProtobuf();

            expect(protoObj.mode).to.equal(FeeEstimateMode.STATE);
            expect(protoObj.network.multiplier).to.equal(2.0);
            expect(protoObj.network.subtotal.toNumber()).to.equal(1000);
            expect(protoObj.node.base.toNumber()).to.equal(500);
            expect(protoObj.node.extras).to.have.lengthOf(1);
            expect(protoObj.node.extras[0].name).to.equal("nodeExtra");
            expect(protoObj.service.base.toNumber()).to.equal(750);
            expect(protoObj.service.extras).to.have.lengthOf(1);
            expect(protoObj.service.extras[0].name).to.equal("serviceExtra");
            expect(protoObj.notes).to.deep.equal([
                "Test note 1",
                "Test note 2",
            ]);
            expect(protoObj.total.toNumber()).to.equal(2250);
        });

        it("should convert to protobuf with empty notes", function () {
            const props = {
                ...defaultProps,
                notes: [],
            };

            const response = new FeeEstimateResponse(props);
            const protoObj = response._toProtobuf();

            expect(protoObj.notes).to.deep.equal([]);
        });

        it("should convert to protobuf with zero values", function () {
            const zeroNetworkFee = new NetworkFee({
                multiplier: 0,
                subtotal: 0,
            });

            const zeroNodeFee = new FeeEstimate({
                base: 0,
                extras: [],
            });

            const zeroServiceFee = new FeeEstimate({
                base: 0,
                extras: [],
            });

            const props = {
                mode: FeeEstimateMode.STATE,
                networkFee: zeroNetworkFee,
                nodeFee: zeroNodeFee,
                serviceFee: zeroServiceFee,
                notes: [],
                total: 0,
            };

            const response = new FeeEstimateResponse(props);
            const protoObj = response._toProtobuf();

            expect(protoObj.mode).to.equal(FeeEstimateMode.STATE);
            expect(protoObj.network.multiplier).to.equal(0);
            expect(protoObj.network.subtotal.toNumber()).to.equal(0);
            expect(protoObj.node.base.toNumber()).to.equal(0);
            expect(protoObj.node.extras).to.have.lengthOf(0);
            expect(protoObj.service.base.toNumber()).to.equal(0);
            expect(protoObj.service.extras).to.have.lengthOf(0);
            expect(protoObj.notes).to.deep.equal([]);
            expect(protoObj.total.toNumber()).to.equal(0);
        });
    });

    describe("round-trip conversion", function () {
        it("should maintain data integrity through protobuf conversion", function () {
            const original = new FeeEstimateResponse(defaultProps);
            const protoObj = original._toProtobuf();
            const converted = FeeEstimateResponse._fromProtobuf(protoObj);

            expect(converted.mode).to.equal(original.mode);
            expect(converted.networkFee.multiplier).to.equal(
                original.networkFee.multiplier,
            );
            expect(converted.networkFee.subtotal.toNumber()).to.equal(
                original.networkFee.subtotal.toNumber(),
            );
            expect(converted.nodeFee.base.toNumber()).to.equal(
                original.nodeFee.base.toNumber(),
            );
            expect(converted.nodeFee.extras).to.have.lengthOf(
                original.nodeFee.extras.length,
            );
            expect(converted.serviceFee.base.toNumber()).to.equal(
                original.serviceFee.base.toNumber(),
            );
            expect(converted.serviceFee.extras).to.have.lengthOf(
                original.serviceFee.extras.length,
            );
            expect(converted.notes).to.deep.equal(original.notes);
            expect(converted.total.toNumber()).to.equal(
                original.total.toNumber(),
            );
        });

        it("should handle edge cases in round-trip conversion", function () {
            const edgeCases = [
                {
                    mode: FeeEstimateMode.STATE,
                    networkFee: new NetworkFee({ multiplier: 0, subtotal: 0 }),
                    nodeFee: new FeeEstimate({ base: 0, extras: [] }),
                    serviceFee: new FeeEstimate({ base: 0, extras: [] }),
                    notes: [],
                    total: 0,
                },
                {
                    mode: FeeEstimateMode.INTRINSIC,
                    networkFee: new NetworkFee({ multiplier: 1, subtotal: 1 }),
                    nodeFee: new FeeEstimate({ base: 1, extras: [] }),
                    serviceFee: new FeeEstimate({ base: 1, extras: [] }),
                    notes: ["Single note"],
                    total: 1,
                },
            ];

            edgeCases.forEach((props, index) => {
                const original = new FeeEstimateResponse(props);
                const protoObj = original._toProtobuf();
                const converted = FeeEstimateResponse._fromProtobuf(protoObj);

                expect(converted.mode).to.equal(original.mode);
                expect(converted.total.toNumber()).to.equal(
                    original.total.toNumber(),
                );
                expect(converted.notes).to.deep.equal(original.notes);
            });
        });
    });

    describe("readonly properties", function () {
        it("should have readonly properties", function () {
            const response = new FeeEstimateResponse(defaultProps);

            // Properties should be defined
            expect(response.mode).to.not.be.undefined;
            expect(response.networkFee).to.not.be.undefined;
            expect(response.nodeFee).to.not.be.undefined;
            expect(response.serviceFee).to.not.be.undefined;
            expect(response.notes).to.not.be.undefined;
            expect(response.total).to.not.be.undefined;

            // Properties should have expected types
            expect(typeof response.mode).to.equal("number");
            expect(response.networkFee).to.be.instanceOf(NetworkFee);
            expect(response.nodeFee).to.be.instanceOf(FeeEstimate);
            expect(response.serviceFee).to.be.instanceOf(FeeEstimate);
            expect(response.notes).to.be.instanceOf(Array);
            expect(response.total).to.be.instanceOf(Long);
        });
    });

    describe("notes handling", function () {
        it("should handle multiple notes correctly", function () {
            const notes = [
                "First note",
                "Second note",
                "Third note",
                "Fourth note",
            ];

            const props = {
                ...defaultProps,
                notes: notes,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.notes).to.have.lengthOf(4);
            expect(response.notes[0]).to.equal("First note");
            expect(response.notes[1]).to.equal("Second note");
            expect(response.notes[2]).to.equal("Third note");
            expect(response.notes[3]).to.equal("Fourth note");
        });

        it("should handle empty string notes", function () {
            const props = {
                ...defaultProps,
                notes: ["", "Valid note", ""],
            };

            const response = new FeeEstimateResponse(props);

            expect(response.notes).to.have.lengthOf(3);
            expect(response.notes[0]).to.equal("");
            expect(response.notes[1]).to.equal("Valid note");
            expect(response.notes[2]).to.equal("");
        });

        it("should preserve notes order", function () {
            const notes = ["First", "Second", "Third"];

            const props = {
                ...defaultProps,
                notes: notes,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.notes[0]).to.equal("First");
            expect(response.notes[1]).to.equal("Second");
            expect(response.notes[2]).to.equal("Third");
        });
    });

    describe("mode handling", function () {
        it("should handle STATE mode", function () {
            const props = {
                ...defaultProps,
                mode: FeeEstimateMode.STATE,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
        });

        it("should handle INTRINSIC mode", function () {
            const props = {
                ...defaultProps,
                mode: FeeEstimateMode.INTRINSIC,
            };

            const response = new FeeEstimateResponse(props);

            expect(response.mode).to.equal(FeeEstimateMode.INTRINSIC);
        });

        it("should handle numeric mode values", function () {
            const props = {
                ...defaultProps,
                mode: 0, // STATE
            };

            const response = new FeeEstimateResponse(props);

            expect(response.mode).to.equal(0);
        });
    });
});
