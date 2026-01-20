import {
    CustomFixedFee,
    PrivateKey,
    PublicKey,
    TopicCreateTransaction,
    TopicInfoQuery,
    TopicUpdateTransaction,
    TopicMessageSubmitTransaction,
    Status,
    KeyList,
    AccountId,
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

    describe("HIP-1139: Immutable Topics", function () {
        it("should prevent message submission when Submit Key is updated to dead key", async function () {
            // Create a private topic with both Admin and Submit Keys
            const adminKey = PrivateKey.generateECDSA();
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Verify initial message submission works
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Test message before dead key")
                        .freezeWith(env.client)
                        .sign(submitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Update Submit Key to dead key using valid Admin Key signature
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(deadKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that no further messages can be submitted
            let messageSubmissionFailed = false;
            try {
                await (
                    await (
                        await new TopicMessageSubmitTransaction()
                            .setTopicId(topicId)
                            .setMessage("Test message after dead key")
                            .freezeWith(env.client)
                            .sign(submitKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                messageSubmissionFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(messageSubmissionFailed).to.be.true;
        });

        it("should allow message submission but prevent admin updates when Admin Key is updated to empty key list", async function () {
            // Create a private topic with both Admin and Submit Keys
            const adminKey = PrivateKey.generateECDSA();
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Update Admin Key to dead key using valid Admin Key signature
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setAdminKey(new KeyList())
                        .setAutoRenewAccountId(AccountId.fromString("0.0.0"))
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);
            console.log("vanko");

            // Verify messages can still be submitted with the submit key
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Message after admin key dead")
                        .freezeWith(env.client)
                        .sign(submitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that no further administrative updates can be made
            let adminUpdateFailed = false;
            try {
                await (
                    await (
                        await new TopicUpdateTransaction()
                            .setTopicId(topicId)
                            .setTopicMemo("Cannot update memo")
                            .freezeWith(env.client)
                            .sign(adminKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                adminUpdateFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(adminUpdateFailed).to.be.true;
        });

        it("should make topic fully immutable when both Admin and Submit keys are updated to dead keys", async function () {
            // Create a private topic with both Admin and Submit Keys
            const adminKey = PrivateKey.generateECDSA();
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Update both Submit Key and Admin Key to dead keys with valid Admin Key signature
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(deadKey)
                        .setAdminKey(new KeyList())
                        .setAutoRenewAccountId(AccountId.fromString("0.0.0"))
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that message submission fails
            let messageSubmissionFailed = false;
            try {
                await (
                    await (
                        await new TopicMessageSubmitTransaction()
                            .setTopicId(topicId)
                            .setMessage("Message should fail")
                            .freezeWith(env.client)
                            .sign(submitKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                messageSubmissionFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            // Verify that administrative updates fail
            let adminUpdateFailed = false;
            try {
                await (
                    await (
                        await new TopicUpdateTransaction()
                            .setTopicId(topicId)
                            .setTopicMemo("Should fail")
                            .freezeWith(env.client)
                            .sign(adminKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                adminUpdateFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(messageSubmissionFailed).to.be.true;
            expect(adminUpdateFailed).to.be.true;
        });

        it("should successfully update Submit Key to dead key when topic has only Submit Key", async function () {
            // Create a private topic with only Submit Key (no Admin Key)
            const submitKey = PrivateKey.generateECDSA();
            const adminKey = PrivateKey.generateECDSA();

            const { topicId } = await (
                await (
                    await new TopicCreateTransaction()
                        .setSubmitKey(submitKey.publicKey)
                        .setAdminKey(adminKey.publicKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify initial message submission works
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Test message before dead key")
                        .freezeWith(env.client)
                        .sign(submitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Update Submit Key to dead key with valid Submit Key signature
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(deadKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that no more messages can be submitted
            let messageSubmissionFailed = false;
            try {
                await (
                    await (
                        await new TopicMessageSubmitTransaction()
                            .setTopicId(topicId)
                            .setMessage("Message should fail")
                            .freezeWith(env.client)
                            .sign(submitKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                messageSubmissionFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(messageSubmissionFailed).to.be.true;
        });

        it("should make public topic administratively immutable when Admin Key is updated to empty key list", async function () {
            // Create a public topic with Admin Key but no Submit Key
            const adminKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Verify initial message submission works (no submit key required)
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Public message before dead admin key")
                ).execute(env.client)
            ).getReceipt(env.client);

            // Update Admin Key to dead key with valid Admin Key signature
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setAdminKey(new KeyList())
                        .setAutoRenewAccountId(AccountId.fromString("0.0.0"))
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify message submission still works (topic remains public)
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Public message after dead admin key")
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that administrative updates fail
            let adminUpdateFailed = false;
            try {
                await (
                    await (
                        await new TopicUpdateTransaction()
                            .setTopicId(topicId)
                            .setTopicMemo("Should fail")
                            .freezeWith(env.client)
                            .sign(adminKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                adminUpdateFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(adminUpdateFailed).to.be.true;
        });

        it("should fail message submission when Submit Key is dead", async function () {
            // Create a topic with dead Submit Key
            const adminKey = PrivateKey.generateECDSA();
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(deadKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Attempt message submission with any key should fail
            const someKey = PrivateKey.generateECDSA();
            let messageSubmissionFailed = false;
            try {
                await (
                    await (
                        await new TopicMessageSubmitTransaction()
                            .setTopicId(topicId)
                            .setMessage("Should fail")
                            .freezeWith(env.client)
                            .sign(someKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                messageSubmissionFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(messageSubmissionFailed).to.be.true;
        });

        it("should fail to update Submit Key to dead key without valid Submit Key signature", async function () {
            // Create a topic with Submit Key
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Attempt to update Submit Key without proper signature
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));
            const unauthorizedKey = PrivateKey.generateECDSA();

            let updateFailed = false;
            try {
                await (
                    await (
                        await new TopicUpdateTransaction()
                            .setTopicId(topicId)
                            .setSubmitKey(deadKey)
                            .freezeWith(env.client)
                            .sign(unauthorizedKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                updateFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(updateFailed).to.be.true;
        });

        it("should fail to update Admin Key to dead key without valid Admin Key signature", async function () {
            // Create a topic with Admin Key
            const adminKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Attempt to update Admin Key without proper signature
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));
            const unauthorizedKey = PrivateKey.generateECDSA();

            let updateFailed = false;
            try {
                await (
                    await (
                        await new TopicUpdateTransaction()
                            .setTopicId(topicId)
                            .setAdminKey(deadKey)
                            .setAutoRenewAccountId(
                                AccountId.fromString("0.0.0"),
                            )
                            .freezeWith(env.client)
                            .sign(unauthorizedKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                updateFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(updateFailed).to.be.true;
        });

        it("should successfully update Submit Key to dead key with valid Admin Key signature", async function () {
            // Create a topic with both Admin and Submit Keys
            const adminKey = PrivateKey.generateECDSA();
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Update Submit Key to dead key using Admin Key signature (should succeed)
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(deadKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify the update was successful by checking topic info
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.submitKey.toString()).to.equal(deadKey.toString());
        });

        it("should successfully update Submit Key from dead key to valid key with Admin Key signature", async function () {
            // Create a topic with Admin Key and dead Submit Key
            const adminKey = PrivateKey.generateECDSA();
            const deadKey = PublicKey.fromBytes(new Uint8Array(32));

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(deadKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Update Submit Key from dead key to valid key using Admin Key signature
            const newSubmitKey = PrivateKey.generateECDSA();
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(newSubmitKey.publicKey)
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify the update was successful by submitting a message
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Message with restored submit key")
                        .freezeWith(env.client)
                        .sign(newSubmitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify topic info shows the new key
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.submitKey.toString()).to.equal(
                newSubmitKey.publicKey.toString(),
            );
        });

        it("should allow message submission without signature when Submit Key is updated to empty key list", async function () {
            // Create a private topic with both Admin and Submit Keys
            const adminKey = PrivateKey.generateECDSA();
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Verify initial message submission works with submit key
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Test message before empty key list")
                        .freezeWith(env.client)
                        .sign(submitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Update Submit Key to empty key list using valid Admin Key signature
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(new KeyList())
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that messages can be submitted without any signature (public topic behavior)
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Test message after empty key list")
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify topic info shows empty submit key
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.submitKey).to.be.null;
        });

        it("should allow message submission without signature when Submit Key is updated to empty key list with only Submit Key", async function () {
            // Create a private topic with only Submit Key (no Admin Key)
            const submitKey = PrivateKey.generateECDSA();
            const adminKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setSubmitKey(submitKey.publicKey)
                .setAdminKey(adminKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Verify initial message submission works with submit key
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Test message before empty key list")
                        .freezeWith(env.client)
                        .sign(submitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Update Submit Key to empty key list using valid Submit Key signature
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setSubmitKey(new KeyList())
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that messages can be submitted without any signature (public topic behavior)
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Test message after empty key list")
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify topic info shows empty submit key
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.submitKey).to.be.null;
        });

        it("should properly handle Admin Key updated to empty key list maintaining message submission capability", async function () {
            // Create a private topic with both Admin and Submit Keys
            const adminKey = PrivateKey.generateECDSA();
            const submitKey = PrivateKey.generateECDSA();

            const response = new TopicCreateTransaction()
                .setAdminKey(adminKey.publicKey)
                .setSubmitKey(submitKey.publicKey)
                .freezeWith(env.client);

            await response.sign(adminKey);
            await response.sign(submitKey);
            const receipt = await response.execute(env.client);

            const topicId = (await receipt.getReceipt(env.client)).topicId;

            // Update Admin Key to empty key list using valid Admin Key signature
            await (
                await (
                    await new TopicUpdateTransaction()
                        .setTopicId(topicId)
                        .setAdminKey(new KeyList())
                        .setAutoRenewAccountId(AccountId.fromString("0.0.0"))
                        .freezeWith(env.client)
                        .sign(adminKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify messages can still be submitted with the submit key
            await (
                await (
                    await new TopicMessageSubmitTransaction()
                        .setTopicId(topicId)
                        .setMessage("Message after admin key made empty")
                        .freezeWith(env.client)
                        .sign(submitKey)
                ).execute(env.client)
            ).getReceipt(env.client);

            // Verify that no further administrative updates can be made
            let adminUpdateFailed = false;
            try {
                await (
                    await (
                        await new TopicUpdateTransaction()
                            .setTopicId(topicId)
                            .setTopicMemo("Cannot update memo")
                            .freezeWith(env.client)
                            .sign(adminKey)
                    ).execute(env.client)
                ).getReceipt(env.client);
            } catch (error) {
                adminUpdateFailed =
                    error
                        .toString()
                        .includes(Status.InvalidSignature.toString()) ||
                    error.toString().includes(Status.Unauthorized.toString());
            }

            expect(adminUpdateFailed).to.be.true;

            // Verify topic info shows empty admin key but valid submit key
            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.adminKey).to.be.null;
            expect(info.submitKey).to.not.be.null;
            expect(info.submitKey.toString()).to.equal(
                submitKey.publicKey.toString(),
            );
        });
    });

    afterEach(async function () {
        await env.close();
    });
});
