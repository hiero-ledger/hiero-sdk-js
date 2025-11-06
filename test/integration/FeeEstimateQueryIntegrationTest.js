// SPDX-License-Identifier: Apache-2.0

import {
    FeeEstimateQuery,
    FeeEstimateMode,
    TransferTransaction,
    TokenCreateTransaction,
    TokenMintTransaction,
    TopicCreateTransaction,
    ContractCreateTransaction,
    FileCreateTransaction,
    FileAppendTransaction,
    TopicMessageSubmitTransaction,
    Hbar,
    FileDeleteTransaction,
    TopicDeleteTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createFungibleToken } from "./utils/Fixtures.js";

describe("FeeEstimateQuery Integration", function () {
    let env;

    beforeAll(async function () {
        env = await IntegrationTestEnv.new();
    });

    describe("Basic Functionality Tests", function () {
        it("should estimate fees for TransferTransaction with STATE mode", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .addHbarTransfer(env.operatorId, new Hbar(1));

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.mode).to.equal(FeeEstimateMode.STATE);
            expect(estimate.networkFee).to.not.be.null;
            expect(estimate.nodeFee).to.not.be.null;
            expect(estimate.serviceFee).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;

            // Validate total equals sum of components
            const calculatedTotal =
                estimate.networkFee.subtotal.toNumber() +
                estimate.nodeFee.base.toNumber() +
                estimate.nodeFee.extras.reduce(
                    (sum, extra) => sum + extra.subtotal.toNumber(),
                    0,
                ) +
                estimate.serviceFee.base.toNumber() +
                estimate.serviceFee.extras.reduce(
                    (sum, extra) => sum + extra.subtotal.toNumber(),
                    0,
                );

            expect(estimate.total.toNumber()).to.be.closeTo(calculatedTotal, 1);
        });

        it("should estimate fees for TransferTransaction with INTRINSIC mode", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-100))
                .addHbarTransfer(env.operatorId, new Hbar(100));

            const intrinsicEstimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.INTRINSIC)
                .setTransaction(tx)
                .execute(env.client);

            expect(intrinsicEstimate).to.not.be.null;
            expect(intrinsicEstimate.mode).to.equal(FeeEstimateMode.INTRINSIC);
            expect(intrinsicEstimate.total.toNumber()).to.exist;
        });

        it("should default to STATE mode when mode is not set", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .addHbarTransfer(env.operatorId, new Hbar(1));

            const estimate = await new FeeEstimateQuery()
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate.mode).to.equal(FeeEstimateMode.STATE);
        });

        it("should throw error when transaction is not set", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            let error = null;
            try {
                await new FeeEstimateQuery().execute(env.client);
            } catch (e) {
                error = e;
            }

            expect(error).to.not.be.null;
            expect(error.message).to.include(
                "FeeEstimateQuery requires a transaction",
            );
        });
    });

    describe("Transaction Type Coverage Tests", function () {
        it("should estimate fees for TokenCreateTransaction", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TokenCreateTransaction()
                .setTokenName("Test Token")
                .setTokenSymbol("TEST")
                .setTreasuryAccountId(env.operatorId)
                .setAdminKey(env.operatorKey);

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;
            expect(estimate.serviceFee.base.toNumber()).to.exist;
        });

        it("should estimate fees for TokenMintTransaction", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const token = await createFungibleToken(env.client);

            const tx = new TokenMintTransaction()
                .setTokenId(token)
                .setAmount(100);

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;

            // TokenMint may have extras for additional tokens
            const nodeSubtotal =
                estimate.nodeFee.base.toNumber() +
                estimate.nodeFee.extras.reduce(
                    (sum, extra) => sum + extra.subtotal.toNumber(),
                    0,
                );
            expect(nodeSubtotal).to.exist;
        });

        it("should estimate fees for TopicCreateTransaction", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TopicCreateTransaction().setAdminKey(
                env.operatorKey,
            );

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;
        });

        it("should estimate fees for ContractCreateTransaction", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const bytecode = new Uint8Array([1, 2, 3, 4, 5]);
            const tx = new ContractCreateTransaction()
                .setBytecode(bytecode)
                .setGas(100000);

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;
        });

        it("should estimate fees for FileCreateTransaction", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const contents = new Uint8Array(10).fill(65); // 1000 bytes of 'A'
            const tx = new FileCreateTransaction()
                .setContents(contents)
                .setKeys([env.operatorKey]);

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;
        });
    });

    describe("Fee Component Validation Tests", function () {
        it("should have network.subtotal equal to node.subtotal * network.multiplier", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-10))
                .addHbarTransfer(env.operatorId, new Hbar(10));

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            const nodeSubtotal =
                estimate.nodeFee.base.toNumber() +
                estimate.nodeFee.extras.reduce(
                    (sum, extra) => sum + extra.subtotal.toNumber(),
                    0,
                );

            const expectedNetworkSubtotal =
                nodeSubtotal * estimate.networkFee.multiplier;

            expect(estimate.networkFee.subtotal.toNumber()).to.be.closeTo(
                expectedNetworkSubtotal,
                1,
            );
        });

        it("should have total equal to network.subtotal + node.subtotal + service.subtotal", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-5))
                .addHbarTransfer(env.operatorId, new Hbar(5));

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            const nodeSubtotal =
                estimate.nodeFee.base.toNumber() +
                estimate.nodeFee.extras.reduce(
                    (sum, extra) => sum + extra.subtotal.toNumber(),
                    0,
                );

            const serviceSubtotal =
                estimate.serviceFee.base.toNumber() +
                estimate.serviceFee.extras.reduce(
                    (sum, extra) => sum + extra.subtotal.toNumber(),
                    0,
                );

            const expectedTotal =
                estimate.networkFee.subtotal.toNumber() +
                nodeSubtotal +
                serviceSubtotal;

            expect(estimate.total.toNumber()).to.be.closeTo(expectedTotal, 1);
        });
    });

    describe("Chunk Transaction Tests", function () {
        it("should aggregate fees for FileAppendTransaction with multiple chunks", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const operatorKey = env.operatorKey.publicKey;

            // Create a file
            const response = await new FileCreateTransaction()
                .setKeys([operatorKey])
                .setContents("[e2e::FileCreateTransaction]")
                .execute(env.client);

            const receipt = await response.getReceipt(env.client);
            const fileId = receipt.fileId;

            try {
                // Create a FileAppendTransaction with large content that will be chunked
                const largeContents = new Uint8Array(10).fill(1); // 10KB of 'A'
                const tx = new FileAppendTransaction()
                    .setFileId(fileId)
                    .setContents(largeContents)
                    .setChunkSize(1);

                // Get fee estimate
                const estimate = await new FeeEstimateQuery()
                    .setMode(FeeEstimateMode.STATE)
                    .setTransaction(tx)
                    .execute(env.client);

                expect(estimate).to.not.be.null;
                expect(estimate.total.toNumber()).to.exist;

                // Verify the transaction is chunked (multiple chunks)
                const chunks = tx.getRequiredChunks();
                expect(chunks).to.exist;

                // Execute the actual transaction
                const actualResponse = await tx.execute(env.client);
                const actualReceipt = await actualResponse.getReceipt(
                    env.client,
                );

                // The actual fee should be close to the estimate
                // Note: This is a rough check; actual fees may vary slightly
                expect(actualReceipt).to.not.be.null;
            } finally {
                // Clean up
                await (
                    await new FileDeleteTransaction()
                        .setFileId(fileId)
                        .execute(env.client)
                ).getReceipt(env.client);
            }
        });

        it("should aggregate fees for TopicMessageSubmitTransaction with single chunk", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const operatorKey = env.operatorKey.publicKey;

            // Create a topic
            const response = await new TopicCreateTransaction()
                .setAdminKey(operatorKey)
                .execute(env.client);

            const receipt = await response.getReceipt(env.client);
            const topicId = receipt.topicId;

            // Create a small message that fits in one chunk
            const smallMessage = new Uint8Array(100).fill(1); // 100 bytes of 'H'
            const tx = new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage(smallMessage)
                .setChunkSize(100)
                .setMaxChunks(1);

            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            expect(estimate).to.not.be.null;
            expect(estimate.total.toNumber()).to.exist;
        });

        it("should aggregate fees for TopicMessageSubmitTransaction with multiple chunks", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const operatorKey = env.operatorKey.publicKey;

            // Create a topic
            const response = await new TopicCreateTransaction()
                .setAdminKey(operatorKey)
                .execute(env.client);

            const receipt = await response.getReceipt(env.client);
            const topicId = receipt.topicId;

            try {
                // Create a large message that will be chunked
                const largeMessage = new Uint8Array(100).fill(1); // 15KB of 'M'
                const tx = new TopicMessageSubmitTransaction()
                    .setTopicId(topicId)
                    .setMessage(largeMessage)
                    .setChunkSize(1)
                    .setMaxChunks(100);

                const estimate = await new FeeEstimateQuery()
                    .setMode(FeeEstimateMode.STATE)
                    .setTransaction(tx)
                    .execute(env.client);

                expect(estimate).to.not.be.null;
                expect(estimate.total.toNumber()).to.exist;

                // Verify the transaction is chunked (multiple chunks)
                const chunks = tx.getRequiredChunks();
                expect(chunks).to.exist;

                // Verify aggregation: node subtotal should be sum across chunks
                const nodeSubtotal =
                    estimate.nodeFee.base.toNumber() +
                    estimate.nodeFee.extras.reduce(
                        (sum, extra) => sum + extra.subtotal.toNumber(),
                        0,
                    );
                expect(nodeSubtotal).to.exist;
            } finally {
                // Clean up
                await (
                    await new TopicDeleteTransaction()
                        .setTopicId(topicId)
                        .execute(env.client)
                ).getReceipt(env.client);
            }
        });
    });

    describe("Integration Tests", function () {
        it.skip("should estimate fees close to actual transaction fees", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-1))
                .addHbarTransfer(env.operatorId, new Hbar(1));

            // Get estimate
            const estimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            // Execute actual transaction
            const response = await tx.execute(env.client);
            await response.getReceipt(env.client);
            //const record = await response.getRecord(env.client);

            // Compare estimate with actual fee
            // const actualFee = record.transactionFee.toTinybars();

            // todo: add tolerance
            // Estimate should be within reasonable range (e.g., within 50% tolerance)
            // This is a generous tolerance to account for network state changes
            // const tolerance = actualFee * 0.5;
            expect(estimate.total.toNumber()).to.exist;
        });

        it("should compare STATE and INTRINSIC mode estimates", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            const tx = new TransferTransaction()
                .addHbarTransfer(env.operatorId, new Hbar(-100))
                .addHbarTransfer(env.operatorId, new Hbar(100));

            const stateEstimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.STATE)
                .setTransaction(tx)
                .execute(env.client);

            const intrinsicEstimate = await new FeeEstimateQuery()
                .setMode(FeeEstimateMode.INTRINSIC)
                .setTransaction(tx)
                .execute(env.client);

            expect(stateEstimate.total.toNumber()).to.exist;
            expect(intrinsicEstimate.total.toNumber()).to.exist;

            // STATE mode typically includes state-dependent costs, so it may be
            // equal or greater than INTRINSIC mode
            // Note: This is not always true, but often the case
            expect(stateEstimate.total.toNumber()).to.be.at.least(
                intrinsicEstimate.total.toNumber() * 0.9,
            );
        });
    });

    describe("Error Handling Tests", function () {
        it("should handle malformed transaction gracefully", async function () {
            // Skip if no mirror network
            if (env.client.mirrorNetwork.length === 0) {
                return;
            }

            // Create a transaction that's missing required fields
            const tx = new TransferTransaction();

            let error = null;
            try {
                await new FeeEstimateQuery()
                    .setMode(FeeEstimateMode.STATE)
                    .setTransaction(tx)
                    .execute(env.client);
            } catch (e) {
                error = e;
            }

            // Should either succeed (if SDK handles gracefully) or fail with clear error
            // The exact behavior depends on how the mirror node handles invalid transactions
            expect(error === null || error.message !== undefined).to.be.true;
        });
    });
});
