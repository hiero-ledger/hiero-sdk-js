import {
    AccountId,
    CustomFixedFee,
    CustomFractionalFee,
    CustomRoyaltyFee,
    FeeAssessmentMethod,
    Hbar,
    Timestamp,
    TokenFeeScheduleUpdateTransaction,
    TokenId,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import * as HieroProto from "@hiero-ledger/proto";

/**
 * @param {import("../../src/token/CustomFee.js").default} fee
 * @returns {Uint8Array}
 */
function encodeFee(fee) {
    return HieroProto.proto.CustomFee.encode(fee._toProtobuf()).finish();
}

describe("TokenFeeScheduleUpdateTransaction", function () {
    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
        const collector = AccountId.fromString("0.0.5006");
        const customFees = [
            new CustomFixedFee()
                .setAmount(10)
                .setDenominatingTokenId(TokenId.fromString("0.0.5007"))
                .setFeeCollectorAccountId(collector)
                .setAllCollectorsAreExempt(true),
            new CustomFractionalFee()
                .setNumerator(1)
                .setDenominator(20)
                .setMin(1)
                .setMax(100)
                .setAssessmentMethod(FeeAssessmentMethod.Exclusive)
                .setFeeCollectorAccountId(collector),
            new CustomRoyaltyFee()
                .setNumerator(1)
                .setDenominator(10)
                .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)))
                .setFeeCollectorAccountId(collector),
        ];

        const tx = new TokenFeeScheduleUpdateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTokenId(TokenId.fromString("0.0.5005"))
            .setCustomFees(customFees)
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TokenFeeScheduleUpdateTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.tokenId.toString()).to.equal("0.0.5005");
        expect(tx2.customFees.map(encodeFee)).to.deep.equal(
            customFees.map(encodeFee),
        );
    });
});
