import FeeEstimateMode from "../../src/query/enums/FeeEstimateMode.js";

describe("FeeEstimateMode", function () {
    describe("enum values", function () {
        it("should have STATE value of 0", function () {
            expect(FeeEstimateMode.STATE).to.equal(0);
        });

        it("should have INTRINSIC value of 1", function () {
            expect(FeeEstimateMode.INTRINSIC).to.equal(1);
        });

        it("should be frozen object", function () {
            expect(Object.isFrozen(FeeEstimateMode)).to.be.true;
        });

        it("should not allow modification of enum values", function () {
            const originalState = FeeEstimateMode.STATE;
            const originalIntrinsic = FeeEstimateMode.INTRINSIC;

            // Attempt to modify (should not work due to Object.freeze)
            try {
                FeeEstimateMode.STATE = 999;
                FeeEstimateMode.INTRINSIC = 888;
            } catch (e) {
                // Expected to throw in strict mode
            }

            expect(FeeEstimateMode.STATE).to.equal(originalState);
            expect(FeeEstimateMode.INTRINSIC).to.equal(originalIntrinsic);
        });

        it("should have all expected enum keys", function () {
            const expectedKeys = ["STATE", "INTRINSIC"];
            const actualKeys = Object.keys(FeeEstimateMode);

            expect(actualKeys).to.have.lengthOf(expectedKeys.length);
            expectedKeys.forEach((key) => {
                expect(actualKeys).to.include(key);
            });
        });

        it("should have all expected enum values", function () {
            const expectedValues = [0, 1];
            const actualValues = Object.values(FeeEstimateMode);

            expect(actualValues).to.have.lengthOf(expectedValues.length);
            expectedValues.forEach((value) => {
                expect(actualValues).to.include(value);
            });
        });
    });

    describe("usage patterns", function () {
        it("should work with Number() conversion", function () {
            expect(Number(FeeEstimateMode.STATE)).to.equal(0);
            expect(Number(FeeEstimateMode.INTRINSIC)).to.equal(1);
        });

        it("should work with strict equality", function () {
            expect(FeeEstimateMode.STATE === 0).to.be.true;
            expect(FeeEstimateMode.INTRINSIC === 1).to.be.true;
        });

        it("should work in switch statements", function () {
            const testSwitch = (mode) => {
                switch (mode) {
                    case FeeEstimateMode.STATE:
                        return "state";
                    case FeeEstimateMode.INTRINSIC:
                        return "intrinsic";
                    default:
                        return "unknown";
                }
            };

            expect(testSwitch(FeeEstimateMode.STATE)).to.equal("state");
            expect(testSwitch(FeeEstimateMode.INTRINSIC)).to.equal("intrinsic");
            expect(testSwitch(999)).to.equal("unknown");
        });
    });
});
