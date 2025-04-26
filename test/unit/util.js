import BigNumber from "bignumber.js";
import Long from "long";
import * as util from "../src/util.js";

describe("util.js", function () {
    it("soft check: isNonNull should return false if null and true if non-null", function () {
        expect(util.isNonNull("")).to.eql(true);

        expect(util.isNonNull(null)).to.eql(false);
        expect(util.isNonNull(undefined)).to.eql(false);
    });

    it("soft check: isNumber should return true if type is number and non-null", function () {
        expect(util.isNumber(new Number())).to.eql(true);
        expect(util.isNumber(1)).to.eql(true);

        expect(util.isNumber(null)).to.eql(false);
        expect(util.isNumber("1")).to.eql(false);
    });

    it("soft check: isBigNumber should return true if instanceof BigNumber and non-null", function () {
        expect(util.isBigNumber(new BigNumber())).to.eql(true);
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
                util.FUNCTION_CONVERT_TO_NUMBER_PARSE_ERROR
            );
        }

        expect(util.convertToNumber(1)).to.eql(1);
        expect(util.convertToNumber("1")).to.eql(1);
        expect(util.convertToNumber(new BigNumber(1))).to.eql(1);
        expect(util.convertToNumber(new Long(1))).to.eql(1);
    });
});
