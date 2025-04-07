import {
    CustomFixedFee,
    PrivateKey,
    TokenId,
    TopicUpdateTransaction,
} from "../../src/index.js";

describe("TopicUpdateTransaction", function () {
    describe("deserialization of optional parameters", function () {
        it("should deserialize with topicMemo being null", function () {
            const tx = new TopicUpdateTransaction();
            const tx2 = TopicUpdateTransaction.fromBytes(tx.toBytes());

            expect(tx.topicMemo).to.be.null;
            expect(tx2.topicMemo).to.be.null;
        });
    });

    describe("HIP-991: Permissionless revenue generating topics", function () {
        it("should set correct the fee schedule key", function () {
            const feeScheduleKey = PrivateKey.generateECDSA();
            const topicUpdateTransaction =
                new TopicUpdateTransaction().setFeeScheduleKey(feeScheduleKey);

            expect(
                topicUpdateTransaction.getFeeScheduleKey().toString(),
            ).to.eql(feeScheduleKey.toString());
        });

        it("should clear fee schedule key", function () {
            const feeScheduleKey = PrivateKey.generateECDSA();
            const topicUpdateTransaction =
                new TopicUpdateTransaction().setFeeScheduleKey(feeScheduleKey);

            topicUpdateTransaction.clearFeeScheduleKey();

            expect(topicUpdateTransaction.getFeeScheduleKey()).to.be.null;
        });

        it("should set fee exempt keys", function () {
            const feeExemptKeys = [
                PrivateKey.generateECDSA(),
                PrivateKey.generateECDSA(),
            ];

            const topicUpdateTransaction =
                new TopicUpdateTransaction().setFeeExemptKeys(feeExemptKeys);

            feeExemptKeys.forEach((feeExemptKey, index) => {
                expect(
                    topicUpdateTransaction.getFeeExemptKeys()[index].toString(),
                ).to.eql(feeExemptKey.toString());
            });
        });

        it("should add fee exempt key to empty list", function () {
            const feeExemptKeyToBeAdded = PrivateKey.generateECDSA();
            const topicUpdateTransaction =
                new TopicUpdateTransaction().addFeeExemptKey(
                    feeExemptKeyToBeAdded,
                );

            expect(feeExemptKeyToBeAdded.toString()).to.eql(
                topicUpdateTransaction.getFeeExemptKeys()[0].toString(),
            );
        });

        it("should add fee exempt key to list", function () {
            const feeExemptKey = PrivateKey.generateECDSA();
            const topicUpdateTransaction =
                new TopicUpdateTransaction().setFeeExemptKeys([feeExemptKey]);

            const feeExemptKeyToBeAdded = PrivateKey.generateECDSA();

            topicUpdateTransaction.addFeeExemptKey(feeExemptKeyToBeAdded);

            [feeExemptKey, feeExemptKeyToBeAdded].forEach(
                (feeExemptKey, index) => {
                    expect(
                        topicUpdateTransaction
                            .getFeeExemptKeys()
                            // eslint-disable-next-line no-unexpected-multiline
                            [index].toString(),
                    ).to.eql(feeExemptKey.toString());
                },
            );
        });

        it("should clear exempt key list", function () {
            const feeExemptKey = PrivateKey.generateECDSA();

            const topicUpdateTransaction =
                new TopicUpdateTransaction().setFeeExemptKeys([feeExemptKey]);

            topicUpdateTransaction.clearFeeExemptKeys();

            expect(topicUpdateTransaction.getFeeExemptKeys()).to.be.null;
        });

        it("should set topic custom fees", function () {
            const customFixedFees = [
                new CustomFixedFee()
                    .setAmount(1)
                    .setDenominatingTokenId(new TokenId(0)),
                new CustomFixedFee()
                    .setAmount(2)
                    .setDenominatingTokenId(new TokenId(1)),
                new CustomFixedFee()
                    .setAmount(3)
                    .setDenominatingTokenId(new TokenId(2)),
            ];

            const topicUpdateTransaction =
                new TopicUpdateTransaction().setCustomFees(customFixedFees);

            customFixedFees.forEach((customFixedFee, index) => {
                expect(
                    topicUpdateTransaction.getCustomFees()[index].amount,
                ).to.eql(customFixedFee.amount);
                expect(
                    topicUpdateTransaction
                        .getCustomFees()
                        // eslint-disable-next-line no-unexpected-multiline
                        [index].denominatingTokenId.toString(),
                ).to.eql(customFixedFee.denominatingTokenId.toString());
            });
        });

        it("should add topic custom fee to list", function () {
            const customFixedFees = [
                new CustomFixedFee()
                    .setAmount(1)
                    .setDenominatingTokenId(new TokenId(0)),
                new CustomFixedFee()
                    .setAmount(2)
                    .setDenominatingTokenId(new TokenId(1)),
                new CustomFixedFee()
                    .setAmount(3)
                    .setDenominatingTokenId(new TokenId(2)),
            ];

            const customFixedFeeToBeAdded = new CustomFixedFee()
                .setAmount(4)
                .setDenominatingTokenId(new TokenId(3));

            const expectedCustomFees = [
                ...customFixedFees,
                customFixedFeeToBeAdded,
            ];

            const topicUpdateTransaction =
                new TopicUpdateTransaction().setCustomFees(customFixedFees);

            topicUpdateTransaction.addCustomFee(customFixedFeeToBeAdded);

            expectedCustomFees.forEach((customFixedFee, index) => {
                expect(
                    topicUpdateTransaction
                        .getCustomFees()
                        // eslint-disable-next-line no-unexpected-multiline
                        [index].amount.toString(),
                ).to.eql(customFixedFee.amount.toString());
                expect(
                    topicUpdateTransaction
                        .getCustomFees()
                        // eslint-disable-next-line no-unexpected-multiline
                        [index].denominatingTokenId.toString(),
                ).to.eql(customFixedFee.denominatingTokenId.toString());
            });
        });

        it("should add topic custom fee to empty list", function () {
            const customFixedFeeToBeAdded = new CustomFixedFee()
                .setAmount(4)
                .setDenominatingTokenId(new TokenId(3));

            const topicUpdateTransaction =
                new TopicUpdateTransaction().addCustomFee(
                    customFixedFeeToBeAdded,
                );

            expect(topicUpdateTransaction.getCustomFees().length).to.eql(1);
            expect(
                topicUpdateTransaction.getCustomFees()[0].amount.toString(),
            ).to.eql(customFixedFeeToBeAdded.amount.toString());
            expect(
                topicUpdateTransaction
                    .getCustomFees()[0]
                    .denominatingTokenId.toString(),
            ).to.eql(customFixedFeeToBeAdded.denominatingTokenId.toString());
        });

        it("should clear topic fee list", function () {
            const customFixedFees = [
                new CustomFixedFee()
                    .setAmount(1)
                    .setDenominatingTokenId(new TokenId(0)),
                new CustomFixedFee()
                    .setAmount(2)
                    .setDenominatingTokenId(new TokenId(1)),
                new CustomFixedFee()
                    .setAmount(3)
                    .setDenominatingTokenId(new TokenId(2)),
            ];

            const topicUpdateTransaction =
                new TopicUpdateTransaction().setCustomFees(customFixedFees);

            topicUpdateTransaction.clearCustomFees();

            expect(topicUpdateTransaction.getCustomFees()).to.be.null;
        });

        it("should not include feeExemptKeyList in transaction data when feeExemptKeys is null", function () {
            const transaction = new TopicUpdateTransaction();

            // Access private _makeTransactionData method for testing purposes
            const transactionData = transaction._makeTransactionData();

            // Verify that feeExemptKeyList is null in the resulting transaction data
            expect(transactionData.feeExemptKeyList).to.be.null;

            // Create a transaction with bytes and verify data is preserved
            const bytes = transaction.toBytes();
            const deserialized = TopicUpdateTransaction.fromBytes(bytes);
            const deserializedData = deserialized._makeTransactionData();

            expect(deserializedData.feeExemptKeyList).to.be.null;
        });

        it("should not include customFees in transaction data when customFees is null", function () {
            const transaction = new TopicUpdateTransaction();

            // Access private _makeTransactionData method for testing purposes
            const transactionData = transaction._makeTransactionData();

            // Verify that customFees is null in the resulting transaction data
            expect(transactionData.customFees).to.be.null;

            // Create a transaction with bytes and verify data is preserved
            const bytes = transaction.toBytes();
            const deserialized = TopicUpdateTransaction.fromBytes(bytes);
            const deserializedData = deserialized._makeTransactionData();

            expect(deserializedData.customFees).to.be.null;
        });
    });
});
