import {
    TopicCreateTransaction,
    TokenId,
    CustomFixedFee,
    PrivateKey,
    AccountId,
    TransactionId,
} from "../../src/index.js";
import * as HieroProto from "@hashgraph/proto";
import Long from "long";

describe("TopicCreateTransaction", function () {
    describe("HIP-991: Permissionless revenue generating topics", function () {
        it("should set correct the fee schedule key", function () {
            const feeScheduleKey = PrivateKey.generateECDSA();
            const topicCreateTransaction =
                new TopicCreateTransaction().setFeeScheduleKey(feeScheduleKey);

            expect(
                topicCreateTransaction.getFeeScheduleKey().toString(),
            ).to.eql(feeScheduleKey.toString());
        });

        it("should set fee exempt keys", function () {
            const feeExemptKeys = [
                PrivateKey.generateECDSA(),
                PrivateKey.generateECDSA(),
            ];

            const topicCreateTransaction =
                new TopicCreateTransaction().setFeeExemptKeys(feeExemptKeys);

            feeExemptKeys.forEach((feeExemptKey, index) => {
                expect(
                    topicCreateTransaction.getFeeExemptKeys()[index].toString(),
                ).to.eql(feeExemptKey.toString());
            });
        });

        it("should add fee exempt key to empty list", function () {
            const feeExemptKeyToBeAdded = PrivateKey.generateECDSA();

            const topicCreateTransaction =
                new TopicCreateTransaction().addFeeExemptKey(
                    feeExemptKeyToBeAdded,
                );

            expect(feeExemptKeyToBeAdded.toString()).to.eql(
                topicCreateTransaction.getFeeExemptKeys()[0].toString(),
            );
        });

        it("should add fee exempt key to list", function () {
            const feeExemptKey = PrivateKey.generateECDSA();

            const topicCreateTransaction =
                new TopicCreateTransaction().setFeeExemptKeys([feeExemptKey]);

            const feeExemptKeyToBeAdded = PrivateKey.generateECDSA();

            topicCreateTransaction.addFeeExemptKey(feeExemptKeyToBeAdded);

            [feeExemptKey, feeExemptKeyToBeAdded].forEach(
                (feeExemptKey, index) => {
                    expect(
                        topicCreateTransaction
                            .getFeeExemptKeys()
                            // eslint-disable-next-line no-unexpected-multiline
                            [index].toString(),
                    ).to.eql(feeExemptKey.toString());
                },
            );
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

            const topicCreateTransaction =
                new TopicCreateTransaction().setCustomFees(customFixedFees);

            customFixedFees.forEach((customFixedFee, index) => {
                expect(
                    topicCreateTransaction.getCustomFees()[index].amount,
                ).to.eql(customFixedFee.amount);
                expect(
                    topicCreateTransaction
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

            const topicCreateTransaction =
                new TopicCreateTransaction().setCustomFees(customFixedFees);

            topicCreateTransaction.addCustomFee(customFixedFeeToBeAdded);

            expectedCustomFees.forEach((customFixedFee, index) => {
                expect(
                    topicCreateTransaction
                        .getCustomFees()
                        // eslint-disable-next-line no-unexpected-multiline
                        [index].amount.toString(),
                ).to.eql(customFixedFee.amount.toString());
                expect(
                    topicCreateTransaction
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

            const topicCreateTransaction =
                new TopicCreateTransaction().addCustomFee(
                    customFixedFeeToBeAdded,
                );

            expect(topicCreateTransaction.getCustomFees().length).to.eql(1);
            expect(
                topicCreateTransaction.getCustomFees()[0].amount.toString(),
            ).to.eql(customFixedFeeToBeAdded.amount.toString());
            expect(
                topicCreateTransaction
                    .getCustomFees()[0]
                    .denominatingTokenId.toString(),
            ).to.eql(customFixedFeeToBeAdded.denominatingTokenId.toString());
        });
    });

    describe("_fromProtobuf", function () {
        it("should correctly deserialize from protobuf with all fields", function () {
            // Create admin key
            const adminKeyPrivate = PrivateKey.generateED25519();
            const adminKeyPublic = adminKeyPrivate.publicKey;

            // Create submit key
            const submitKeyPrivate = PrivateKey.generateED25519();
            const submitKeyPublic = submitKeyPrivate.publicKey;

            // Create fee schedule key
            const feeScheduleKeyPrivate = PrivateKey.generateED25519();
            const feeScheduleKeyPublic = feeScheduleKeyPrivate.publicKey;

            // Create fee exempt keys
            const feeExemptKeyPrivate1 = PrivateKey.generateED25519();
            const feeExemptKeyPublic1 = feeExemptKeyPrivate1.publicKey;
            const feeExemptKeyPrivate2 = PrivateKey.generateED25519();
            const feeExemptKeyPublic2 = feeExemptKeyPrivate2.publicKey;

            // Create autoRenewAccountId
            const autoRenewAccountId = new AccountId(0, 0, 50000);

            // Create custom fee
            const customFee = new CustomFixedFee()
                .setFeeCollectorAccountId(new AccountId(0, 0, 60000))
                .setAmount(100)
                .setDenominatingTokenId(new TokenId(0, 0, 70000));

            // Create mock protobuf data
            const topicMemo = "Test topic memo";
            const autoRenewPeriod = 7776000; // 90 days in seconds

            // Create transaction body
            const consensusCreateBody = {
                adminKey: adminKeyPublic._toProtobufKey(),
                submitKey: submitKeyPublic._toProtobufKey(),
                feeScheduleKey: feeScheduleKeyPublic._toProtobufKey(),
                feeExemptKeyList: [
                    feeExemptKeyPublic1._toProtobufKey(),
                    feeExemptKeyPublic2._toProtobufKey(),
                ],
                autoRenewAccount: autoRenewAccountId._toProtobuf(),
                autoRenewPeriod: { seconds: Long.fromNumber(autoRenewPeriod) },
                memo: topicMemo,
                customFees: [customFee._toTopicFeeProtobuf()],
            };

            // Create transaction ID for the transaction
            const transactionId = TransactionId.generate(
                new AccountId(0, 0, 40000),
            );

            const transactionBody = {
                transactionID: transactionId._toProtobuf(),
                nodeAccountID: new AccountId(0, 0, 10000)._toProtobuf(),
                transactionFee: Long.fromNumber(100000000),
                transactionValidDuration: { seconds: Long.fromNumber(120) },
                consensusCreateTopic: consensusCreateBody,
            };

            const bodyBytes =
                HieroProto.proto.TransactionBody.encode(
                    transactionBody,
                ).finish();

            const signedTransaction = {
                bodyBytes: bodyBytes,
                sigMap: { sigPair: [] },
            };

            const transaction = {
                signedTransactionBytes:
                    HieroProto.proto.SignedTransaction.encode(
                        signedTransaction,
                    ).finish(),
            };

            // Call _fromProtobuf with the mock data
            const topicCreateTransaction = TopicCreateTransaction._fromProtobuf(
                [transaction],
                [signedTransaction],
                [transactionId],
                [new AccountId(0, 0, 10000)],
                [transactionBody],
            );

            // Verify transaction properties
            expect(topicCreateTransaction.getAdminKey().toString()).to.equal(
                adminKeyPublic.toString(),
            );
            expect(topicCreateTransaction.getSubmitKey().toString()).to.equal(
                submitKeyPublic.toString(),
            );
            expect(
                topicCreateTransaction.getFeeScheduleKey().toString(),
            ).to.equal(feeScheduleKeyPublic.toString());

            // Verify fee exempt keys
            expect(topicCreateTransaction.getFeeExemptKeys()).to.have.length(2);
            expect(
                topicCreateTransaction.getFeeExemptKeys()[0].toString(),
            ).to.equal(feeExemptKeyPublic1.toString());
            expect(
                topicCreateTransaction.getFeeExemptKeys()[1].toString(),
            ).to.equal(feeExemptKeyPublic2.toString());

            // Verify account ID and other fields
            expect(
                topicCreateTransaction.getAutoRenewAccountId().toString(),
            ).to.equal(autoRenewAccountId.toString());
            expect(
                topicCreateTransaction.getAutoRenewPeriod().seconds.toNumber(),
            ).to.equal(autoRenewPeriod);
            expect(topicCreateTransaction.getTopicMemo()).to.equal(topicMemo);

            // Verify custom fees
            expect(topicCreateTransaction.getCustomFees()).to.have.length(1);
            expect(
                topicCreateTransaction.getCustomFees()[0].amount.toString(),
            ).to.equal("100");
            expect(
                topicCreateTransaction
                    .getCustomFees()[0]
                    .feeCollectorAccountId.toString(),
            ).to.equal("0.0.60000");
            expect(
                topicCreateTransaction
                    .getCustomFees()[0]
                    .denominatingTokenId.toString(),
            ).to.equal("0.0.70000");
        });

        it("should correctly deserialize from protobuf with minimal fields", function () {
            // Create minimal transaction body with only required fields
            const transactionId = TransactionId.generate(
                new AccountId(0, 0, 40000),
            );

            const transactionBody = {
                transactionID: transactionId._toProtobuf(),
                nodeAccountID: new AccountId(0, 0, 10000)._toProtobuf(),
                transactionFee: Long.fromNumber(100000000),
                transactionValidDuration: { seconds: Long.fromNumber(120) },
                consensusCreateTopic: {
                    // Auto renew period is always set with a default value
                    autoRenewPeriod: { seconds: Long.fromNumber(7776000) },
                },
            };

            const bodyBytes =
                HieroProto.proto.TransactionBody.encode(
                    transactionBody,
                ).finish();

            const signedTransaction = {
                bodyBytes: bodyBytes,
                sigMap: { sigPair: [] },
            };

            const transaction = {
                signedTransactionBytes:
                    HieroProto.proto.SignedTransaction.encode(
                        signedTransaction,
                    ).finish(),
            };

            // Call _fromProtobuf with the minimal data
            const topicCreateTransaction = TopicCreateTransaction._fromProtobuf(
                [transaction],
                [signedTransaction],
                [transactionId],
                [new AccountId(0, 0, 10000)],
                [transactionBody],
            );

            // Verify transaction properties
            expect(topicCreateTransaction.getAdminKey()).to.be.null;
            expect(topicCreateTransaction.getSubmitKey()).to.be.null;
            expect(topicCreateTransaction.getFeeScheduleKey()).to.be.null;
            expect(topicCreateTransaction.getFeeExemptKeys()).to.have.length(0);
            expect(topicCreateTransaction.getAutoRenewAccountId()).to.be.null;
            expect(
                topicCreateTransaction.getAutoRenewPeriod().seconds.toString(),
            ).to.equal("7776000");
            expect(topicCreateTransaction.getTopicMemo()).to.be.null;
            expect(topicCreateTransaction.getCustomFees()).to.have.length(0);
        });
    });
});
