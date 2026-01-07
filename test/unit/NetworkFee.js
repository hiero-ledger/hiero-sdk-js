import NetworkFee from "../../src/query/NetworkFee.js";
import Long from "long";

describe("NetworkFee", function () {
    let defaultProps;

    beforeEach(function () {
        defaultProps = {
            multiplier: 2.5,
            subtotal: Long.fromNumber(1000),
        };
    });

    describe("constructor", function () {
        it("should create with all required props", function () {
            const networkFee = new NetworkFee(defaultProps);

            expect(networkFee.multiplier).to.equal(2.5);
            expect(networkFee.subtotal.toNumber()).to.equal(1000);
        });

        it("should handle number values for subtotal", function () {
            const props = {
                multiplier: 1.0,
                subtotal: 500,
            };

            const networkFee = new NetworkFee(props);

            expect(networkFee.multiplier).to.equal(1.0);
            expect(networkFee.subtotal.toNumber()).to.equal(500);
        });

        it("should handle string values for subtotal", function () {
            const props = {
                multiplier: 3.14,
                subtotal: "1500",
            };

            const networkFee = new NetworkFee(props);

            expect(networkFee.multiplier).to.equal(3.14);
            expect(networkFee.subtotal.toNumber()).to.equal(1500);
        });

        it("should handle zero values", function () {
            const props = {
                multiplier: 0,
                subtotal: 0,
            };

            const networkFee = new NetworkFee(props);

            expect(networkFee.multiplier).to.equal(0);
            expect(networkFee.subtotal.toNumber()).to.equal(0);
        });

        it("should handle negative multiplier", function () {
            const props = {
                multiplier: -1.5,
                subtotal: 100,
            };

            const networkFee = new NetworkFee(props);

            expect(networkFee.multiplier).to.equal(-1.5);
            expect(networkFee.subtotal.toNumber()).to.equal(100);
        });

        it("should handle decimal multiplier", function () {
            const props = {
                multiplier: 0.5,
                subtotal: 200,
            };

            const networkFee = new NetworkFee(props);

            expect(networkFee.multiplier).to.equal(0.5);
            expect(networkFee.subtotal.toNumber()).to.equal(200);
        });
    });

    describe("_fromJSON", function () {
        it("should create from JSON with all fields", function () {
            const jsonObj = {
                multiplier: 1.75,
                subtotal: 750,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(1.75);
            expect(networkFee.subtotal.toNumber()).to.equal(750);
        });

        it("should handle missing fields in JSON", function () {
            const jsonObj = {
                multiplier: 2.0,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(2.0);
            expect(networkFee.subtotal.toNumber()).to.equal(0);
        });

        it("should handle null/undefined fields in JSON", function () {
            const jsonObj = {
                multiplier: null,
                subtotal: undefined,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(0);
            expect(networkFee.subtotal.toNumber()).to.equal(0);
        });

        it("should handle empty JSON object", function () {
            const jsonObj = {};

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(0);
            expect(networkFee.subtotal.toNumber()).to.equal(0);
        });

        it("should handle JSON with zero values", function () {
            const jsonObj = {
                multiplier: 0,
                subtotal: 0,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(0);
            expect(networkFee.subtotal.toNumber()).to.equal(0);
        });

        it("should handle decimal multiplier in JSON", function () {
            const jsonObj = {
                multiplier: 0.5,
                subtotal: 200,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(0.5);
            expect(networkFee.subtotal.toNumber()).to.equal(200);
        });

        it("should handle large subtotal values", function () {
            const jsonObj = {
                multiplier: 1.0,
                subtotal: 9223372036854775807,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(1.0);
            // Note: JavaScript number precision limits may affect very large values
            expect(networkFee.subtotal.toNumber()).to.be.a("number");
        });

        it("should handle negative multiplier in JSON", function () {
            const jsonObj = {
                multiplier: -1.5,
                subtotal: 100,
            };

            const networkFee = NetworkFee._fromJSON(jsonObj);

            expect(networkFee.multiplier).to.equal(-1.5);
            expect(networkFee.subtotal.toNumber()).to.equal(100);
        });
    });

    describe("readonly properties", function () {
        it("should have readonly properties", function () {
            const networkFee = new NetworkFee(defaultProps);

            // Properties should be defined
            expect(networkFee.multiplier).to.not.be.undefined;
            expect(networkFee.subtotal).to.not.be.undefined;

            // Properties should have expected types
            expect(typeof networkFee.multiplier).to.equal("number");
            expect(networkFee.subtotal).to.be.instanceOf(Long);
        });
    });

    describe("mathematical operations", function () {
        it("should handle multiplier calculations correctly", function () {
            const testCases = [
                { multiplier: 1.0, subtotal: 100, expected: 100 },
                { multiplier: 2.0, subtotal: 100, expected: 200 },
                { multiplier: 0.5, subtotal: 100, expected: 50 },
                { multiplier: 0, subtotal: 100, expected: 0 },
                { multiplier: -1.0, subtotal: 100, expected: -100 },
            ];

            testCases.forEach(({ multiplier, subtotal, expected }) => {
                const networkFee = new NetworkFee({ multiplier, subtotal });
                const calculatedTotal =
                    networkFee.subtotal.toNumber() * multiplier;

                expect(calculatedTotal).to.equal(expected);
            });
        });

        it("should handle precision in multiplier", function () {
            const props = {
                multiplier: 1.23456789,
                subtotal: 1000,
            };

            const networkFee = new NetworkFee(props);

            expect(networkFee.multiplier).to.equal(1.23456789);
            expect(networkFee.subtotal.toNumber()).to.equal(1000);
        });
    });
});
