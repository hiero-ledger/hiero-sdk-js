import {
    Client,
    TopicCreateTransaction,
    TokenId,
    CustomFixedFee,
    PrivateKey,
    AccountId,
    TransactionId,
    Hbar,
    Timestamp,
    Transaction,
} from "../../src/index.js";
import * as HieroProto from "@hiero-ledger/proto";
import Long from "long";
import BadEntityIdError from "../../src/BadEntityIdError.js";
import Duration from "../../src/Duration.js";

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

    it("should convert from and to bytes", function () {
        const transactionId = TransactionId.withValidStart(
            AccountId.fromString("0.0.1001"),
            new Timestamp(1596210382, 0),
        );
        const adminKey = PrivateKey.generateED25519().publicKey;
        const submitKey = PrivateKey.generateED25519().publicKey;
        const feeScheduleKey = PrivateKey.generateED25519().publicKey;
        const feeExemptKeys = [
            PrivateKey.generateED25519().publicKey,
            PrivateKey.generateECDSA().publicKey,
        ];
        const customFees = [
            new CustomFixedFee()
                .setAmount(10)
                .setDenominatingTokenId(TokenId.fromString("0.0.5008"))
                .setFeeCollectorAccountId(AccountId.fromString("0.0.5007")),
            new CustomFixedFee()
                .setHbarAmount(new Hbar(1))
                .setFeeCollectorAccountId(AccountId.fromString("0.0.5007")),
        ];

        const tx = new TopicCreateTransaction()
            .setNodeAccountIds([AccountId.fromString("0.0.3")])
            .setTransactionId(transactionId)
            .setTopicMemo("memo")
            .setAdminKey(adminKey)
            .setSubmitKey(submitKey)
            .setFeeScheduleKey(feeScheduleKey)
            .setFeeExemptKeys(feeExemptKeys)
            .setAutoRenewAccountId(AccountId.fromString("0.0.5006"))
            .setAutoRenewPeriod(8000000)
            .setCustomFees(customFees)
            .freeze();

        const tx2 = Transaction.fromBytes(tx.toBytes());

        expect(tx2).to.be.instanceOf(TopicCreateTransaction);
        expect(tx2.transactionId.toString()).to.equal(transactionId.toString());
        expect(tx2.topicMemo).to.equal("memo");
        expect(tx2.adminKey.toString()).to.equal(adminKey.toString());
        expect(tx2.submitKey.toString()).to.equal(submitKey.toString());
        expect(tx2.getFeeScheduleKey().toString()).to.equal(
            feeScheduleKey.toString(),
        );
        expect(
            tx2.getFeeExemptKeys().map((key) => key.toString()),
        ).to.deep.equal(feeExemptKeys.map((key) => key.toString()));
        expect(tx2.autoRenewAccountId.toString()).to.equal("0.0.5006");
        expect(tx2.autoRenewPeriod.seconds.toString()).to.equal("8000000");
        expect(
            tx2
                .getCustomFees()
                .map((fee) => [
                    fee.amount.toString(),
                    fee.denominatingTokenId?.toString() ?? null,
                    fee.feeCollectorAccountId.toString(),
                ]),
        ).to.deep.equal([
            ["10", "0.0.5008", "0.0.5007"],
            [new Hbar(1).toTinybars().toString(), null, "0.0.5007"],
        ]);
    });

    describe("fields", function () {
        const VALID_START = new Timestamp(1596210382, 0);

        let adminKey,
            submitKey,
            feeScheduleKey,
            feeExemptKey,
            autoRenewAccountId,
            customFee,
            transactionId,
            nodeId;

        beforeEach(function () {
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

        describe("clearFeeExemptKeys", function () {
            it("should empty the list and be chainable", function () {
                const transaction =
                    new TopicCreateTransaction().setFeeExemptKeys([
                        feeExemptKey,
                    ]);

                expect(transaction.clearFeeExemptKeys()).to.equal(transaction);
                expect(transaction.getFeeExemptKeys()).to.deep.equal([]);
            });

            it("should throw once frozen", function () {
                const transaction = new TopicCreateTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .freeze();

                expect(() => transaction.clearFeeExemptKeys()).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("clearCustomFees", function () {
            it("should empty the list and be chainable", function () {
                const transaction = new TopicCreateTransaction().setCustomFees([
                    customFee,
                ]);

                expect(transaction.clearCustomFees()).to.equal(transaction);
                expect(transaction.getCustomFees()).to.deep.equal([]);
            });

            it("should throw once frozen", function () {
                const transaction = new TopicCreateTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .freeze();

                expect(() => transaction.clearCustomFees()).to.throw(
                    "transaction is immutable",
                );
            });
        });

        describe("freezeWith", function () {
            it("should use the transaction ID's account as the auto renew account", function () {
                const transaction = new TopicCreateTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .freezeWith(null);

                expect(transaction.getAutoRenewAccountId().toString()).to.equal(
                    "0.0.1001",
                );
            });

            it("should use the client's operator without a transaction ID", function () {
                const client = Client.forNetwork(
                    { "127.0.0.1:50211": "0.0.3" },
                    { scheduleNetworkUpdate: false },
                ).setOperator(
                    new AccountId(0, 0, 1002),
                    PrivateKey.generateED25519(),
                );

                try {
                    const transaction = new TopicCreateTransaction()
                        .setNodeAccountIds([nodeId])
                        .freezeWith(client);

                    expect(
                        transaction.getAutoRenewAccountId().toString(),
                    ).to.equal("0.0.1002");
                } finally {
                    client.close();
                }
            });

            it("should keep an auto renew account that was set", function () {
                const transaction = new TopicCreateTransaction()
                    .setAutoRenewAccountId(autoRenewAccountId)
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .freezeWith(null);

                expect(transaction.getAutoRenewAccountId().toString()).to.equal(
                    "0.0.5006",
                );
            });
        });

        describe("_makeTransactionData", function () {
            it("should encode every field", function () {
                const transaction = new TopicCreateTransaction()
                    .setTopicMemo("memo")
                    .setAdminKey(adminKey)
                    .setSubmitKey(submitKey)
                    .setFeeScheduleKey(feeScheduleKey)
                    .setFeeExemptKeys([feeExemptKey])
                    .setAutoRenewAccountId(autoRenewAccountId)
                    .setAutoRenewPeriod(8000000)
                    .setCustomFees([customFee]);

                expect(transaction._makeTransactionData()).to.deep.equal({
                    adminKey: adminKey._toProtobufKey(),
                    submitKey: submitKey._toProtobufKey(),
                    feeScheduleKey: feeScheduleKey._toProtobufKey(),
                    feeExemptKeyList: [feeExemptKey._toProtobufKey()],
                    autoRenewAccount: autoRenewAccountId._toProtobuf(),
                    autoRenewPeriod: new Duration(8000000)._toProtobuf(),
                    customFees: [customFee._toTopicFeeProtobuf()],
                    memo: "memo",
                });
            });

            it("should encode the defaults", function () {
                expect(
                    new TopicCreateTransaction()._makeTransactionData(),
                ).to.deep.equal({
                    adminKey: null,
                    submitKey: null,
                    feeScheduleKey: null,
                    feeExemptKeyList: [],
                    autoRenewAccount: null,
                    autoRenewPeriod: new Duration(7776000)._toProtobuf(),
                    customFees: [],
                    memo: null,
                });
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

            // TODO(#4757): AccountId.fromString() drops the checksum.
            it.skip("should check the auto renew account ID checksum against the client's network", function () {
                // 0.0.123-vfmkw has the mainnet checksum
                const transaction =
                    new TopicCreateTransaction().setAutoRenewAccountId(
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
                    new TopicCreateTransaction()._validateChecksums(testnet),
                ).to.not.throw();
            });
        });

        describe("_execute", function () {
            it("should call consensus.createTopic() with the request", async function () {
                const request = {};
                const response = {};
                const calls = [];
                const channel = {
                    consensus: {
                        createTopic: (arg) => {
                            calls.push(arg);
                            return Promise.resolve(response);
                        },
                    },
                };

                expect(
                    await new TopicCreateTransaction()._execute(
                        channel,
                        request,
                    ),
                ).to.equal(response);
                expect(calls).to.deep.equal([request]);
                expect(calls[0]).to.equal(request);
            });
        });

        describe("_getTransactionDataCase", function () {
            it("should return consensusCreateTopic", function () {
                expect(
                    new TopicCreateTransaction()._getTransactionDataCase(),
                ).to.equal("consensusCreateTopic");
            });
        });

        describe("_getLogId", function () {
            it("should include the class name and valid start", function () {
                const transaction = new TopicCreateTransaction()
                    .setNodeAccountIds([nodeId])
                    .setTransactionId(transactionId)
                    .freeze();

                expect(transaction._getLogId()).to.equal(
                    `TopicCreateTransaction:${VALID_START.toString()}`,
                );
            });
        });
    });
});
