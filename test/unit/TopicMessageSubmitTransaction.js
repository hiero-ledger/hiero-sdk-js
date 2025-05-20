import {
    TopicMessageSubmitTransaction,
    AccountId,
    Timestamp,
    TransactionId,
    TopicId,
    CustomFixedFee,
    TokenId,
    CustomFeeLimit,
    PrivateKey,
    Transaction,
} from "../../src/index.js";

import * as utf8 from "../../src/encoding/utf8.js";
import * as util from "../../src/util.js";

describe("TopicMessageSubmitTransaction", function () {
    let topicId;
    let message;
    let transactionId;
    let nodeId;
    let privateKey;

    beforeEach(function () {
        topicId = new TopicId(0, 0, 5005);
        message = "Hello, Hedera!";
        transactionId = TransactionId.generate(new AccountId(0, 0, 4444));
        nodeId = new AccountId(0, 0, 3);
        privateKey = PrivateKey.generateED25519();
    });

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

    describe("_fromProtobuf", function () {
        it("should deserialize from protobuf correctly", function () {
            // Create mock protobuf objects
            const mockTopicMessageBody = {
                consensusSubmitMessage: {
                    topicID: topicId._toProtobuf(),
                    message: utf8.encode(message),
                },
            };

            const mockTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            const mockSignedTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            // Execute fromProtobuf
            const transaction = TopicMessageSubmitTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockTopicMessageBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(TopicMessageSubmitTransaction);
            expect(transaction.topicId.toString()).to.equal(topicId.toString());

            // Compare message content
            const decodedMessage = utf8.decode(transaction.message);
            expect(decodedMessage).to.equal(message);
        });

        it("should handle null values in protobuf", function () {
            // Create minimal mock protobuf objects
            const mockTopicMessageBody = {
                consensusSubmitMessage: {},
            };

            const mockTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            const mockSignedTransaction = {
                bodyBytes: Uint8Array.from([0]),
                sigMap: {
                    sigPair: [],
                },
            };

            // Execute fromProtobuf
            const transaction = TopicMessageSubmitTransaction._fromProtobuf(
                [mockTransaction],
                [mockSignedTransaction],
                [transactionId],
                [nodeId],
                [mockTopicMessageBody],
            );

            // Verify the transaction properties
            expect(transaction).to.be.instanceOf(TopicMessageSubmitTransaction);
            expect(transaction.topicId).to.be.null;
            expect(transaction.message).to.be.null;
        });
    });

    describe("serialization/deserialization", function () {
        it("should serialize and deserialize correctly", async function () {
            // Create a transaction with all properties set
            const transaction = await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(message)
                .setNodeAccountIds([nodeId])
                .setTransactionId(transactionId)
                .freeze()
                .sign(privateKey);

            // Convert to bytes
            const transactionBytes = transaction.toBytes();

            // Deserialize from bytes
            const deserialized = Transaction.fromBytes(transactionBytes);

            // Verify the transaction properties
            expect(deserialized).to.be.instanceOf(
                TopicMessageSubmitTransaction,
            );

            const deserializedSubmit =
                /** @type {TopicMessageSubmitTransaction} */ (deserialized);

            expect(deserializedSubmit.topicId.toString()).to.equal(
                topicId.toString(),
            );
            expect(utf8.decode(deserializedSubmit.message)).to.equal(message);
        });
    });

    describe("getters and setters", function () {
        describe("topicId", function () {
            it("should get and set topicId", function () {
                const transaction =
                    new TopicMessageSubmitTransaction().setTopicId(topicId);

                expect(transaction.topicId.toString()).to.equal(
                    topicId.toString(),
                );
            });

            it("should set topicId from string", function () {
                const transaction =
                    new TopicMessageSubmitTransaction().setTopicId(
                        topicId.toString(),
                    );

                expect(transaction.topicId.toString()).to.equal(
                    topicId.toString(),
                );
            });
        });

        describe("message", function () {
            it("should get and set message", function () {
                const transaction =
                    new TopicMessageSubmitTransaction().setMessage(message);

                // Check with deprecated getter
                expect(utf8.decode(transaction.message)).to.equal(message);

                // Check with recommended getter
                expect(utf8.decode(transaction.getMessage())).to.equal(message);
            });

            it("should set message as Uint8Array", function () {
                const uint8Message = utf8.encode(message);
                const transaction =
                    new TopicMessageSubmitTransaction().setMessage(
                        uint8Message,
                    );

                expect(transaction.getMessage()).to.deep.equal(uint8Message);
            });
        });

        describe("maxChunks", function () {
            it("should get and set maxChunks", function () {
                const maxChunks = 10;
                const transaction =
                    new TopicMessageSubmitTransaction().setMaxChunks(maxChunks);

                // Check with deprecated getter
                expect(transaction.maxChunks).to.equal(maxChunks);

                // Check with recommended getter
                expect(transaction.getMaxChunks()).to.equal(maxChunks);
            });

            it("should have default maxChunks", function () {
                const transaction = new TopicMessageSubmitTransaction();

                expect(transaction.getMaxChunks()).to.equal(20); // Default value from class
            });
        });

        describe("chunkSize", function () {
            it("should get and set chunkSize", function () {
                const chunkSize = 1000;
                const transaction =
                    new TopicMessageSubmitTransaction().setChunkSize(chunkSize);

                // Check with deprecated getter
                expect(transaction.chunkSize).to.equal(chunkSize);

                // Check with recommended getter
                expect(transaction.getChunkSize()).to.equal(chunkSize);
            });

            it("should have default chunkSize", function () {
                const transaction = new TopicMessageSubmitTransaction();

                // Default is set from CHUNK_SIZE constant
                expect(transaction.getChunkSize()).to.equal(1024);
            });
        });

        describe("customFeeLimits", function () {
            it("should get, set, and add customFeeLimits", function () {
                const customFeeLimit1 = new CustomFeeLimit({
                    tokenId: "0.0.7",
                    value: 10,
                });

                const customFeeLimit2 = new CustomFeeLimit({
                    tokenId: "0.0.8",
                    value: 20,
                });

                // Test setCustomFeeLimits
                let transaction =
                    new TopicMessageSubmitTransaction().setCustomFeeLimits([
                        customFeeLimit1,
                    ]);

                expect(transaction.getCustomFeeLimits()).to.have.length(1);
                expect(transaction.getCustomFeeLimits()[0]).to.equal(
                    customFeeLimit1,
                );

                // Test addCustomFeeLimit
                transaction = new TopicMessageSubmitTransaction()
                    .addCustomFeeLimit(customFeeLimit1)
                    .addCustomFeeLimit(customFeeLimit2);

                expect(transaction.getCustomFeeLimits()).to.have.length(2);
                expect(transaction.getCustomFeeLimits()[0]).to.equal(
                    customFeeLimit1,
                );
                expect(transaction.getCustomFeeLimits()[1]).to.equal(
                    customFeeLimit2,
                );
            });
        });

        describe("constructor", function () {
            it("should set values in constructor", function () {
                const customChunkSize = 2000;
                const customMaxChunks = 15;

                const transaction = new TopicMessageSubmitTransaction({
                    topicId,
                    message,
                    chunkSize: customChunkSize,
                    maxChunks: customMaxChunks,
                });

                expect(transaction.topicId.toString()).to.equal(
                    topicId.toString(),
                );
                expect(utf8.decode(transaction.message)).to.equal(message);
                expect(transaction.chunkSize).to.equal(customChunkSize);
                expect(transaction.maxChunks).to.equal(customMaxChunks);
            });
        });

        describe("bodySizeAllChunks", function () {
            let topicId;
            let transactionId;
            let nodeId;

            beforeEach(function () {
                topicId = new TopicId(0, 0, 5005);
                transactionId = TransactionId.generate(
                    new AccountId(0, 0, 4444),
                );
                nodeId = new AccountId(0, 0, 3);
            });

            it("should return an array with a single element for small message", function () {
                // Create small content that fits in one chunk
                const smallMessage = "a".repeat(100);

                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(smallMessage)
                    .setTransactionId(transactionId)
                    .setNodeAccountIds([nodeId])
                    .freeze();

                const bodySizes = transaction.bodySizeAllChunks;

                expect(Array.isArray(bodySizes)).to.be.true;
                expect(bodySizes).to.have.lengthOf(1);
                expect(bodySizes[0]).to.be.a("number").and.be.greaterThan(0);
            });

            it("should return array with multiple elements for large message", function () {
                // Create content larger than default chunk size (1024 bytes)
                const CHUNK_SIZE = 1024;
                const largeMessage = "a".repeat(CHUNK_SIZE * 3 + 10);

                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(largeMessage)
                    .setChunkSize(CHUNK_SIZE)
                    .setTransactionId(transactionId)
                    .setNodeAccountIds([nodeId])
                    .freeze();

                const bodySizes = transaction.bodySizeAllChunks;

                console.log(bodySizes);
                expect(Array.isArray(bodySizes)).to.be.true;
                expect(bodySizes).to.have.lengthOf(4); // 3 full chunks + 1 partial
                bodySizes.forEach((size) => {
                    expect(size).to.be.a("number").and.be.greaterThan(0);
                });
            });

            it("should maintain the same transaction state after calling", function () {
                const message = "a".repeat(2000);

                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(message)
                    .setTransactionId(transactionId)
                    .setNodeAccountIds([nodeId])
                    .freeze();

                // Store current transaction index
                const originalIndex = transaction._transactionIds.index;

                // Call the method
                transaction.bodySizeAllChunks;

                // Verify index was restored
                expect(transaction._transactionIds.index).to.equal(
                    originalIndex,
                );
            });

            it("should match the number of chunks required for the message", function () {
                const CHUNK_SIZE = 1024;
                const message = "a".repeat(CHUNK_SIZE * 2 + 500);

                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(message)
                    .setChunkSize(CHUNK_SIZE)
                    .setTransactionId(transactionId)
                    .setNodeAccountIds([nodeId])
                    .freeze();

                // Calculate expected number of chunks
                const expectedChunks = Math.ceil(message.length / CHUNK_SIZE);

                const bodySizes = transaction.bodySizeAllChunks;

                expect(bodySizes.length).to.equal(expectedChunks);
                expect(bodySizes.length).to.equal(
                    transaction.getRequiredChunks(),
                );
            });

            it.only("should handle empty messages", function () {
                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setTransactionId(transactionId)
                    .setNodeAccountIds([nodeId])
                    .freeze();

                const bodySizes = transaction.bodySizeAllChunks;

                console.log(bodySizes);

                expect(bodySizes).to.have.lengthOf(1);
                expect(bodySizes[0]).to.be.a("number").and.be.greaterThan(0);
            });

            it("should have non-zero sizes for all chunks", function () {
                const message = "a".repeat(3000);

                const transaction = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(message)
                    .setTransactionId(transactionId)
                    .setNodeAccountIds([nodeId])
                    .freeze();

                const bodySizes = transaction.bodySizeAllChunks;

                // All sizes should be positive numbers
                bodySizes.forEach((size) => {
                    expect(size).to.be.greaterThan(0);
                });
            });
        });
    });
});
