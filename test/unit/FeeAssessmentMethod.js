import { FeeAssessmentMethod } from "../../src/exports.js";

describe("FeeAssessmentMethod", function () {
    it.each([
        [false, "INCLUSIVE", FeeAssessmentMethod.Inclusive],
        [true, "EXCLUSIVE", FeeAssessmentMethod.Exclusive],
    ])("maps value %s to %s", function (value, name, method) {
        expect(FeeAssessmentMethod._fromValue(value)).to.equal(method);
        expect(method.toString()).to.equal(name);
        expect(method.valueOf()).to.equal(value);
    });

    it("returns undefined for a value that is not a boolean", function () {
        expect(FeeAssessmentMethod._fromValue(undefined)).to.be.undefined;
    });

    it("returns UNKNOWN (value) for a non-static instance", function () {
        expect(new FeeAssessmentMethod(false).toString()).to.equal(
            "UNKNOWN (false)",
        );
    });
});
