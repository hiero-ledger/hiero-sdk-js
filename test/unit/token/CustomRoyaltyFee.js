import CustomRoyaltyFee from "../../../src/token/CustomRoyaltyFee.js";
import CustomFixedFee from "../../../src/token/CustomFixedFee.js";
import AccountId from "../../../src/account/AccountId.js";

describe("CustomRoyaltyFee", function () {
    it("setters store and getters return values", function () {
        const fee = new CustomRoyaltyFee()
            .setNumerator(1)
            .setDenominator(10);
        expect(fee.numerator.toNumber()).to.equal(1);
        expect(fee.denominator.toNumber()).to.equal(10);
    });

    it("_toProtobuf serialises correctly", function () {
        const fee = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(new AccountId(0, 0, 3))
            .setNumerator(2)
            .setDenominator(5);
        const proto = fee._toProtobuf();
        expect(proto.royaltyFee.exchangeValueFraction.numerator.toNumber()).to.equal(2);
        expect(proto.royaltyFee.exchangeValueFraction.denominator.toNumber()).to.equal(5);
    });

    it("_fromProtobuf round-trips correctly", function () {
        const proto = {
            feeCollectorAccountId: { shardNum: 0, realmNum: 0, num: 3 },
            allCollectorsAreExempt: false,
            royaltyFee: {
                exchangeValueFraction: { numerator: 1, denominator: 4 },
                fallbackFee: null,
            },
        };
        const fee = CustomRoyaltyFee._fromProtobuf(proto);
        expect(fee.numerator.toNumber()).to.equal(1);
        expect(fee.denominator.toNumber()).to.equal(4);
    });
});