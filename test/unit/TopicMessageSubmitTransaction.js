import {
    TopicMessageSubmitTransaction,
    AccountId,
    Timestamp,
    TransactionId,
    TopicId,
    CustomFixedFee,
    TokenId,
    CustomFeeLimit,
} from "../../src/index.js";

import * as utf8 from "../../src/encoding/utf8.js";
import * as util from "../../src/util.js";

describe("TopicMessageSubmitTransaction", function () {
    it("setMessage should throw error when passed no message", function () {
        const topicMessageSubmitTransaction =
            new TopicMessageSubmitTransaction();

        try {
            topicMessageSubmitTransaction.setMessage();
        } catch (error) {
            expect(error.message).to.eql(util.REQUIRE_NON_NULL_ERROR);
        }
    });

    it("setMessage should throw error when passed non string/Uint8Array message", function () {
        const message = { message: "this is an invalid message" };

        const topicMessageSubmitTransaction =
            new TopicMessageSubmitTransaction();

        try {
            topicMessageSubmitTransaction.setMessage(message);
        } catch (error) {
            expect(error.message).to.eql(
                util.REQUIRE_STRING_OR_UINT8ARRAY_ERROR,
            );
        }
    });

    it("setMessage should not throw error when passed valid string message", function () {
        const message = "this is a message";

        const topicMessageSubmitTransaction =
            new TopicMessageSubmitTransaction();

        topicMessageSubmitTransaction.setMessage(message);

        expect(utf8.decode(topicMessageSubmitTransaction.message)).to.eql(
            message,
        );
    });

    it("setMessage should not throw error when passed valid Uint8Array message", function () {
        const message = utf8.encode("this is a message");

        const topicMessageSubmitTransaction =
            new TopicMessageSubmitTransaction();

        topicMessageSubmitTransaction.setMessage(message);

        expect(topicMessageSubmitTransaction.message).to.eql(message);
    });

    it("setChunkSize()", function () {
        const spenderAccountId1 = new AccountId(7);
        const topicId = new TopicId(8);
        const nodeAccountId = new AccountId(10, 11, 12);
        const timestamp1 = new Timestamp(14, 15);

        let transaction = new TopicMessageSubmitTransaction()
            .setTransactionId(
                TransactionId.withValidStart(spenderAccountId1, timestamp1),
            )
            .setNodeAccountIds([nodeAccountId])
            .setTopicId(topicId)
            .setChunkSize(1)
            .setMessage("12345")
            .freeze();

        transaction._chunkInfo = { number: 1 };

        let data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            chunkInfo: { number: 1 },
            message: new Uint8Array([49]),
            topicID: topicId._toProtobuf(),
        });

        transaction._chunkInfo.number++;
        data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            chunkInfo: { number: 2 },
            message: new Uint8Array([50]),
            topicID: topicId._toProtobuf(),
        });

        transaction._chunkInfo.number++;
        data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            chunkInfo: { number: 3 },
            message: new Uint8Array([51]),
            topicID: topicId._toProtobuf(),
        });

        transaction._chunkInfo.number++;
        data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            chunkInfo: { number: 4 },
            message: new Uint8Array([52]),
            topicID: topicId._toProtobuf(),
        });

        transaction._chunkInfo.number++;
        data = transaction._makeTransactionData();

        expect(data).to.deep.equal({
            chunkInfo: { number: 5 },
            message: new Uint8Array([53]),
            topicID: topicId._toProtobuf(),
        });
    });

    describe("HIP-991: Permissionless revenue generating topics", function () {
        it("should set custom fee limits", function () {
            const customFeeLimits = [
                new CustomFeeLimit()
                    .setAccountId(new AccountId(1))
                    .setFees(
                        new CustomFixedFee()
                            .setAmount(1)
                            .setDenominatingTokenId(new TokenId(1)),
                    ),
                new CustomFeeLimit()
                    .setAccountId(new AccountId(2))
                    .setFees(
                        new CustomFixedFee()
                            .setAmount(2)
                            .setDenominatingTokenId(new TokenId(2)),
                    ),
            ];

            const topicMessageSubmitTransaction =
                new TopicMessageSubmitTransaction();

            topicMessageSubmitTransaction.setCustomFeeLimits(customFeeLimits);

            customFeeLimits.forEach((customFeeLimit, index) => {
                expect(
                    topicMessageSubmitTransaction.getCustomFeeLimits()[index],
                ).to.deep.equal(customFeeLimit);
            });
        });

        it("should add custom fee limit to a list", function () {
            const customFeeLimits = [
                new CustomFeeLimit()
                    .setAccountId(new AccountId(1))
                    .setFees(
                        new CustomFixedFee()
                            .setAmount(1)
                            .setDenominatingTokenId(new TokenId(1)),
                    ),
                new CustomFeeLimit()
                    .setAccountId(new AccountId(2))
                    .setFees(
                        new CustomFixedFee()
                            .setAmount(2)
                            .setDenominatingTokenId(new TokenId(2)),
                    ),
            ];

            const customFeeLimitToBeAdded = new CustomFeeLimit()
                .setAccountId(new AccountId(3))
                .setFees(
                    new CustomFixedFee()
                        .setAmount(3)
                        .setDenominatingTokenId(new TokenId(3)),
                );

            const expectedCustomFeeLimits = [
                ...customFeeLimits,
                customFeeLimitToBeAdded,
            ];

            const topicMessageSubmitTransaction =
                new TopicMessageSubmitTransaction();

            topicMessageSubmitTransaction.setCustomFeeLimits(customFeeLimits);

            topicMessageSubmitTransaction.addCustomFeeLimit(
                customFeeLimitToBeAdded,
            );

            expectedCustomFeeLimits.forEach((customFeeLimit, index) => {
                expect(
                    topicMessageSubmitTransaction.getCustomFeeLimits()[index],
                ).to.deep.equal(customFeeLimit);
            });
        });

        it("should add custom fee limit to an empty list", function () {
            const customFeeLimitToBeAdded = new CustomFeeLimit()
                .setAccountId(new AccountId(3))
                .setFees(
                    new CustomFixedFee()
                        .setAmount(3)
                        .setDenominatingTokenId(new TokenId(3)),
                );

            const topicMessageSubmitTransaction =
                new TopicMessageSubmitTransaction();

            topicMessageSubmitTransaction.addCustomFeeLimit(
                customFeeLimitToBeAdded,
            );

            expect(
                topicMessageSubmitTransaction.getCustomFeeLimits()[0],
            ).to.deep.equal(customFeeLimitToBeAdded);
        });
    });
});
