import {
    CustomFixedFee,
    PrivateKey,
    TopicCreateTransaction,
    TopicInfoQuery,
    TopicUpdateTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createFungibleToken } from "./utils/Fixtures.js";

/**
 * @typedef {import("./client/BaseIntegrationTestEnv.js").default} BaseIntegrationTestEnv
 */

describe("TopicUpdate", function () {
    /**
     * @type {BaseIntegrationTestEnv}
     */
    let env;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    describe("HIP-991: Permissionless revenue generating topics", function () {
        it("should maintain empty list state for feeExemptKeys and customFees when not set", async function () {
            // Create a topic with admin and fee schedule keys but no fee exempt keys or custom fees
            const response = await new TopicCreateTransaction()
                .setAdminKey(env.client.operatorPublicKey)
                .setFeeScheduleKey(env.client.operatorPublicKey)
                .execute(env.client);

            const topicId = (await response.getReceipt(env.client)).topicId;

            // Verify that fee exempt keys and custom fees are null in the topic info
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.feeExemptKeys).to.be.empty;
            expect(info.customFees).to.be.empty;

            // Update the topic without setting fee exempt keys or custom fees
            const updateResponse = await new TopicUpdateTransaction()
                .setTopicId(topicId)
                .execute(env.client);

            await updateResponse.getReceipt(env.client);

            // Verify that fee exempt keys and custom fees are still null after update
            const updatedInfo = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(updatedInfo.feeExemptKeys).to.be.empty;
            expect(updatedInfo.customFees).to.be.empty;
        });

        it("should properly update feeExemptKeys and customFees to empty list", async function () {
            // Create fee exempt keys and custom fees for initial setup
            const feeExemptKeys = [
                PrivateKey.generateECDSA(),
                PrivateKey.generateECDSA(),
            ];

            const denominatingTokenId = await createFungibleToken(env.client);
            const customFixedFee = new CustomFixedFee()
                .setFeeCollectorAccountId(env.client.operatorAccountId)
                .setDenominatingTokenId(denominatingTokenId)
                .setAmount(1);

            // Create a topic with fee exempt keys and custom fees
            const response = await new TopicCreateTransaction()
                .setAdminKey(env.client.operatorPublicKey)
                .setFeeScheduleKey(env.client.operatorPublicKey)
                .setFeeExemptKeys(feeExemptKeys)
                .addCustomFee(customFixedFee)
                .execute(env.client);

            const topicId = (await response.getReceipt(env.client)).topicId;

            // Verify that fee exempt keys and custom fees are set in the topic info
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.feeExemptKeys).to.not.be.null;
            expect(info.customFees).to.not.be.null;

            // Update the topic and explicitly set fee exempt keys and custom fees to empty lists
            const updateResponse = await new TopicUpdateTransaction()
                .setTopicId(topicId)
                .clearCustomFees()
                .clearFeeExemptKeys()
                .execute(env.client);

            await updateResponse.getReceipt(env.client);

            // Verify that fee exempt keys and custom fees are now empty lists
            const updatedInfo = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(updatedInfo.feeExemptKeys).to.be.empty;
            expect(updatedInfo.customFees).to.be.empty;
        });

        it("should preserve feeExemptKeys and customFees when other fields are updated", async function () {
            // Create fee exempt keys and custom fees for initial setup
            const feeExemptKeys = [
                PrivateKey.generateECDSA(),
                PrivateKey.generateECDSA(),
            ];

            const denominatingTokenId = await createFungibleToken(env.client);
            const customFixedFee = new CustomFixedFee()
                .setFeeCollectorAccountId(env.client.operatorAccountId)
                .setDenominatingTokenId(denominatingTokenId)
                .setAmount(1);

            // Create a topic with fee exempt keys and custom fees
            const response = await new TopicCreateTransaction()
                .setAdminKey(env.client.operatorPublicKey)
                .setFeeScheduleKey(env.client.operatorPublicKey)
                .setFeeExemptKeys(feeExemptKeys)
                .addCustomFee(customFixedFee)
                .execute(env.client);

            const topicId = (await response.getReceipt(env.client)).topicId;

            // Update a different field (topic memo) without touching fee exempt keys or custom fees
            const updateResponse = await new TopicUpdateTransaction()
                .setTopicId(topicId)
                .setTopicMemo("Updated topic memo")
                .execute(env.client);

            await updateResponse.getReceipt(env.client);

            // Verify that fee exempt keys and custom fees are preserved
            const updatedInfo = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(updatedInfo.feeExemptKeys).to.not.be.null;
            expect(updatedInfo.feeExemptKeys.length).to.equal(
                feeExemptKeys.length,
            );
            expect(updatedInfo.customFees).to.not.be.null;
            expect(updatedInfo.customFees.length).to.equal(1);
            expect(updatedInfo.topicMemo).to.equal("Updated topic memo");
        });
    });

    afterEach(async function () {
        await env.close();
    });
});
