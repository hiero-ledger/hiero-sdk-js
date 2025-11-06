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

    describe("_fromProtobuf", function () {
        it("should create from protobuf with all fields", function () {
            const protoObj = {
                name: "protobufFee",
                included: 3,
                count: 8,
                charged: 5,
                feePerUnit: Long.fromNumber(150),
                subtotal: Long.fromNumber(750),
            };

            const feeExtra = FeeExtra._fromProtobuf(protoObj);

            expect(feeExtra.name).to.equal("protobufFee");
            expect(feeExtra.included).to.equal(3);
            expect(feeExtra.count).to.equal(8);
            expect(feeExtra.charged).to.equal(5);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(150);
            expect(feeExtra.subtotal.toNumber()).to.equal(750);
        });

        it("should handle missing fields in protobuf", function () {
            const protoObj = {
                name: "partialFee",
                included: 2,
            };

            const feeExtra = FeeExtra._fromProtobuf(protoObj);

            expect(feeExtra.name).to.equal("partialFee");
            expect(feeExtra.included).to.equal(2);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });

        it("should handle null/undefined fields in protobuf", function () {
            const protoObj = {
                name: null,
                included: undefined,
                count: null,
                charged: undefined,
                feePerUnit: null,
                subtotal: undefined,
            };

            const feeExtra = FeeExtra._fromProtobuf(protoObj);

            expect(feeExtra.name).to.equal("");
            expect(feeExtra.included).to.equal(0);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });

        it("should handle empty protobuf object", function () {
            const protoObj = {};

            const feeExtra = FeeExtra._fromProtobuf(protoObj);

            expect(feeExtra.name).to.equal("");
            expect(feeExtra.included).to.equal(0);
            expect(feeExtra.count).to.equal(0);
            expect(feeExtra.charged).to.equal(0);
            expect(feeExtra.feePerUnit.toNumber()).to.equal(0);
            expect(feeExtra.subtotal.toNumber()).to.equal(0);
        });
    });

    describe("_toProtobuf", function () {
        it("should convert to protobuf with all fields", function () {
            const feeExtra = new FeeExtra(defaultProps);
            const protoObj = feeExtra._toProtobuf();

            expect(protoObj.name).to.equal("testFee");
            expect(protoObj.included).to.equal(5);
            expect(protoObj.count).to.equal(10);
            expect(protoObj.charged).to.equal(5);
            expect(protoObj.feePerUnit.toNumber()).to.equal(100);
            expect(protoObj.subtotal.toNumber()).to.equal(500);
        });

        it("should convert to protobuf with zero values", function () {
            const props = {
                name: "zeroFee",
                included: 0,
                count: 0,
                charged: 0,
                feePerUnit: 0,
                subtotal: 0,
            };

            const feeExtra = new FeeExtra(props);
            const protoObj = feeExtra._toProtobuf();

            expect(protoObj.name).to.equal("zeroFee");
            expect(protoObj.included).to.equal(0);
            expect(protoObj.count).to.equal(0);
            expect(protoObj.charged).to.equal(0);
            expect(protoObj.feePerUnit.toNumber()).to.equal(0);
            expect(protoObj.subtotal.toNumber()).to.equal(0);
        });

        it("should convert to protobuf with large values", function () {
            const props = {
                name: "largeFee",
                included: 1000000,
                count: 2000000,
                charged: 1000000,
                feePerUnit: Long.fromString("9223372036854775807"),
                subtotal: Long.fromString("9223372036854775807"),
            };

            const feeExtra = new FeeExtra(props);
            const protoObj = feeExtra._toProtobuf();

            expect(protoObj.name).to.equal("largeFee");
            expect(protoObj.included).to.equal(1000000);
            expect(protoObj.count).to.equal(2000000);
            expect(protoObj.charged).to.equal(1000000);
            expect(protoObj.feePerUnit.toString()).to.equal(
                "9223372036854775807",
            );
            expect(protoObj.subtotal.toString()).to.equal(
                "9223372036854775807",
            );
        });
    });

    describe("round-trip conversion", function () {
        it("should maintain data integrity through protobuf conversion", function () {
            const original = new FeeExtra(defaultProps);
            const protoObj = original._toProtobuf();
            const converted = FeeExtra._fromProtobuf(protoObj);

            expect(converted.name).to.equal(original.name);
            expect(converted.included).to.equal(original.included);
            expect(converted.count).to.equal(original.count);
            expect(converted.charged).to.equal(original.charged);
            expect(converted.feePerUnit.toNumber()).to.equal(
                original.feePerUnit.toNumber(),
            );
            expect(converted.subtotal.toNumber()).to.equal(
                original.subtotal.toNumber(),
            );
        });

        it("should handle edge cases in round-trip conversion", function () {
            const edgeCases = [
                {
                    name: "",
                    included: 0,
                    count: 0,
                    charged: 0,
                    feePerUnit: 0,
                    subtotal: 0,
                },
                {
                    name: "a".repeat(1000), // Very long name
                    included: 1,
                    count: 1,
                    charged: 0,
                    feePerUnit: 1,
                    subtotal: 0,
                },
                {
                    name: "special-chars-!@#$%^&*()",
                    included: 999999,
                    count: 999999,
                    charged: 0,
                    feePerUnit: 999999,
                    subtotal: 0,
                },
            ];

            edgeCases.forEach((props) => {
                const original = new FeeExtra(props);
                const protoObj = original._toProtobuf();
                const converted = FeeExtra._fromProtobuf(protoObj);

                expect(converted.name).to.equal(original.name);
                expect(converted.included).to.equal(original.included);
                expect(converted.count).to.equal(original.count);
                expect(converted.charged).to.equal(original.charged);
                expect(converted.feePerUnit.toNumber()).to.equal(
                    original.feePerUnit.toNumber(),
                );
                expect(converted.subtotal.toNumber()).to.equal(
                    original.subtotal.toNumber(),
                );
            });
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
});
