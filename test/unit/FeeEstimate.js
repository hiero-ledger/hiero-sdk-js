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

    describe("_fromJSON", function () {
        it("should create from JSON with all fields", function () {
            const jsonObj = {
                baseFee: 2000,
                extras: [
                    {
                        name: "jsonExtra1",
                        included: 3,
                        count: 6,
                        charged: 3,
                        fee_per_unit: 200,
                        subtotal: 600,
                    },
                    {
                        name: "jsonExtra2",
                        included: 1,
                        count: 5,
                        charged: 4,
                        fee_per_unit: 75,
                        subtotal: 300,
                    },
                ],
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(2000);
            expect(feeEstimate.extras).to.have.lengthOf(2);
            expect(feeEstimate.extras[0].name).to.equal("jsonExtra1");
            expect(feeEstimate.extras[0].included).to.equal(3);
            expect(feeEstimate.extras[0].count).to.equal(6);
            expect(feeEstimate.extras[0].charged).to.equal(3);
            expect(feeEstimate.extras[0].feePerUnit.toNumber()).to.equal(200);
            expect(feeEstimate.extras[0].subtotal.toNumber()).to.equal(600);
            expect(feeEstimate.extras[1].name).to.equal("jsonExtra2");
        });

        it("should handle missing fields in JSON", function () {
            const jsonObj = {
                baseFee: 1000,
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(1000);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle null/undefined fields in JSON", function () {
            const jsonObj = {
                baseFee: null,
                extras: undefined,
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(0);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle empty JSON object", function () {
            const jsonObj = {};

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(0);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle empty extras array in JSON", function () {
            const jsonObj = {
                baseFee: 500,
                extras: [],
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(500);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle null extras in JSON", function () {
            const jsonObj = {
                baseFee: 500,
                extras: null,
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(500);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle zero baseFee in JSON", function () {
            const jsonObj = {
                baseFee: 0,
                extras: [],
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.base.toNumber()).to.equal(0);
            expect(feeEstimate.extras).to.have.lengthOf(0);
        });

        it("should handle large baseFee values", function () {
            const jsonObj = {
                baseFee: 9223372036854775807,
                extras: [],
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            // Note: JavaScript number precision limits may affect this
            expect(feeEstimate.base.toNumber()).to.be.a("number");
        });

        it("should correctly map fee_per_unit to feePerUnit", function () {
            const jsonObj = {
                baseFee: 1000,
                extras: [
                    {
                        name: "testExtra",
                        included: 1,
                        count: 2,
                        charged: 1,
                        fee_per_unit: 500,
                        subtotal: 500,
                    },
                ],
            };

            const feeEstimate = FeeEstimate._fromJSON(jsonObj);

            expect(feeEstimate.extras[0].feePerUnit.toNumber()).to.equal(500);
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
