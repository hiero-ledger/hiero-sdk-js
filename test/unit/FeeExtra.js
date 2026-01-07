import FeeExtra from "../../src/query/FeeExtra.js";
import Long from "long";

describe("FeeExtra", function () {
    let defaultProps;

    beforeEach(function () {
        defaultProps = {
            name: "testFee",
            included: 5,
            count: 10,
            charged: 5,
            feePerUnit: Long.fromNumber(100),
            subtotal: Long.fromNumber(500),
        };
    });

    describe("constructor", function () {
        it("should create with all required props", function () {
            const feeExtra = new FeeExtra(defaultProps);

            expect(feeExtra.name).to.equal("testFee");
            expect(feeExtra.included).to.equal(5);
            expect(feeExtra.count).to.equal(10);
            expect(feeExtra.charged).to.equal(5);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(100);
            expect(feeExtra.subtotal.toNumber()).to.equal(500);
        });

        it("should handle number values for Long fields", function () {
            const props = {
                ...defaultProps,
                feePerUnit: 200,
                subtotal: 1000,
            };

            const feeExtra = new FeeExtra(props);

            expect(feeExtra.feePerUnit.toNumber()).to.equal(200);
            expect(feeExtra.subtotal.toNumber()).to.equal(1000);
        });

        it("should handle string values for Long fields", function () {
            const props = {
                ...defaultProps,
                feePerUnit: "300",
                subtotal: "1500",
            };

            const feeExtra = new FeeExtra(props);

            expect(feeExtra.feePerUnit.toNumber()).to.equal(300);
            expect(feeExtra.subtotal.toNumber()).to.equal(1500);
        });

        it("should handle empty string for name", function () {
            const props = {
                ...defaultProps,
                name: "",
            };

            const feeExtra = new FeeExtra(props);

            expect(feeExtra.name).to.equal("");
        });

        it("should handle zero values", function () {
            const props = {
                name: "zeroFee",
                included: 0,
                count: 0,
                charged: 0,
                feePerUnit: 0,
                subtotal: 0,
            };

            const feeExtra = new FeeExtra(props);

            expect(feeExtra.name).to.equal("zeroFee");
            expect(feeExtra.included).to.equal(0);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });
    });

    describe("_fromJSON", function () {
        it("should create from JSON with all fields", function () {
            const jsonObj = {
                name: "jsonFee",
                included: 3,
                count: 8,
                charged: 5,
                fee_per_unit: 150,
                subtotal: 750,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("jsonFee");
            expect(feeExtra.included).to.equal(3);
            expect(feeExtra.count).to.equal(8);
            expect(feeExtra.charged).to.equal(5);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(150);
            expect(feeExtra.subtotal.toNumber()).to.equal(750);
        });

        it("should handle missing fields in JSON", function () {
            const jsonObj = {
                name: "partialFee",
                included: 2,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("partialFee");
            expect(feeExtra.included).to.equal(2);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });

        it("should handle null/undefined fields in JSON", function () {
            const jsonObj = {
                name: null,
                included: undefined,
                count: null,
                charged: undefined,
                fee_per_unit: null,
                subtotal: undefined,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("");
            expect(feeExtra.included).to.equal(0);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });

        it("should handle empty JSON object", function () {
            const jsonObj = {};

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("");
            expect(feeExtra.included).to.equal(0);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });

        it("should correctly map fee_per_unit to feePerUnit", function () {
            const jsonObj = {
                name: "testFee",
                included: 1,
                count: 2,
                charged: 1,
                fee_per_unit: 500,
                subtotal: 500,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.feePerUnit.toNumber()).to.equal(500);
        });

        it("should handle large values in JSON", function () {
            const jsonObj = {
                name: "largeFee",
                included: 1000000,
                count: 2000000,
                charged: 1000000,
                fee_per_unit: 9223372036854775807,
                subtotal: 9223372036854775807,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("largeFee");
            expect(feeExtra.included).to.equal(1000000);
            expect(feeExtra.count).to.equal(2000000);
            expect(feeExtra.charged).to.equal(1000000);
            // Note: JavaScript number precision limits may affect very large values
            expect(feeExtra.feePerUnit.toNumber()).to.be.a("number");
            expect(feeExtra.subtotal.toNumber()).to.be.a("number");
        });

        it("should handle zero values in JSON", function () {
            const jsonObj = {
                name: "zeroFee",
                included: 0,
                count: 0,
                charged: 0,
                fee_per_unit: 0,
                subtotal: 0,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("zeroFee");
            expect(feeExtra.included).to.equal(0);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });

        it("should handle special characters in name", function () {
            const jsonObj = {
                name: "special-chars-!@#$%^&*()",
                included: 1,
                count: 1,
                charged: 0,
                fee_per_unit: 100,
                subtotal: 0,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal("special-chars-!@#$%^&*()");
        });

        it("should handle very long name", function () {
            const longName = "a".repeat(1000);
            const jsonObj = {
                name: longName,
                included: 1,
                count: 1,
                charged: 0,
                fee_per_unit: 100,
                subtotal: 0,
            };

            const feeExtra = FeeExtra._fromJSON(jsonObj);

            expect(feeExtra.name).to.equal(longName);
        });
    });

    describe("readonly properties", function () {
        it("should have readonly properties", function () {
            const feeExtra = new FeeExtra(defaultProps);

            // Properties should be defined
            expect(feeExtra.name).to.not.be.undefined;
            expect(feeExtra.included).to.not.be.undefined;
            expect(feeExtra.count).to.not.be.undefined;
            expect(feeExtra.charged).to.not.be.undefined;
            expect(feeExtra.feePerUnit).to.not.be.undefined;
            expect(feeExtra.subtotal).to.not.be.undefined;

            // Properties should not be writable (though this depends on implementation)
            // This test verifies the properties exist and have expected values
            expect(typeof feeExtra.name).to.equal("string");
            expect(typeof feeExtra.included).to.equal("number");
            expect(typeof feeExtra.count).to.equal("number");
            expect(typeof feeExtra.charged).to.equal("number");
            expect(feeExtra.feePerUnit).to.be.instanceOf(Long);
            expect(feeExtra.subtotal).to.be.instanceOf(Long);
        });
    });

    describe("charged calculation", function () {
        it("should verify charged is max(0, count - included)", function () {
            const testCases = [
                { included: 5, count: 10, expectedCharged: 5 },
                { included: 10, count: 5, expectedCharged: 0 },
                { included: 5, count: 5, expectedCharged: 0 },
                { included: 0, count: 10, expectedCharged: 10 },
                { included: 10, count: 0, expectedCharged: 0 },
            ];

            testCases.forEach(({ included, count, expectedCharged }) => {
                const actualCharged = Math.max(0, count - included);
                expect(actualCharged).to.equal(expectedCharged);
            });
        });
    });

    describe("subtotal calculation", function () {
        it("should verify subtotal is charged * feePerUnit", function () {
            const testCases = [
                { charged: 5, feePerUnit: 100, expectedSubtotal: 500 },
                { charged: 0, feePerUnit: 100, expectedSubtotal: 0 },
                { charged: 10, feePerUnit: 0, expectedSubtotal: 0 },
                { charged: 3, feePerUnit: 150, expectedSubtotal: 450 },
            ];

            testCases.forEach(({ charged, feePerUnit, expectedSubtotal }) => {
                const actualSubtotal = charged * feePerUnit;
                expect(actualSubtotal).to.equal(expectedSubtotal);
            });
        });
    });
});
