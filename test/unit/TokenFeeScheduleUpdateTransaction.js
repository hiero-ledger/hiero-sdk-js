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
    const VALID_START = new Timestamp(1596210382, 0);

    let tokenId, customFees, transactionId, nodeId;

    beforeEach(function () {
        const collector = new AccountId(0, 0, 5006);

        tokenId = new TokenId(0, 0, 5005);
        customFees = [
            new CustomFixedFee()
                .setAmount(10)
                .setDenominatingTokenId(new TokenId(0, 0, 5007))
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
        transactionId = TransactionId.withValidStart(
            new AccountId(0, 0, 1001),
            VALID_START,
        );
        nodeId = new AccountId(0, 0, 3);
    });

    /**
     * @param {TokenFeeScheduleUpdateTransaction} transaction
     * @returns {TokenFeeScheduleUpdateTransaction}
     */
    function freezeWithIds(transaction) {
        return transaction
            .setNodeAccountIds([nodeId])
            .setTransactionId(transactionId)
            .freeze();
    }

    /**
     * @returns {TokenFeeScheduleUpdateTransaction}
     */
    function withAllFields() {
        return new TokenFeeScheduleUpdateTransaction()
            .setTokenId(tokenId)
            .setCustomFees(customFees);
    }

    describe("constructor", function () {
        it("should default to no token ID and no custom fees", function () {
            const transaction = new TokenFeeScheduleUpdateTransaction();

            expect(transaction.tokenId).to.be.null;
            expect(transaction.customFees).to.deep.equal([]);
        });

        it("should set the fields given in props", function () {
            const transaction = new TokenFeeScheduleUpdateTransaction({
                tokenId,
                customFees,
            });

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
            expect(transaction.customFees).to.equal(customFees);
        });

        it("should accept a token ID string in props", function () {
            const transaction = new TokenFeeScheduleUpdateTransaction({
                tokenId: "0.0.5005",
            });

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
        });
    });

    describe("setTokenId", function () {
        it("should accept an instance", function () {
            const transaction =
                new TokenFeeScheduleUpdateTransaction().setTokenId(tokenId);

            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
        });

        it("should accept a string", function () {
            const transaction =
                new TokenFeeScheduleUpdateTransaction().setTokenId("0.0.5005");

            expect(transaction.tokenId.toString()).to.equal("0.0.5005");
        });

        it("should store a copy of the instance", function () {
            const transaction =
                new TokenFeeScheduleUpdateTransaction().setTokenId(tokenId);

            expect(transaction.tokenId).to.not.equal(tokenId);
        });

        it("should be chainable", function () {
            const transaction = new TokenFeeScheduleUpdateTransaction();

            expect(transaction.setTokenId(tokenId)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(
                new TokenFeeScheduleUpdateTransaction(),
            );

            expect(() => transaction.setTokenId(tokenId)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("setCustomFees", function () {
        it("should set the fees", function () {
            const transaction =
                new TokenFeeScheduleUpdateTransaction().setCustomFees(
                    customFees,
                );

            expect(transaction.customFees).to.equal(customFees);
        });

        it("should accept an empty list to clear the fees", function () {
            const transaction = withAllFields().setCustomFees([]);

            expect(transaction.customFees).to.deep.equal([]);
        });

        it("should be chainable", function () {
            const transaction = new TokenFeeScheduleUpdateTransaction();

            expect(transaction.setCustomFees(customFees)).to.equal(transaction);
        });

        it("should throw once frozen", function () {
            const transaction = freezeWithIds(
                new TokenFeeScheduleUpdateTransaction(),
            );

            expect(() => transaction.setCustomFees(customFees)).to.throw(
                "transaction is immutable",
            );
        });
    });

    describe("_makeTransactionData", function () {
        it("should encode every field", function () {
            expect(withAllFields()._makeTransactionData()).to.deep.equal({
                tokenId: tokenId._toProtobuf(),
                customFees: customFees.map((fee) => fee._toProtobuf()),
            });
        });

        it("should encode an unset token ID as null and no fees", function () {
            expect(
                new TokenFeeScheduleUpdateTransaction()._makeTransactionData(),
            ).to.deep.equal({
                tokenId: null,
                customFees: [],
            });
        });
    });

    describe("_fromProtobuf", function () {
        /**
         * @param {object} body the tokenFeeScheduleUpdate body
         * @returns {TokenFeeScheduleUpdateTransaction}
         */
        function fromBody(body) {
            const transaction = { bodyBytes: Uint8Array.of(0), sigMap: {} };

            return TokenFeeScheduleUpdateTransaction._fromProtobuf(
                [transaction],
                [transaction],
                [transactionId],
                [nodeId],
                [{ tokenFeeScheduleUpdate: body }],
            );
        }

        it("should decode every field", function () {
            const transaction = fromBody({
                tokenId: tokenId._toProtobuf(),
                customFees: customFees.map((fee) => fee._toProtobuf()),
            });

            expect(transaction).to.be.instanceOf(
                TokenFeeScheduleUpdateTransaction,
            );
            expect(transaction.tokenId.toString()).to.equal(tokenId.toString());
            expect(transaction.customFees.map(encodeFee)).to.deep.equal(
                customFees.map(encodeFee),
            );
        });

        it("should decode each fee into its own class", function () {
            const transaction = fromBody({
                customFees: customFees.map((fee) => fee._toProtobuf()),
            });

            expect(transaction.customFees[0]).to.be.instanceOf(CustomFixedFee);
            expect(transaction.customFees[1]).to.be.instanceOf(
                CustomFractionalFee,
            );
            expect(transaction.customFees[2]).to.be.instanceOf(
                CustomRoyaltyFee,
            );
        });

        it("should leave missing fields at their defaults", function () {
            const transaction = fromBody({});

            expect(transaction.tokenId).to.be.null;
            expect(transaction.customFees).to.deep.equal([]);
        });
    });

    describe("toBytes() and fromBytes()", function () {
        it("should keep every field", function () {
            const transaction = freezeWithIds(withAllFields());

            const decoded = Transaction.fromBytes(transaction.toBytes());

            expect(decoded).to.be.instanceOf(TokenFeeScheduleUpdateTransaction);
            expect(decoded.transactionId.toString()).to.equal(
                transactionId.toString(),
            );
            expect(decoded.tokenId.toString()).to.equal(tokenId.toString());
            expect(decoded.customFees.map(encodeFee)).to.deep.equal(
                customFees.map(encodeFee),
            );
        });
    });

    describe("_execute", function () {
        it("should call token.updateTokenFeeSchedule() with the request", async function () {
            const request = {};
            const response = {};
            const calls = [];
            const channel = {
                token: {
                    updateTokenFeeSchedule: (arg) => {
                        calls.push(arg);
                        return Promise.resolve(response);
                    },
                },
            };

            expect(
                await new TokenFeeScheduleUpdateTransaction()._execute(
                    channel,
                    request,
                ),
            ).to.equal(response);
            expect(calls).to.have.lengthOf(1);
            expect(calls[0]).to.equal(request);
        });
    });

    describe("_getTransactionDataCase", function () {
        it("should return tokenFeeScheduleUpdate", function () {
            expect(
                new TokenFeeScheduleUpdateTransaction()._getTransactionDataCase(),
            ).to.equal("tokenFeeScheduleUpdate");
        });
    });

    describe("_getLogId", function () {
        it("should include the class name and valid start", function () {
            const transaction = freezeWithIds(
                new TokenFeeScheduleUpdateTransaction(),
            );

            expect(transaction._getLogId()).to.equal(
                `TokenFeeScheduleUpdateTransaction:${VALID_START.toString()}`,
            );
        });
    });
});
