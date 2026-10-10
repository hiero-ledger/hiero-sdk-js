import Long from "long";
import AssessedCustomFee from "../../src/token/AssessedCustomFee.js";
import AccountId from "../../src/account/AccountId.js";
import TokenId from "../../src/token/TokenId.js";

// AssessedCustomFee is not re-exported from src/index.js, so it is imported
// directly from its module.
describe("AssessedCustomFee", function () {
    const feeCollectorAccountId = AccountId.fromString("0.0.1");
    const tokenId = TokenId.fromString("0.0.5");
    const payerAccountId = AccountId.fromString("0.0.2");

    /**
     * Builds a protobuf-shaped fixture matching the fields that
     * `AssessedCustomFee._fromProtobuf` actually reads:
     * `feeCollectorAccountId`, `tokenId`, `amount` and `effectivePayerAccountId`.
     *
     * @param {object} overrides
     * @returns {object}
     */
    function protoFixture(overrides = {}) {
        return {
            feeCollectorAccountId: {
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                accountNum: Long.fromNumber(1),
            },
            tokenId: {
                shardNum: Long.fromNumber(0),
                realmNum: Long.fromNumber(0),
                tokenNum: Long.fromNumber(5),
            },
            amount: Long.fromNumber(100),
            effectivePayerAccountId: [
                {
                    shardNum: Long.fromNumber(0),
                    realmNum: Long.fromNumber(0),
                    accountNum: Long.fromNumber(2),
                },
            ],
            ...overrides,
        };
    }

    describe("constructor", function () {
        it("should coerce string inputs to AccountId and TokenId", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId: "0.0.1",
                tokenId: "0.0.5",
                amount: 100,
                payerAccountIds: [payerAccountId],
            });

            expect(fee.feeCollectorAccountId).to.be.an.instanceof(AccountId);
            expect(fee.tokenId).to.be.an.instanceof(TokenId);
            expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.1");
            expect(fee.tokenId.toString()).to.equal("0.0.5");
        });

        it("should accept AccountId and TokenId instances", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId,
                tokenId,
                amount: 100,
            });

            expect(fee.feeCollectorAccountId).to.equal(feeCollectorAccountId);
            expect(fee.tokenId).to.equal(tokenId);
        });

        it("should leave tokenId null when omitted (HBAR fee)", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId,
                amount: 100,
            });

            expect(fee.tokenId).to.be.null;
        });

        it("should convert a numeric amount to Long", function () {
            const fee = new AssessedCustomFee({ amount: 100 });

            expect(Long.isLong(fee.amount)).to.be.true;
            expect(fee.amount.toNumber()).to.equal(100);
        });

        it("should default every field to null when constructed empty", function () {
            const fee = new AssessedCustomFee();

            expect(fee.feeCollectorAccountId).to.be.null;
            expect(fee.tokenId).to.be.null;
            expect(fee.amount).to.be.null;
            expect(fee.payerAccountIds).to.be.null;
        });

        it("should treat null props as absent rather than coercing them", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId: null,
                tokenId: null,
                amount: null,
                payerAccountIds: null,
            });

            expect(fee.feeCollectorAccountId).to.be.null;
            expect(fee.tokenId).to.be.null;
            expect(fee.amount).to.be.null;
            expect(fee.payerAccountIds).to.be.null;
        });

        it("should return the instance from every setter", function () {
            const fee = new AssessedCustomFee();

            expect(fee.setFeeCollectorAccountId("0.0.1")).to.equal(fee);
            expect(fee.setTokenId("0.0.5")).to.equal(fee);
            expect(fee.setAmount(1)).to.equal(fee);
            expect(fee.setPayerAccountIds([payerAccountId])).to.equal(fee);
        });
    });

    describe("_fromProtobuf", function () {
        it("should construct correctly from a fully populated proto", function () {
            const fee = AssessedCustomFee._fromProtobuf(protoFixture());

            expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.1");
            expect(fee.tokenId.toString()).to.equal("0.0.5");
            expect(fee.amount.toNumber()).to.equal(100);
            expect(fee.payerAccountIds).to.have.lengthOf(1);
            expect(fee.payerAccountIds[0].toString()).to.equal("0.0.2");
        });

        it("should construct an HBAR fee when tokenId is absent", function () {
            const proto = protoFixture();
            delete proto.tokenId;

            const fee = AssessedCustomFee._fromProtobuf(proto);

            expect(fee.tokenId).to.be.null;
            expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.1");
        });

        it("should leave feeCollectorAccountId null when absent", function () {
            const proto = protoFixture();
            delete proto.feeCollectorAccountId;

            const fee = AssessedCustomFee._fromProtobuf(proto);

            expect(fee.feeCollectorAccountId).to.be.null;
        });

        it("should leave payerAccountIds null when effectivePayerAccountId is absent", function () {
            const proto = protoFixture();
            delete proto.effectivePayerAccountId;

            const fee = AssessedCustomFee._fromProtobuf(proto);

            expect(fee.payerAccountIds).to.be.null;
        });

        it("should default absent ID components to 0", function () {
            const fee = AssessedCustomFee._fromProtobuf({
                feeCollectorAccountId: { accountNum: Long.fromNumber(7) },
                tokenId: { tokenNum: Long.fromNumber(8) },
            });

            expect(fee.feeCollectorAccountId.toString()).to.equal("0.0.7");
            expect(fee.tokenId.toString()).to.equal("0.0.8");
        });
    });

    describe("_toProtobuf", function () {
        it("should produce the expected proto structure with all fields", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId,
                tokenId,
                amount: 100,
                payerAccountIds: [payerAccountId],
            });

            const proto = fee._toProtobuf();

            expect(proto).to.deep.equal({
                feeCollectorAccountId: feeCollectorAccountId._toProtobuf(),
                tokenId: tokenId._toProtobuf(),
                amount: Long.fromNumber(100),
                effectivePayerAccountId: [payerAccountId._toProtobuf()],
            });
        });

        it("should emit null for fields that were never set", function () {
            const proto = new AssessedCustomFee()._toProtobuf();

            expect(proto.feeCollectorAccountId).to.be.null;
            expect(proto.tokenId).to.be.null;
            expect(proto.amount).to.be.null;
            expect(proto.effectivePayerAccountId).to.be.null;
        });

        it("should round-trip through _fromProtobuf and _toProtobuf", function () {
            const original = AssessedCustomFee._fromProtobuf(protoFixture());
            const roundTripped = AssessedCustomFee._fromProtobuf(
                original._toProtobuf(),
            );

            expect(roundTripped.feeCollectorAccountId.toString()).to.equal(
                original.feeCollectorAccountId.toString(),
            );
            expect(roundTripped.tokenId.toString()).to.equal(
                original.tokenId.toString(),
            );
            expect(roundTripped.amount.toNumber()).to.equal(
                original.amount.toNumber(),
            );
            expect(roundTripped.payerAccountIds[0].toString()).to.equal(
                original.payerAccountIds[0].toString(),
            );
        });

        it("should round-trip an HBAR fee that has no tokenId", function () {
            const proto = protoFixture();
            delete proto.tokenId;

            const roundTripped = AssessedCustomFee._fromProtobuf(
                AssessedCustomFee._fromProtobuf(proto)._toProtobuf(),
            );

            expect(roundTripped.tokenId).to.be.null;
            expect(roundTripped._toProtobuf().tokenId).to.be.null;
        });
    });

    describe("toJSON", function () {
        it("should serialise every field to plain strings", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId,
                tokenId,
                amount: 100,
                payerAccountIds: [payerAccountId],
            });

            expect(fee.toJSON()).to.deep.equal({
                feeCollectorAccountId: "0.0.1",
                tokenId: "0.0.5",
                amount: "100",
                payerAccountIds: ["0.0.2"],
            });
        });

        it("should serialise an HBAR fee with a null tokenId", function () {
            const fee = new AssessedCustomFee({
                feeCollectorAccountId,
                amount: 100,
                payerAccountIds: [],
            });

            expect(fee.toJSON().tokenId).to.be.null;
        });

        it("should return nulls and an empty array when nothing is set", function () {
            expect(new AssessedCustomFee().toJSON()).to.deep.equal({
                feeCollectorAccountId: null,
                tokenId: null,
                amount: null,
                payerAccountIds: [],
            });
        });
    });
});
