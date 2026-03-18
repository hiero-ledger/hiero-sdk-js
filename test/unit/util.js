import BigNumber from "bignumber.js";
import Long from "long";
import * as util from "../../src/util.js";

describe("util", function () {
    it("soft check: isNonNull should return false if null and true if non-null", function () {
        expect(util.isNonNull("")).to.eql(true);

        expect(util.isNonNull(null)).to.eql(false);
        expect(util.isNonNull(undefined)).to.eql(false);
    });

    it("soft check: isType should return true if params are the same type else false", function () {
        expect(util.isType("", "")).to.eql(true);
        expect(util.isType(null, null)).to.eql(true);
        expect(util.isType(undefined, undefined)).to.eql(true);

        expect(util.isType(undefined, null)).to.eql(false);
        expect(util.isType(1, "1")).to.eql(false);
    });

    it("soft check: isUint8Array should return true if instanceof Uint8Array and non-null", function () {
        expect(util.isUint8Array(new Uint8Array())).to.eql(true);

        expect(util.isUint8Array("")).to.eql(false);
        expect(util.isUint8Array(null)).to.eql(false);
    });

    it("soft check: isNumber should return true if type is number and non-null", function () {
        expect(util.isNumber(new Number())).to.eql(true);
        expect(util.isNumber(1)).to.eql(true);

        expect(util.isNumber(null)).to.eql(false);
        expect(util.isNumber("1")).to.eql(false);
    });

    it("soft check: isBigNumber should return true if instanceof BigNumber and non-null", function () {
        expect(util.isBigNumber(new BigNumber(11111))).to.eql(true);

        expect(util.isBigNumber(null)).to.eql(false);
        expect(util.isBigNumber("1")).to.eql(false);
    });

    it("soft check: isString should return true if instanceof string and non-null", function () {
        expect(util.isString("")).to.eql(true);
        expect(util.isString("")).to.eql(true);

        expect(util.isString(null)).to.eql(false);
        expect(util.isString(1)).to.eql(false);
    });

    it("soft check: isStringOrUint8Array should return true if string or Uint8Array", function () {
        expect(util.isStringOrUint8Array("")).to.eql(true);
        expect(util.isStringOrUint8Array(new Uint8Array())).to.eql(true);

        expect(util.isStringOrUint8Array(null)).to.eql(false);
        expect(util.isStringOrUint8Array(1)).to.eql(false);
    });

    it("require: requireNonNull should throw custom error if null or undefined", function () {
        try {
            util.requireNonNull(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireNonNull(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        expect(util.requireNonNull("")).to.eql("");
        expect(util.requireNonNull(1)).to.eql(1);
    });

    it("require: requireType should throw custom error if params are not same type", function () {
        try {
            util.requireType();
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            //weird case here because referencing an unset param is also undefined
            // so they are technically the same type but fail null|undefined check
            util.requireType(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireType(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_TYPE_ERROR);
        }

        try {
            util.requireType(new BigNumber(1), 1);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_TYPE_ERROR);
        }

        try {
            util.requireType("1", 1);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_TYPE_ERROR);
        }

        expect(util.requireType("", "asdf")).to.eql("");
        expect(util.requireType(1, 2)).to.eql(1);
    });

    it("require: requireBigNumber should throw custom error if param is not a BigNumber", function () {
        try {
            util.requireBigNumber(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireBigNumber(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireBigNumber(1);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_BIGNUMBER_ERROR);
        }

        try {
            util.requireBigNumber("1");
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_BIGNUMBER_ERROR);
        }

        expect(util.requireBigNumber(new BigNumber(111))).to.eql(
            new BigNumber(111),
        );
    });

    it("require: requireString should throw custom error if param is not string", function () {
        try {
            util.requireString(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireString(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireString(1);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_STRING_ERROR);
        }

        expect(util.requireString("")).to.eql("");
    });

    it("require: requireUint8Array should throw custom error if param is not Uint8Array", function () {
        try {
            util.requireUint8Array(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireUint8Array(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireUint8Array(1);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_UINT8ARRAY_ERROR);
        }

        expect(util.requireUint8Array(new Uint8Array())).to.eql(
            new Uint8Array(),
        );
    });

    it("require: requireNumber should throw custom error if param is not number", function () {
        try {
            util.requireNumber(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireNumber(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireNumber("1");
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NUMBER_ERROR);
        }

        expect(util.requireNumber(1)).to.eql(1);
    });

    it("require: requireStringOrUint8Array should throw custom error if param is not string or Uint8Array", function () {
        try {
            util.requireStringOrUint8Array(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireStringOrUint8Array(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.requireStringOrUint8Array(1);
        } catch (error) {
            expect(error.message).to.eql(
                util.REQUIRE_STRING_OR_UINT8ARRAY_ERROR,
            );
        }

        expect(util.requireStringOrUint8Array("1")).to.eql("1");
        expect(util.requireUint8Array(new Uint8Array())).to.eql(
            new Uint8Array(),
        );
    });

    it("convert: convertToBigNumber should convert string or number to BigNumber", function () {
        try {
            util.convertToBigNumber(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.convertToBigNumber(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.convertToBigNumber({});
        } catch (error) {
            expect(error.message).to.eql(
                util.FUNCTION_CONVERT_TO_BIGNUMBER_ERROR,
            );
        }

        expect(util.convertToBigNumber(1)).to.eql(BigNumber(1));
        expect(util.convertToBigNumber("1")).to.eql(BigNumber(1));
        expect(util.convertToBigNumber(BigNumber(1))).to.eql(BigNumber(1));
    });

    it("convert: convertToBigNumberArray should convert an array of strings or numbers to BigNumbers", function () {
        const bigNumberArray = [BigNumber(1), BigNumber(2), BigNumber(3)];

        try {
            util.convertToBigNumberArray(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_ARRAY_ERROR);
        }

        try {
            util.convertToBigNumberArray(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_ARRAY_ERROR);
        }

        try {
            util.convertToBigNumberArray(1);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_ARRAY_ERROR);
        }

        expect(util.convertToBigNumberArray([1, 2, 3])).to.eql(bigNumberArray);
        expect(util.convertToBigNumberArray(["1", "2", "3"])).to.eql(
            bigNumberArray,
        );
        expect(util.convertToBigNumberArray(bigNumberArray)).to.eql(
            bigNumberArray,
        );
    });

    it("convert: convertToNumber should convert string or BigNumber to number", function () {
        try {
            util.convertToNumber(null);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.convertToNumber(undefined);
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }

        try {
            util.convertToNumber({});
        } catch (error) {
            expect(error.message).to.eql(util.FUNCTION_CONVERT_TO_NUMBER_ERROR);
        }

        try {
            util.convertToNumber("asdf");
        } catch (error) {
            expect(error.message).to.eql(
                util.FUNCTION_CONVERT_TO_NUMBER_PARSE_ERROR,
            );
        }

        expect(util.convertToNumber(1)).to.eql(1);
        expect(util.convertToNumber("1")).to.eql(1);
        expect(util.convertToNumber(new BigNumber(1))).to.eql(1);
        expect(util.convertToNumber(new Long(1))).to.eql(1);
    });

    it("compare", function () {
        expect(util.compare(true, true)).to.be.true;
        expect(util.compare(true, false)).to.be.false;
        expect(util.compare("true", false)).to.be.false;
        expect(util.compare("true", "false")).to.be.false;
        expect(util.compare("true", "true")).to.be.true;
        expect(util.compare("random string", "random string")).to.be.true;
        expect(util.compare(0, 1)).to.be.false;
        expect(util.compare(1, 1)).to.be.true;
        expect(util.compare(Long.fromNumber(1), 1)).to.be.false;
        expect(util.compare(Long.fromNumber(1), Long.fromNumber(1))).to.be.true;
        expect(util.compare({}, { hello: true })).to.be.false;
        expect(util.compare({ hello: false }, { hello: true })).to.be.false;
        expect(util.compare({ hello: true }, { hello: true })).to.be.true;
        expect(util.compare({ hello: { world: false } }, { hello: true })).to.be
            .false;
        expect(util.compare({ hello: { world: false } }, { hello: {} })).to.be
            .false;
        expect(
            util.compare(
                { hello: { world: false } },
                { hello: { world: true } },
            ),
        ).to.be.false;
        expect(
            util.compare(
                { hello: { world: false } },
                { hello: { world: false } },
            ),
        ).to.be.true;
    });
});
