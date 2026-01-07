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

    describe("_fromJSON", function () {
        it("should create from JSON with all fields", function () {
            const jsonObj = {
                mode: "1",
                network: {
                    multiplier: 1.5,
                    subtotal: 800,
                },
                node: {
                    baseFee: 400,
                    extras: [
                        {
                            name: "jsonNodeExtra",
                            included: 1,
                            count: 2,
                            charged: 1,
                            fee_per_unit: 200,
                            subtotal: 200,
                        },
                    ],
                },
                service: {
                    baseFee: 600,
                    extras: [],
                },
                notes: ["JSON note 1", "JSON note 2"],
                total: 1800,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.mode).to.equal(1);
            expect(response.networkFee.multiplier).to.equal(1.5);
            expect(response.networkFee.subtotal.toNumber()).to.equal(800);
            expect(response.nodeFee.base.toNumber()).to.equal(400);
            expect(response.nodeFee.extras).to.have.lengthOf(1);
            expect(response.nodeFee.extras[0].name).to.equal("jsonNodeExtra");
            expect(response.nodeFee.extras[0].feePerUnit.toNumber()).to.equal(
                200,
            );
            expect(response.serviceFee.base.toNumber()).to.equal(600);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.notes).to.deep.equal([
                "JSON note 1",
                "JSON note 2",
            ]);
            expect(response.total.toNumber()).to.equal(1800);
        });

        it("should handle missing fields in JSON", function () {
            const jsonObj = {
                mode: "0",
                total: 1000,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.mode).to.equal(0);
            expect(response.networkFee.multiplier).to.equal(0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(0);
            expect(response.nodeFee.base.toNumber()).to.equal(0);
            expect(response.nodeFee.extras).to.have.lengthOf(0);
            expect(response.serviceFee.base.toNumber()).to.equal(0);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
            expect(response.notes).to.deep.equal([]);
            expect(response.total.toNumber()).to.equal(1000);
        });

        it("should handle null/undefined fields in JSON", function () {
            const jsonObj = {
                mode: null,
                network: null,
                node: null,
                service: null,
                notes: null,
                total: null,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

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

        it("should handle empty JSON object", function () {
            const jsonObj = {};

            const response = FeeEstimateResponse._fromJSON(jsonObj);

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
            const jsonObj = {
                mode: null,
                total: 1000,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.mode).to.equal(FeeEstimateMode.STATE);
        });

        it("should parse numeric string mode correctly", function () {
            const jsonObj = {
                mode: "1",
                total: 1000,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.mode).to.equal(1);
        });

        it("should handle network with all fields", function () {
            const jsonObj = {
                mode: "0",
                network: {
                    multiplier: 2.5,
                    subtotal: 1500,
                },
                total: 1500,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.networkFee.multiplier).to.equal(2.5);
            expect(response.networkFee.subtotal.toNumber()).to.equal(1500);
        });

        it("should handle node with multiple extras", function () {
            const jsonObj = {
                mode: "0",
                node: {
                    baseFee: 1000,
                    extras: [
                        {
                            name: "extra1",
                            included: 1,
                            count: 3,
                            charged: 2,
                            fee_per_unit: 100,
                            subtotal: 200,
                        },
                        {
                            name: "extra2",
                            included: 0,
                            count: 5,
                            charged: 5,
                            fee_per_unit: 50,
                            subtotal: 250,
                        },
                    ],
                },
                total: 1450,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.nodeFee.base.toNumber()).to.equal(1000);
            expect(response.nodeFee.extras).to.have.lengthOf(2);
            expect(response.nodeFee.extras[0].name).to.equal("extra1");
            expect(response.nodeFee.extras[0].charged).to.equal(2);
            expect(response.nodeFee.extras[1].name).to.equal("extra2");
            expect(response.nodeFee.extras[1].charged).to.equal(5);
        });

        it("should handle service with empty extras", function () {
            const jsonObj = {
                mode: "0",
                service: {
                    baseFee: 500,
                    extras: [],
                },
                total: 500,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.serviceFee.base.toNumber()).to.equal(500);
            expect(response.serviceFee.extras).to.have.lengthOf(0);
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

        it("should handle notes from JSON", function () {
            const jsonObj = {
                mode: "0",
                notes: ["Note from JSON 1", "Note from JSON 2"],
                total: 1000,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.notes).to.have.lengthOf(2);
            expect(response.notes[0]).to.equal("Note from JSON 1");
            expect(response.notes[1]).to.equal("Note from JSON 2");
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

        it("should handle mode from JSON string", function () {
            const jsonObj = {
                mode: "0",
                total: 1000,
            };

            const response = FeeEstimateResponse._fromJSON(jsonObj);

            expect(response.mode).to.equal(0);
        });
    });

    describe("complete JSON parsing", function () {
        it("should parse a realistic API response", function () {
            const apiResponse = {
                mode: "0",
                network: {
                    multiplier: 1.0,
                    subtotal: 5000,
                },
                node: {
                    baseFee: 2500,
                    extras: [
                        {
                            name: "CRYPTO_TRANSFER_BPT_FEE",
                            included: 25,
                            count: 30,
                            charged: 5,
                            fee_per_unit: 100,
                            subtotal: 500,
                        },
                    ],
                },
                service: {
                    baseFee: 2500,
                    extras: [],
                },
                notes: ["Estimated based on current network conditions"],
                total: 10500,
            };

            const response = FeeEstimateResponse._fromJSON(apiResponse);

            expect(response.mode).to.equal(0);
            expect(response.networkFee.multiplier).to.equal(1.0);
            expect(response.networkFee.subtotal.toNumber()).to.equal(5000);
            expect(response.nodeFee.base.toNumber()).to.equal(2500);
            expect(response.nodeFee.extras).to.have.lengthOf(1);
            expect(response.nodeFee.extras[0].name).to.equal(
                "CRYPTO_TRANSFER_BPT_FEE",
            );
            expect(response.serviceFee.base.toNumber()).to.equal(2500);
            expect(response.notes).to.have.lengthOf(1);
            expect(response.total.toNumber()).to.equal(10500);
        });
    });
});
