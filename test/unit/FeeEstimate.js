import FeeEstimate from "../../src/query/FeeEstimate.js";
import FeeExtra from "../../src/query/FeeExtra.js";
import Long from "long";

describe("FeeEstimate", function () {
    let defaultProps;
    let mockFeeExtra1;
    let mockFeeExtra2;

    beforeEach(function () {
        mockFeeExtra1 = new FeeExtra({
            name: "extra1",
            included: 5,
            count: 10,
            charged: 5,
            feePerUnit: 100,
            subtotal: 500,
        });

        mockFeeExtra2 = new FeeExtra({
            name: "extra2",
            included: 2,
            count: 8,
            charged: 6,
            feePerUnit: 50,
            subtotal: 300,
        });

        defaultProps = {
            base: Long.fromNumber(1000),
            extras: [mockFeeExtra1, mockFeeExtra2],
        };
    });

    describe("constructor", function () {
        it("should create with all required props", function () {
            const feeEstimate = new FeeEstimate(defaultProps);

            expect(feeEstimate.base.toNumber()).to.equal(1000);
            expect(feeEstimate.extras).to.have.lengthOf(2);
            expect(feeEstimate.extras[0]).to.equal(mockFeeExtra1);
            expect(feeEstimate.extras[1]).to.equal(mockFeeExtra2);
        });

        it("should handle number values for base", function () {
            const props = {
                base: 500,
                extras: [],
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.base.toNumber()).to.equal(500);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle string values for base", function () {
            const props = {
                base: "1500",
                extras: [],
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.base.toNumber()).to.equal(1500);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle empty extras array", function () {
            const props = {
                base: 2000,
                extras: [],
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.base.toNumber()).to.equal(2000);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle undefined extras", function () {
            const props = {
                base: 2000,
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.base.toNumber()).to.equal(2000);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle zero base", function () {
            const props = {
                base: 0,
                extras: [],
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.base.toNumber()).to.equal(0);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle single extra", function () {
            const props = {
                base: 1000,
                extras: [mockFeeExtra1],
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.base.toNumber()).to.equal(1000);
            expect(feeEstimate.extras).to.have.lengthOf(1);
            expect(feeEstimate.extras[0]).to.equal(mockFeeExtra1);
        });
    });

    describe("_fromProtobuf", function () {
        it("should create from protobuf with all fields", function () {
            const protoObj = {
                base: Long.fromNumber(2000),
                extras: [
                    {
                        name: "protoExtra1",
                        included: 3,
                        count: 6,
                        charged: 3,
                        feePerUnit: 200,
                        subtotal: 600,
                    },
                    {
                        name: "protoExtra2",
                        included: 1,
                        count: 5,
                        charged: 4,
                        feePerUnit: 75,
                        subtotal: 300,
                    },
                ],
            };

            const feeEstimate = FeeEstimate._fromProtobuf(protoObj);

            expect(feeEstimate.base.toNumber()).to.equal(2000);
            expect(feeEstimate.extras).to.have.lengthOf(2);
            expect(feeEstimate.extras[0].name).to.equal("protoExtra1");
            expect(feeEstimate.extras[1].name).to.equal("protoExtra2");
        });

        it("should handle missing fields in protobuf", function () {
            const protoObj = {
                base: Long.fromNumber(1000),
            };

            const feeEstimate = FeeEstimate._fromProtobuf(protoObj);

            expect(feeEstimate.base.toNumber()).to.equal(1000);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle null/undefined fields in protobuf", function () {
            const protoObj = {
                base: null,
                extras: undefined,
            };

            const feeEstimate = FeeEstimate._fromProtobuf(protoObj);

            expect(feeEstimate.base.toNumber()).to.equal(0);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle empty protobuf object", function () {
            const protoObj = {};

            const feeEstimate = FeeEstimate._fromProtobuf(protoObj);

            expect(feeEstimate.base.toNumber()).to.equal(0);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle empty extras array in protobuf", function () {
            const protoObj = {
                base: Long.fromNumber(500),
                extras: [],
            };

            const feeEstimate = FeeEstimate._fromProtobuf(protoObj);

            expect(feeEstimate.base.toNumber()).to.equal(500);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle null extras in protobuf", function () {
            const protoObj = {
                base: Long.fromNumber(500),
                extras: null,
            };

            const feeEstimate = FeeEstimate._fromProtobuf(protoObj);

            expect(feeEstimate.base.toNumber()).to.equal(500);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const feeEstimate = new FeeEstimate(defaultProps);
            const protoObj = feeEstimate._toProtobuf();

            expect(protoObj.base.toNumber()).to.equal(1000);
            expect(protoObj.extras).to.have.lengthOf(2);
            expect(protoObj.extras[0].name).to.equal("extra1");
            expect(protoObj.extras[1].name).to.equal("extra2");
        });

        it("should convert to protobuf with empty extras", function () {
            const props = {
                base: 500,
                extras: [],
            };

            const feeEstimate = new FeeEstimate(props);
            const protoObj = feeEstimate._toProtobuf();

            expect(protoObj.base.toNumber()).to.equal(500);
            expect(protoObj.extras).to.have.lengthOf(0);
        });

        it("should convert to protobuf with zero base", function () {
            const props = {
                base: 0,
                extras: [],
            };

            const feeEstimate = new FeeEstimate(props);
            const protoObj = feeEstimate._toProtobuf();

            expect(protoObj.base.toNumber()).to.equal(0);
            expect(protoObj.extras).to.have.lengthOf(0);
        });

        it("should convert to protobuf with large values", function () {
            const largeExtra = new FeeExtra({
                name: "largeExtra",
                included: 1000000,
                count: 2000000,
                charged: 1000000,
                feePerUnit: Long.fromString("9223372036854775807"),
                subtotal: Long.fromString("9223372036854775807"),
            });

            const props = {
                base: Long.fromString("9223372036854775807"),
                extras: [largeExtra],
            };

            const feeEstimate = new FeeEstimate(props);
            const protoObj = feeEstimate._toProtobuf();

            expect(protoObj.base.toString()).to.equal("9223372036854775807");
            expect(protoObj.extras).to.have.lengthOf(1);
            expect(protoObj.extras[0].name).to.equal("largeExtra");
        });
    });

    describe("round-trip conversion", function () {
        it("should maintain data integrity through protobuf conversion", function () {
            const original = new FeeEstimate(defaultProps);
            const protoObj = original._toProtobuf();
            const converted = FeeEstimate._fromProtobuf(protoObj);

            expect(converted.base.toNumber()).to.equal(
                original.base.toNumber(),
            );
            expect(converted.extras).to.have.lengthOf(original.extras.length);
            expect(converted.extras[0].name).to.equal(original.extras[0].name);
            expect(converted.extras[1].name).to.equal(original.extras[1].name);
        });

        it("should handle edge cases in round-trip conversion", function () {
            const edgeCases = [
                {
                    base: 0,
                    extras: [],
                },
                {
                    base: 1,
                    extras: [],
                },
                {
                    base: Long.fromString("9223372036854775807"),
                    extras: [],
                },
                {
                    base: 1000,
                    extras: [
                        new FeeExtra({
                            name: "",
                            included: 0,
                            count: 0,
                            charged: 0,
                            feePerUnit: 0,
                            subtotal: 0,
                        }),
                    ],
                },
            ];

            edgeCases.forEach((props, index) => {
                const original = new FeeEstimate(props);
                const protoObj = original._toProtobuf();
                const converted = FeeEstimate._fromProtobuf(protoObj);

                expect(converted.base.toNumber()).to.equal(
                    original.base.toNumber(),
                );
                expect(converted.extras).to.have.lengthOf(
                    original.extras.length,
                );
            });
        });
    });

    describe("readonly properties", function () {
        it("should have readonly properties", function () {
            const feeEstimate = new FeeEstimate(defaultProps);

            // Properties should be defined
            expect(feeEstimate.base).to.not.be.undefined;
            expect(feeEstimate.extras).to.not.be.undefined;

            // Properties should have expected types
            expect(feeEstimate.base).to.be.instanceOf(Long);
            expect(feeEstimate.extras).to.be.instanceOf(Array);
        });
    });

    describe("extras array handling", function () {
        it("should handle multiple extras correctly", function () {
            const extras = [
                new FeeExtra({
                    name: "extra1",
                    included: 1,
                    count: 2,
                    charged: 1,
                    feePerUnit: 100,
                    subtotal: 100,
                }),
                new FeeExtra({
                    name: "extra2",
                    included: 3,
                    count: 5,
                    charged: 2,
                    feePerUnit: 200,
                    subtotal: 400,
                }),
                new FeeExtra({
                    name: "extra3",
                    included: 0,
                    count: 1,
                    charged: 1,
                    feePerUnit: 50,
                    subtotal: 50,
                }),
            ];

            const props = {
                base: 1000,
                extras: extras,
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.extras).to.have.lengthOf(3);
            expect(feeEstimate.extras[0].name).to.equal("extra1");
            expect(feeEstimate.extras[1].name).to.equal("extra2");
            expect(feeEstimate.extras[2].name).to.equal("extra3");
        });

        it("should preserve extras order", function () {
            const extras = [
                new FeeExtra({
                    name: "first",
                    included: 1,
                    count: 1,
                    charged: 0,
                    feePerUnit: 100,
                    subtotal: 0,
                }),
                new FeeExtra({
                    name: "second",
                    included: 1,
                    count: 1,
                    charged: 0,
                    feePerUnit: 200,
                    subtotal: 0,
                }),
                new FeeExtra({
                    name: "third",
                    included: 1,
                    count: 1,
                    charged: 0,
                    feePerUnit: 300,
                    subtotal: 0,
                }),
            ];

            const props = {
                base: 1000,
                extras: extras,
            };

            const feeEstimate = new FeeEstimate(props);

            expect(feeEstimate.extras[0].name).to.equal("first");
            expect(feeEstimate.extras[1].name).to.equal("second");
            expect(feeEstimate.extras[2].name).to.equal("third");
        });
    });
});
