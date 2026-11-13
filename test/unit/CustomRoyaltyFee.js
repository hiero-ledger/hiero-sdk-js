import CustomRoyaltyFee from "../../src/token/CustomRoyaltyFee.js";
import CustomFixedFee from "../../src/token/CustomFixedFee.js";
import AccountId from "../../src/account/AccountId.js";
import TokenId from "../../src/token/TokenId.js";
import Hbar from "../../src/Hbar.js";
import Long from "long";

describe("CustomRoyaltyFee", function () {
    it("setters store and getters return values", function () {
        const fee = new CustomRoyaltyFee().setNumerator(1).setDenominator(10);
        expect(fee.numerator.toNumber()).to.equal(1);
        expect(fee.denominator.toNumber()).to.equal(10);
        expect(fee.fallbackFee).to.be.null;

        const fallback = new CustomFixedFee().setHbarAmount(new Hbar(1));
        const chained = fee.setFallbackFee(fallback);
        expect(chained).to.equal(fee);
        expect(fee.fallbackFee).to.equal(fallback);

        fee.setFallbackFee(null);
        expect(fee.fallbackFee).to.be.null;
    });

    it("constructor accepts fallbackFee property", function () {
        const fallback = new CustomFixedFee().setHbarAmount(new Hbar(2));
        const fee = new CustomRoyaltyFee({
            numerator: 3,
            denominator: 10,
            fallbackFee: fallback,
        });

        expect(fee.numerator.toNumber()).to.equal(3);
        expect(fee.denominator.toNumber()).to.equal(10);
        expect(fee.fallbackFee).to.equal(fallback);
    });

    it("_toProtobuf serialises correctly without fallbackFee", function () {
        const fee = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(new AccountId(0, 0, 3))
            .setNumerator(2)
            .setDenominator(5);
        const proto = fee._toProtobuf();
        expect(
            proto.royaltyFee.exchangeValueFraction.numerator.toNumber(),
        ).to.equal(2);
        expect(
            proto.royaltyFee.exchangeValueFraction.denominator.toNumber(),
        ).to.equal(5);
        expect(proto.royaltyFee.fallbackFee).to.be.null;
    });

    it("_toProtobuf serialises correctly with fallbackFee", function () {
        const fallback = new CustomFixedFee()
            .setAmount(100)
            .setDenominatingTokenId(new TokenId(1, 2, 3));
        const fee = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(new AccountId(0, 0, 3))
            .setNumerator(2)
            .setDenominator(5)
            .setFallbackFee(fallback);

        const proto = fee._toProtobuf();
        expect(
            proto.royaltyFee.exchangeValueFraction.numerator.toNumber(),
        ).to.equal(2);
        expect(
            proto.royaltyFee.exchangeValueFraction.denominator.toNumber(),
        ).to.equal(5);
        expect(proto.royaltyFee.fallbackFee).to.deep.equal(
            fallback._toProtobuf().fixedFee,
        );
    });

    it("_fromProtobuf round-trips correctly without fallbackFee", function () {
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
        expect(fee.fallbackFee).to.be.null;
    });

    it("_fromProtobuf round-trips correctly with fallbackFee", function () {
        const proto = {
            feeCollectorAccountId: { shardNum: 0, realmNum: 0, num: 3 },
            allCollectorsAreExempt: true,
            royaltyFee: {
                exchangeValueFraction: { numerator: 1, denominator: 4 },
                fallbackFee: {
                    amount: Long.fromNumber(50),
                    denominatingTokenId: {
                        shardNum: 0,
                        realmNum: 0,
                        tokenNum: 7,
                    },
                },
            },
        };
        const fee = CustomRoyaltyFee._fromProtobuf(proto);
        expect(fee.numerator.toNumber()).to.equal(1);
        expect(fee.denominator.toNumber()).to.equal(4);
        expect(fee.allCollectorsAreExempt).to.be.true;
        expect(fee.fallbackFee).to.be.instanceOf(CustomFixedFee);
        expect(fee.fallbackFee.amount.toNumber()).to.equal(50);
        expect(fee.fallbackFee.denominatingTokenId.toString()).to.equal(
            "0.0.7",
        );
    });

    it("round-trips between _toProtobuf and _fromProtobuf with fallbackFee", function () {
        const fallback = new CustomFixedFee().setHbarAmount(new Hbar(5));
        const original = new CustomRoyaltyFee()
            .setFeeCollectorAccountId(new AccountId(0, 0, 3))
            .setAllCollectorsAreExempt(true)
            .setNumerator(3)
            .setDenominator(10)
            .setFallbackFee(fallback);

        const restored = CustomRoyaltyFee._fromProtobuf(original._toProtobuf());
        expect(restored.numerator.toNumber()).to.equal(3);
        expect(restored.denominator.toNumber()).to.equal(10);
        expect(restored.allCollectorsAreExempt).to.be.true;
        expect(restored.feeCollectorAccountId.toString()).to.equal("0.0.3");
        expect(restored.fallbackFee).to.be.instanceOf(CustomFixedFee);
        expect(restored.fallbackFee.hbarAmount.toString()).to.equal(
            fallback.hbarAmount.toString(),
        );
    });

    it("_fromProtobuf throws on missing royaltyFee or exchangeValueFraction", function () {
        expect(() => CustomRoyaltyFee._fromProtobuf({})).to.throw(
            "custom fee must set fixedFee, fractionalFee or royaltyFee",
        );
        expect(() =>
            CustomRoyaltyFee._fromProtobuf({
                royaltyFee: {},
            }),
        ).to.throw("exchangeValueFraction is required");
    });
});
