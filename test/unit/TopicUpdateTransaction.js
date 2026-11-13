import {
    CustomFixedFee,
    KeyList,
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

            expect(topicUpdateTransaction.getFeeScheduleKey()).to.be.instanceOf(
                KeyList,
            );
            expect(
                topicUpdateTransaction.getFeeScheduleKey().toArray().length,
            ).to.eql(0);
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

            expect(topicUpdateTransaction.getFeeExemptKeys().length).to.eql(0);
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

            expect(topicUpdateTransaction.getCustomFees().length).to.eql(0);
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


   describe("clear methods should preserve HAPI sentinel semantics (#4190)", function () {
        it("should clear topic memo to empty string, not null", function () {
            const tx = new TopicUpdateTransaction().setTopicMemo(
                "original memo",
            );

            tx.clearTopicMemo();

            expect(tx.topicMemo).to.eql("");
        });

        it("should clear admin key to an empty KeyList, not null", function () {
            const adminKey = PrivateKey.generateED25519();
            const tx = new TopicUpdateTransaction().setAdminKey(adminKey);

            tx.clearAdminKey();

            expect(tx.adminKey).to.be.instanceOf(KeyList);
            expect(tx.adminKey.toArray().length).to.eql(0);
        });

        it("should clear submit key to an empty KeyList, not null", function () {
            const submitKey = PrivateKey.generateED25519();
            const tx = new TopicUpdateTransaction().setSubmitKey(submitKey);

            tx.clearSubmitKey();

            expect(tx.submitKey).to.be.instanceOf(KeyList);
            expect(tx.submitKey.toArray().length).to.eql(0);
        });

        it("should clear auto renew account id to 0.0.0, not null", function () {
            const tx = new TopicUpdateTransaction().setAutoRenewAccountId(
                "0.0.100",
            );

            tx.clearAutoRenewAccountId();

            expect(tx.autoRenewAccountId.toString()).to.eql("0.0.0");
        });

        it("should serialize cleared adminKey into transaction data, not omit it", function () {
            const adminKey = PrivateKey.generateED25519();
            const tx = new TopicUpdateTransaction()
                .setAdminKey(adminKey)
                .clearAdminKey();

            const transactionData = tx._makeTransactionData();

            expect(transactionData.adminKey).to.not.be.null;
        });

        it("should serialize cleared topicMemo as empty string in transaction data, not omit it", function () {
            const tx = new TopicUpdateTransaction()
                .setTopicMemo("original memo")
                .clearTopicMemo();

            const transactionData = tx._makeTransactionData();

            expect(transactionData.memo).to.not.be.null;
            expect(transactionData.memo.value).to.eql("");
        });

        it("should serialize cleared autoRenewAccountId into transaction data, not omit it", function () {
            const tx = new TopicUpdateTransaction()
                .setAutoRenewAccountId("0.0.100")
                .clearAutoRenewAccountId();

            const transactionData = tx._makeTransactionData();

            expect(transactionData.autoRenewAccount).to.not.be.null;
        });
    }); 