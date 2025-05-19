import {
    CustomFractionalFee,
    AccountId,
    FeeAssessmentMethod,
} from "../../src/index.js";
import Long from "long";

describe("CustomFractionalFee", function () {
    let feeCollectorAccountId;
    let numerator;
    let denominator;
    let min;
    let max;
    let assessmentMethod;

    beforeEach(function () {
        feeCollectorAccountId = new AccountId(5);
        numerator = Long.fromNumber(1);
        denominator = Long.fromNumber(10);
        min = Long.fromNumber(1);
        max = Long.fromNumber(100);
        assessmentMethod = FeeAssessmentMethod.InclusiveOfTransfer;
    });

    describe("constructors", function () {
        it("should create CustomFractionalFee with all properties via constructor", function () {
            const fee = new CustomFractionalFee({
                feeCollectorAccountId: feeCollectorAccountId,
                allCollectorsAreExempt: true,
                numerator: numerator,
                denominator: denominator,
                min: min,
                max: max,
                assessmentMethod: assessmentMethod,
            });

            expect(fee.feeCollectorAccountId.toString()).to.equal(
                feeCollectorAccountId.toString(),
            );
            expect(fee.allCollectorsAreExempt).to.be.true;
            expect(fee.numerator.toString()).to.equal(numerator.toString());
            expect(fee.denominator.toString()).to.equal(denominator.toString());
            expect(fee.min.toString()).to.equal(min.toString());
            expect(fee.max.toString()).to.equal(max.toString());
            expect(fee.assessmentMethod).to.equal(assessmentMethod);
        });

        it("should create CustomFractionalFee with string account ID", function () {
            const fee = new CustomFractionalFee({
                feeCollectorAccountId: "0.0.5",
            });

            expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.5");
        });

        it("should create CustomFractionalFee with number values", function () {
            const fee = new CustomFractionalFee({
                numerator: 1,
                denominator: 10,
                min: 1,
                max: 100,
            });

            expect(fee.numerator.toNumber()).to.equal(1);
            expect(fee.denominator.toNumber()).to.equal(10);
            expect(fee.min.toNumber()).to.equal(1);
            expect(fee.max.toNumber()).to.equal(100);
        });

        it("should create CustomFractionalFee with empty constructor", function () {
            const fee = new CustomFractionalFee();

            expect(fee.feeCollectorAccountId).to.be.null;
            expect(fee.allCollectorsAreExempt).to.be.false;
            expect(fee.numerator).to.be.null;
            expect(fee.denominator).to.be.null;
            expect(fee.min).to.be.null;
            expect(fee.max).to.be.undefined;
            expect(fee.assessmentMethod).to.be.undefined;
        });
    });

    describe("setters", function () {
        it("should set numerator correctly", function () {
            const fee = new CustomFractionalFee();

            fee.setNumerator(5);
            expect(fee.numerator.toNumber()).to.equal(5);

            const longValue = Long.fromNumber(10);
            fee.setNumerator(longValue);
            expect(fee.numerator).to.equal(longValue);

            // Test chaining
            const result = fee.setNumerator(15);
            expect(result).to.equal(fee);
        });

        it("should set denominator correctly", function () {
            const fee = new CustomFractionalFee();

            fee.setDenominator(5);
            expect(fee.denominator.toNumber()).to.equal(5);

            const longValue = Long.fromNumber(10);
            fee.setDenominator(longValue);
            expect(fee.denominator).to.equal(longValue);

            // Test chaining
            const result = fee.setDenominator(15);
            expect(result).to.equal(fee);
        });

        it("should set min correctly", function () {
            const fee = new CustomFractionalFee();

            fee.setMin(5);
            expect(fee.min.toNumber()).to.equal(5);

            const longValue = Long.fromNumber(10);
            fee.setMin(longValue);
            expect(fee.min).to.equal(longValue);

            // Test chaining
            const result = fee.setMin(15);
            expect(result).to.equal(fee);
        });

        it("should set max correctly", function () {
            const fee = new CustomFractionalFee();

            fee.setMax(50);
            expect(fee.max.toNumber()).to.equal(50);

            const longValue = Long.fromNumber(100);
            fee.setMax(longValue);
            expect(fee.max).to.equal(longValue);

            // Test chaining
            const result = fee.setMax(150);
            expect(result).to.equal(fee);
        });

        it("should set assessmentMethod correctly", function () {
            const fee = new CustomFractionalFee();

            fee.setAssessmentMethod(FeeAssessmentMethod.ExclusiveOfTransfer);
            expect(fee.assessmentMethod).to.equal(
                FeeAssessmentMethod.ExclusiveOfTransfer,
            );

            // Test chaining
            const result = fee.setAssessmentMethod(
                FeeAssessmentMethod.InclusiveOfTransfer,
            );
            expect(result).to.equal(fee);
        });
    });

    describe("getters", function () {
        it("should retrieve properties correctly", function () {
            const fee = new CustomFractionalFee({
                feeCollectorAccountId: feeCollectorAccountId,
                allCollectorsAreExempt: true,
                numerator: numerator,
                denominator: denominator,
                min: min,
                max: max,
                assessmentMethod: assessmentMethod,
            });

            expect(fee.feeCollectorAccountId).to.equal(feeCollectorAccountId);
            expect(fee.allCollectorsAreExempt).to.be.true;
            expect(fee.numerator).to.equal(numerator);
            expect(fee.denominator).to.equal(denominator);
            expect(fee.min).to.equal(min);
            expect(fee.max).to.equal(max);
            expect(fee.assessmentMethod).to.equal(assessmentMethod);
        });
    });

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf properly", function () {
            const protoObj = {
                feeCollectorAccountId: {
                    accountNum: Long.fromNumber(5),
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                },
                allCollectorsAreExempt: true,
                fractionalFee: {
                    fractionalAmount: {
                        numerator: Long.fromNumber(1),
                        denominator: Long.fromNumber(10),
                    },
                    minimumAmount: Long.fromNumber(1),
                    maximumAmount: Long.fromNumber(100),
                    netOfTransfers: true,
                },
            };

            const fee = CustomFractionalFee._fromProtobuf(protoObj);

            expect(fee).to.be.an.instanceOf(CustomFractionalFee);
            expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.5");
            expect(fee.allCollectorsAreExempt).to.be.true;
            expect(fee.numerator.toNumber()).to.equal(1);
            expect(fee.denominator.toNumber()).to.equal(10);
            expect(fee.min.toNumber()).to.equal(1);
            expect(fee.max.toNumber()).to.equal(100);
            expect(fee.assessmentMethod).to.deep.equal(
                FeeAssessmentMethod.Exclusive,
            );
        });

        it("should handle missing fields", function () {
            const protoObj = {
                fractionalFee: {
                    fractionalAmount: {},
                },
            };

            const fee = CustomFractionalFee._fromProtobuf(protoObj);

            expect(fee).to.be.an.instanceOf(CustomFractionalFee);
            expect(fee.feeCollectorAccountId).to.be.null;
            expect(fee.allCollectorsAreExempt).to.be.false;
            expect(fee.numerator).to.be.null;
            expect(fee.denominator).to.be.null;
            expect(fee.min).to.be.null;
            expect(fee.max).to.be.undefined;
            expect(fee.assessmentMethod).to.be.undefined;
        });
    });

    describe("_toProtobuf", function () {
        it("should serialize to protobuf properly", function () {
            const fee = new CustomFractionalFee({
                feeCollectorAccountId: feeCollectorAccountId,
                allCollectorsAreExempt: true,
                numerator: numerator,
                denominator: denominator,
                min: min,
                max: max,
                assessmentMethod: FeeAssessmentMethod.Exclusive,
            });

            const protoObj = fee._toProtobuf();

            expect(protoObj.feeCollectorAccountId).to.deep.include({
                accountNum: Long.fromNumber(5),
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
            });
            expect(protoObj.allCollectorsAreExempt).to.be.true;
            expect(
                protoObj.fractionalFee.fractionalAmount.numerator.toNumber(),
            ).to.equal(1);
            expect(
                protoObj.fractionalFee.fractionalAmount.denominator.toNumber(),
            ).to.equal(10);
            expect(protoObj.fractionalFee.minimumAmount.toNumber()).to.equal(1);
            expect(protoObj.fractionalFee.maximumAmount.toNumber()).to.equal(
                100,
            );
            expect(protoObj.fractionalFee.netOfTransfers).to.be.true;
        });

        it("should handle null values", function () {
            const fee = new CustomFractionalFee();

            const protoObj = fee._toProtobuf();

            expect(protoObj.feeCollectorAccountId).to.be.null;
            expect(protoObj.allCollectorsAreExempt).to.be.false;
            expect(protoObj.fractionalFee.fractionalAmount.numerator).to.be
                .null;
            expect(protoObj.fractionalFee.fractionalAmount.denominator).to.be
                .null;
            expect(protoObj.fractionalFee.minimumAmount).to.be.null;
            expect(protoObj.fractionalFee.maximumAmount).to.be.undefined;
            expect(protoObj.fractionalFee.netOfTransfers).to.be.false;
        });
    });
});
