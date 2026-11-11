import {
    AccountId,
    Client,
    CustomFixedFee,
    Hbar,
    PrivateKey,
    Timestamp,
    TokenId,
    TopicId,
    TopicUpdateTransaction,
    Transaction,
    TransactionId,
} from "../../src/index.js";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Duration from "../../src/Duration.js";

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

    describe("fields", function () {
        const VALID_START = new Timestamp(1596210382, 0);
        const EXPIRATION_TIME = new Timestamp(1596300000, 0);

        let topicId,
            adminKey,
            submitKey,
            feeScheduleKey,
            feeExemptKey,
            autoRenewAccountId,
            customFee,
            transactionId,
            nodeId;

        beforeEach(function () {
            topicId = new TopicId(0, 0, 7007);
            adminKey = PrivateKey.generateED25519().publicKey;
            submitKey = PrivateKey.generateED25519().publicKey;
            feeScheduleKey = PrivateKey.generateECDSA().publicKey;
            feeExemptKey = PrivateKey.generateECDSA().publicKey;
            autoRenewAccountId = new AccountId(0, 0, 5006);
            customFee = new CustomFixedFee()
                .setHbarAmount(new Hbar(1))
                .setFeeCollectorAccountId(new AccountId(0, 0, 5007));
            transactionId = TransactionId.withValidStart(
                new AccountId(0, 0, 1001),
                VALID_START,
            );
            nodeId = new AccountId(0, 0, 3);
        });

        /**
         * @param {TopicUpdateTransaction} transaction
         * @returns {TopicUpdateTransaction}
         */
        function freezeWithIds(transaction) {
            return transaction
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze();
        }

        /**
         * @returns {TopicUpdateTransaction}
         */
        function withAllFields() {
            return new TopicUpdateTransaction()
                .setTopicId(topicId)
                .setTopicMemo("memo")
                .setAdminKey(adminKey)
                .setSubmitKey(submitKey)
                .setFeeScheduleKey(feeScheduleKey)
                .setFeeExemptKeys([feeExemptKey])
                .setAutoRenewAccountId(autoRenewAccountId)
                .setAutoRenewPeriod(8000000)
                .setCustomFees([customFee])
                .setExpirationTime(EXPIRATION_TIME);
        }

        describe("constructor", function () {
            it("should default every field to null", function () {
                const transaction = new TopicUpdateTransaction();

                expect(transaction.topicId).to.be.null;
                expect(transaction.topicMemo).to.be.null;
                expect(transaction.adminKey).to.be.null;
                expect(transaction.submitKey).to.be.null;
                expect(transaction.getFeeScheduleKey()).to.be.null;
                expect(transaction.getFeeExemptKeys()).to.be.null;
                expect(transaction.autoRenewAccountId).to.be.null;
                expect(transaction.autoRenewPeriod).to.be.null;
                expect(transaction.getCustomFees()).to.be.null;
                expect(transaction.expirationTime).to.be.null;
            });

            it("should set the fields given in props", function () {
                const transaction = new TopicUpdateTransaction({
                    topicId,
                    topicMemo: "memo",
                    adminKey,
                    submitKey,
                    feeScheduleKey,
                    feeExemptKeys: [feeExemptKey],
                    autoRenewAccountId,
                    autoRenewPeriod: 8000000,
                    customFees: [customFee],
                    expirationTime: EXPIRATION_TIME,
                });

                expect(transaction.topicId.toString()).to.equal(
                    topicId.toString(),
                );
                expect(transaction.topicMemo).to.equal("memo");
                expect(transaction.adminKey).to.equal(adminKey);
                expect(transaction.submitKey).to.equal(submitKey);
                expect(transaction.getFeeScheduleKey()).to.equal(
                    feeScheduleKey,
                );
                expect(transaction.getFeeExemptKeys()).to.deep.equal([
                    feeExemptKey,
                ]);
                expect(transaction.autoRenewAccountId).to.equal(
                    autoRenewAccountId,
                );
                expect(transaction.autoRenewPeriod.seconds.toNumber()).to.equal(
                    8000000,
                );
                expect(transaction.getCustomFees()).to.deep.equal([customFee]);
                expect(transaction.expirationTime).to.equal(EXPIRATION_TIME);
            });

            it("should accept strings in props", function () {
                const transaction = new TopicUpdateTransaction({
                    topicId: "0.0.7007",
                    autoRenewAccountId: "0.0.5006",
                });

                expect(transaction.topicId.toString()).to.equal("0.0.7007");
                expect(transaction.autoRenewAccountId.toString()).to.equal(
                    "0.0.5006",
                );
            });
        });

        describe("setTopicId", function () {
            it("should accept an instance or a string", function () {
                expect(
                    new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .topicId.toString(),
                ).to.equal(topicId.toString());
                expect(
                    new TopicUpdateTransaction()
                        .setTopicId("0.0.7007")
                        .topicId.toString(),
                ).to.equal("0.0.7007");
            });

            it("should store a copy of the instance", function () {
                expect(
                    new TopicUpdateTransaction().setTopicId(topicId).topicId,
                ).to.not.equal(topicId);
            });

            it("clearTopicId() should clear it", function () {
                const transaction = new TopicUpdateTransaction().setTopicId(
                    topicId,
                );

                expect(transaction.clearTopicId()).to.equal(transaction);
                expect(transaction.topicId).to.be.null;
            });
        });

        describe("setTopicMemo", function () {
            it("should set the memo and be chainable", function () {
                const transaction = new TopicUpdateTransaction();

                expect(transaction.setTopicMemo("memo")).to.equal(transaction);
                expect(transaction.topicMemo).to.equal("memo");
            });

            it("clearTopicMemo() should clear it", function () {
                const transaction = new TopicUpdateTransaction().setTopicMemo(
                    "memo",
                );

                expect(transaction.clearTopicMemo()).to.equal(transaction);
                expect(transaction.topicMemo).to.be.null;
            });
        });

        describe("setAdminKey and setSubmitKey", function () {
            it("should set the keys and be chainable", function () {
                const transaction = new TopicUpdateTransaction();

                expect(transaction.setAdminKey(adminKey)).to.equal(transaction);
                expect(transaction.setSubmitKey(submitKey)).to.equal(
                    transaction,
                );
                expect(transaction.adminKey).to.equal(adminKey);
                expect(transaction.submitKey).to.equal(submitKey);
            });

            it("clearAdminKey() and clearSubmitKey() should clear them", function () {
                const transaction = new TopicUpdateTransaction()
                    .setAdminKey(adminKey)
                    .setSubmitKey(submitKey);

                expect(transaction.clearAdminKey()).to.equal(transaction);
                expect(transaction.clearSubmitKey()).to.equal(transaction);
                expect(transaction.adminKey).to.be.null;
                expect(transaction.submitKey).to.be.null;
            });
        });

        describe("setAutoRenewAccountId", function () {
            it("should accept an instance or a string", function () {
                expect(
                    new TopicUpdateTransaction().setAutoRenewAccountId(
                        autoRenewAccountId,
                    ).autoRenewAccountId,
                ).to.equal(autoRenewAccountId);
                expect(
                    new TopicUpdateTransaction()
                        .setAutoRenewAccountId("0.0.5006")
                        .autoRenewAccountId.toString(),
                ).to.equal("0.0.5006");
            });

            it("clearAutoRenewAccountId() should clear it", function () {
                const transaction =
                    new TopicUpdateTransaction().setAutoRenewAccountId(
                        autoRenewAccountId,
                    );

                expect(transaction.clearAutoRenewAccountId()).to.equal(
                    transaction,
                );
                expect(transaction.autoRenewAccountId).to.be.null;
            });
        });

        describe("setAutoRenewPeriod", function () {
            it("should accept a Duration or a number of seconds", function () {
                const duration = new Duration(8000000);

                expect(
                    new TopicUpdateTransaction().setAutoRenewPeriod(duration)
                        .autoRenewPeriod,
                ).to.equal(duration);
                expect(
                    new TopicUpdateTransaction()
                        .setAutoRenewPeriod(7000000)
                        .autoRenewPeriod.seconds.toNumber(),
                ).to.equal(7000000);
            });

            it("should be chainable", function () {
                const transaction = new TopicUpdateTransaction();

                expect(transaction.setAutoRenewPeriod(8000000)).to.equal(
                    transaction,
                );
            });
        });

        describe("setExpirationTime", function () {
            it("should accept a Timestamp", function () {
                expect(
                    new TopicUpdateTransaction().setExpirationTime(
                        EXPIRATION_TIME,
                    ).expirationTime,
                ).to.equal(EXPIRATION_TIME);
            });

            it("should accept a Date", function () {
                const transaction =
                    new TopicUpdateTransaction().setExpirationTime(
                        new Date(1596300000000),
                    );

                expect(transaction.expirationTime.toString()).to.equal(
                    EXPIRATION_TIME.toString(),
                );
            });

            it("should be chainable", function () {
                const transaction = new TopicUpdateTransaction();

                expect(transaction.setExpirationTime(EXPIRATION_TIME)).to.equal(
                    transaction,
                );
            });
        });

        describe("frozen", function () {
            it("every setter and clear method should throw once frozen", function () {
                const transaction = freezeWithIds(new TopicUpdateTransaction());
                const calls = [
                    () => transaction.setTopicId(topicId),
                    () => transaction.clearTopicId(),
                    () => transaction.setTopicMemo("memo"),
                    () => transaction.clearTopicMemo(),
                    () => transaction.setAdminKey(adminKey),
                    () => transaction.clearAdminKey(),
                    () => transaction.setSubmitKey(submitKey),
                    () => transaction.clearSubmitKey(),
                    () => transaction.setFeeScheduleKey(feeScheduleKey),
                    () => transaction.clearFeeScheduleKey(),
                    () => transaction.setFeeExemptKeys([feeExemptKey]),
                    () => transaction.addFeeExemptKey(feeExemptKey),
                    () => transaction.clearFeeExemptKeys(),
                    () => transaction.setAutoRenewAccountId(autoRenewAccountId),
                    () => transaction.clearAutoRenewAccountId(),
                    () => transaction.setAutoRenewPeriod(8000000),
                    () => transaction.setCustomFees([customFee]),
                    () => transaction.addCustomFee(customFee),
                    () => transaction.clearCustomFees(),
                    () => transaction.setExpirationTime(EXPIRATION_TIME),
                ];

                for (const call of calls) {
                    expect(call).to.throw("transaction is immutable");
                }
            });
        });

        describe("_makeTransactionData", function () {
            it("should encode every field", function () {
                expect(withAllFields()._makeTransactionData()).to.deep.equal({
                    topicID: topicId._toProtobuf(),
                    adminKey: adminKey._toProtobufKey(),
                    submitKey: submitKey._toProtobufKey(),
                    feeScheduleKey: feeScheduleKey._toProtobufKey(),
                    feeExemptKeyList: {
                        keys: [feeExemptKey._toProtobufKey()],
                    },
                    memo: { value: "memo" },
                    autoRenewAccount: autoRenewAccountId._toProtobuf(),
                    autoRenewPeriod: new Duration(8000000)._toProtobuf(),
                    customFees: { fees: [customFee._toTopicFeeProtobuf()] },
                    expirationTime: EXPIRATION_TIME._toProtobuf(),
                });
            });
        });

        describe("toBytes() and fromBytes()", function () {
            it("should keep every field", function () {
                const transaction = freezeWithIds(withAllFields());

                const decoded = Transaction.fromBytes(transaction.toBytes());

                expect(decoded).to.be.instanceOf(TopicUpdateTransaction);
                expect(decoded.transactionId.toString()).to.equal(
                    transactionId.toString(),
                );
                expect(decoded.topicId.toString()).to.equal(topicId.toString());
                expect(decoded.topicMemo).to.equal("memo");
                expect(decoded.adminKey.toString()).to.equal(
                    adminKey.toString(),
                );
                expect(decoded.submitKey.toString()).to.equal(
                    submitKey.toString(),
                );
                expect(decoded.getFeeScheduleKey().toString()).to.equal(
                    feeScheduleKey.toString(),
                );
                expect(decoded.getFeeExemptKeys().map(String)).to.deep.equal([
                    feeExemptKey.toString(),
                ]);
                expect(decoded.autoRenewAccountId.toString()).to.equal(
                    autoRenewAccountId.toString(),
                );
                expect(decoded.autoRenewPeriod.seconds.toNumber()).to.equal(
                    8000000,
                );
                expect(
                    decoded
                        .getCustomFees()
                        .map((fee) => [
                            fee.amount.toString(),
                            fee.feeCollectorAccountId.toString(),
                        ]),
                ).to.deep.equal([
                    [new Hbar(1).toTinybars().toString(), "0.0.5007"],
                ]);
                expect(decoded.expirationTime.toString()).to.equal(
                    EXPIRATION_TIME.toString(),
                );
            });
        });

        describe("_validateChecksums", function () {
            let mainnet, testnet;

            beforeEach(function () {
                mainnet = Client.forMainnet({ scheduleNetworkUpdate: false });
                testnet = Client.forTestnet({ scheduleNetworkUpdate: false });
            });

            afterEach(function () {
                mainnet.close();
                testnet.close();
            });

            it("should check the topic ID checksum against the client's network", function () {
                // 0.0.123-vfmkw has the mainnet checksum
                const transaction = new TopicUpdateTransaction().setTopicId(
                    TopicId.fromString("0.0.123-vfmkw"),
                );

                expect(() =>
                    transaction._validateChecksums(mainnet),
                ).to.not.throw();
                expect(() => transaction._validateChecksums(testnet)).to.throw(
                    BadEntityIdError,
                );
            });

            // TODO(#4757): AccountId.fromString() drops the checksum.
            it.skip("should check the auto renew account ID checksum against the client's network", function () {
                // 0.0.123-vfmkw has the mainnet checksum
                const transaction =
                    new TopicUpdateTransaction().setAutoRenewAccountId(
                        AccountId.fromString("0.0.123-vfmkw"),
                    );

                expect(() =>
                    transaction._validateChecksums(mainnet),
                ).to.not.throw();
                expect(() => transaction._validateChecksums(testnet)).to.throw(
                    BadEntityIdError,
                );
            });

            it("should skip unset fields", function () {
                expect(() =>
                    new TopicUpdateTransaction()._validateChecksums(testnet),
                ).to.not.throw();
            });
        });

        describe("_execute", function () {
            it("should call consensus.updateTopic() with the request", async function () {
                const request = {};
                const response = {};
                const calls = [];
                const channel = {
                    consensus: {
                        updateTopic: (arg) => {
                            calls.push(arg);
                            return Promise.resolve(response);
                        },
                    },
                };

                expect(
                    await new TopicUpdateTransaction()._execute(
                        channel,
                        request,
                    ),
                ).to.equal(response);
                expect(calls).to.deep.equal([request]);
                expect(calls[0]).to.equal(request);
            });
        });

        describe("_getTransactionDataCase", function () {
            it("should return consensusUpdateTopic", function () {
                expect(
                    new TopicUpdateTransaction()._getTransactionDataCase(),
                ).to.equal("consensusUpdateTopic");
            });
        });

        describe("_getLogId", function () {
            it("should include the class name and valid start", function () {
                const transaction = freezeWithIds(new TopicUpdateTransaction());

                expect(transaction._getLogId()).to.equal(
                    `TopicUpdateTransaction:${VALID_START.toString()}`,
                );
            });
        });
    });
});
