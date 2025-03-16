import {
    AccountBalanceQuery,
    AccountCreateTransaction,
    CustomFeeLimit,
    CustomFixedFee,
    Hbar,
    PrivateKey,
    PublicKey,
    Status,
    TokenId,
    TopicCreateTransaction,
    TopicDeleteTransaction,
    TopicInfoQuery,
    TopicMessageSubmitTransaction,
    TopicUpdateTransaction,
    TransactionId,
    TransferTransaction,
} from "../../src/exports.js";
import IntegrationTestEnv from "./client/NodeIntegrationTestEnv.js";
import { createAccount, createFungibleToken } from "./utils/Fixtures.js";

/**
 * @typedef {import("./client/BaseIntegrationTestEnv.js").default} BaseIntegrationTestEnv
 */

describe("TopicCreate", function () {
    /**
     * @type {BaseIntegrationTestEnv}
     */
    let env;

    beforeEach(async function () {
        env = await IntegrationTestEnv.new();
    });

    it("should be executable", async function () {
        const operatorId = env.operatorId;
        const operatorKey = env.operatorKey.publicKey;

        const response = await new TopicCreateTransaction()
            .setAdminKey(operatorKey)
            .setSubmitKey(operatorKey)
            .execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        const info = await new TopicInfoQuery()
            .setTopicId(topic)
            .execute(env.client);

        expect(info.topicId.toString()).to.eql(topic.toString());
        expect(info.topicMemo).to.eql("");
        expect(info.runningHash.length).to.be.eql(48);
        expect(info.sequenceNumber.toInt()).to.eql(0);
        expect(info.adminKey.toString()).to.eql(operatorKey.toString());
        expect(info.submitKey.toString()).to.eql(operatorKey.toString());
        expect(info.autoRenewAccountId.toString()).to.be.eql(
            operatorId.toString(),
        );
        expect(info.autoRenewPeriod.seconds.toInt()).to.be.eql(7776000);
        expect(info.expirationTime).to.be.not.null;

        await (
            await new TopicDeleteTransaction()
                .setTopicId(topic)
                .execute(env.client)
        ).getReceipt(env.client);
    });

    it("should be executable when no fields are set", async function () {
        const response = await new TopicCreateTransaction().execute(env.client);

        const topic = (await response.getReceipt(env.client)).topicId;

        const info = await new TopicInfoQuery()
            .setTopicId(topic)
            .execute(env.client);

        expect(info.topicId.toString()).to.eql(topic.toString());
        expect(info.topicMemo).to.eql("");
        expect(info.runningHash.length).to.be.eql(48);
        expect(info.sequenceNumber.toInt()).to.eql(0);
        expect(info.adminKey).to.be.null;
        expect(info.submitKey).to.be.null;
        // as per HIP-1021 autoRenewAccountId should be set to the operator account id
        expect(info.autoRenewAccountId.toString()).to.equal(
            env.client.operatorAccountId.toString(),
        );
        expect(info.autoRenewPeriod.seconds.toInt()).to.be.eql(7776000);
        expect(info.expirationTime).to.be.not.null;
    });

    it("should set autorenew account from transaction ID", async function () {
        // Create a new account with 10 Hbar
        const accountKey = PrivateKey.generateECDSA();
        const response = await new AccountCreateTransaction()
            .setKeyWithoutAlias(accountKey.publicKey)
            .setInitialBalance(new Hbar(10))
            .execute(env.client);

        const { accountId } = await response.getReceipt(env.client);

        // Create transaction ID with the new account
        const txId = TransactionId.generate(accountId);

        // Create and freeze token transaction
        const frozenTxn = await (
            await new TopicCreateTransaction()
                .setTransactionId(txId)
                .freezeWith(env.client)
                .sign(accountKey)
        ).execute(env.client);

        const { topicId } = await frozenTxn.getReceipt(env.client);

        // Query token info
        const info = await new TopicInfoQuery()
            .setNodeAccountIds([frozenTxn.nodeId])
            .setTopicId(topicId)
            .execute(env.client);

        console.log("created account id", accountId);
        console.log("topic account id", info.autoRenewAccountId);

        // Verify autoRenewAccountId matches the account that created the token
        expect(info.autoRenewAccountId.toString()).to.equal(
            accountId.toString(),
        );
    });

    describe("HIP-991: Permissionless revenue generating topics", function () {
        it("creates and updates revenue generating topic", async function () {
            const feeExemptKeys = [
                PrivateKey.generateECDSA(),
                PrivateKey.generateECDSA(),
            ];

            const denominatingTokenId1 = await createFungibleToken(env.client);
            const amount1 = 1;

            const denominatingTokenId2 = await createFungibleToken(
                env.client,
                (transaction) => {
                    transaction.setTokenName("denom2").setTokenSymbol("D2");
                },
            );

            const amount2 = 2;

            const customFixedFees = [
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.client.operatorAccountId)
                    .setDenominatingTokenId(denominatingTokenId1)
                    .setAmount(amount1),
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.client.operatorAccountId)
                    .setDenominatingTokenId(denominatingTokenId2)
                    .setAmount(amount2),
            ];

            const response = await new TopicCreateTransaction()
                .setFeeScheduleKey(env.client.operatorPublicKey)
                .setSubmitKey(env.client.operatorPublicKey)
                .setAdminKey(env.client.operatorPublicKey)
                .setFeeExemptKeys(feeExemptKeys)
                .setCustomFees(customFixedFees)
                .execute(env.client);

            const topicId = (await response.getReceipt(env.client)).topicId;

            const info = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(info.feeScheduleKey.toString()).to.eql(
                env.client.operatorPublicKey.toString(),
            );

            feeExemptKeys.forEach((feeExemptKey, index) => {
                expect(info.feeExemptKeys[index].toString()).to.eql(
                    feeExemptKey.publicKey.toString(),
                );
            });

            customFixedFees.forEach((customFixedFee, index) => {
                expect(info.customFees[index].amount.toString()).to.eql(
                    customFixedFee.amount.toString(),
                );
                expect(
                    info.customFees[index].denominatingTokenId.toString(),
                ).to.eql(customFixedFee.denominatingTokenId.toString());
            });

            // Update the revenue generating topic
            const newFeeExemptKeys = [
                PrivateKey.generateECDSA(),
                PrivateKey.generateECDSA(),
            ];

            const newFeeScheduleKey = PrivateKey.generateECDSA();

            const newAmount1 = 3;

            const newDenominatingTokenId1 = await createFungibleToken(
                env.client,
                (transaction) => {
                    transaction.setTokenName("Favor").setTokenSymbol("FVR");
                },
            );

            const newAmount2 = 4;

            const newDenominatingTokenId2 = await createFungibleToken(
                env.client,
                (transaction) => {
                    transaction.setTokenName("Duty").setTokenSymbol("DUT");
                },
            );

            const newCustomFixedFees = [
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.client.operatorAccountId)
                    .setAmount(newAmount1)
                    .setDenominatingTokenId(newDenominatingTokenId1),
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.client.operatorAccountId)
                    .setAmount(newAmount2)
                    .setDenominatingTokenId(newDenominatingTokenId2),
            ];

            const updateResponse = await new TopicUpdateTransaction()
                .setTopicId(topicId)
                .setFeeExemptKeys(newFeeExemptKeys)
                .setFeeScheduleKey(newFeeScheduleKey.publicKey)
                .setCustomFees(newCustomFixedFees)
                .execute(env.client);

            await updateResponse.getReceipt(env.client);

            const updatedInfo = await new TopicInfoQuery()
                .setTopicId(topicId)
                .execute(env.client);

            expect(updatedInfo.feeScheduleKey.toString()).to.eql(
                newFeeScheduleKey.publicKey.toString(),
            );

            newFeeExemptKeys.forEach((feeExemptKey, index) => {
                expect(updatedInfo.feeExemptKeys[index].toString()).to.eql(
                    feeExemptKey.publicKey.toString(),
                );
            });

            newCustomFixedFees.forEach((customFixedFee, index) => {
                expect(updatedInfo.customFees[index].amount.toString()).to.eql(
                    customFixedFee.amount.toString(),
                );
                expect(
                    updatedInfo.customFees[
                        index
                    ].denominatingTokenId.toString(),
                ).to.eql(customFixedFee.denominatingTokenId.toString());
            });
        });

        it("should fail to create a revenue generating topic with invalid fee exempt key", async function () {
            const feeExemptKey = PrivateKey.generateECDSA();

            const feeExemptKeyListWithDuplicates = [feeExemptKey, feeExemptKey];

            // Duplicate exempt key - fails with FEE_EXEMPT_KEY_LIST_CONTAINS_DUPLICATED_KEYS
            try {
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeExemptKeys(feeExemptKeyListWithDuplicates)
                    .execute(env.client);
            } catch (e) {
                expect(
                    e.message.includes(
                        Status.FeeExemptKeyListContainsDuplicatedKeys.toString(),
                    ),
                ).to.be.true;
            }

            const invalidKey = PublicKey.fromString(
                "000000000000000000000000000000000000000000000000000000000000000000",
            );

            // Invalid exempt key - fails with INVALID_KEY_IN_FEE_EXEMPT_KEY_LIST

            try {
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeExemptKeys([invalidKey])
                    .execute(env.client);
            } catch (e) {
                expect(
                    e.message.includes(
                        Status.InvalidKeyInFeeExemptKeyList.toString(),
                    ),
                ).to.be.true;
            }

            // Create a list with 11 keys
            const feeExemptKeyListExceedingLimit = [
                ...new Array(11).fill(null).map(PrivateKey.generateECDSA),
            ];

            // Set 11 keys - fails with MAX_ENTRIES_FOR_FEE_EXEMPT_KEY_LIST_EXCEEDED

            try {
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeExemptKeys(feeExemptKeyListExceedingLimit)
                    .execute(env.client);
            } catch (e) {
                expect(
                    e.message.includes(
                        Status.MaxEntriesForFeeExemptKeyListExceeded.toString(),
                    ),
                ).to.be.true;
            }
        });

        it("should fail to update fee schedule key", async function () {
            // Create a revenue generating topic without fee schedule key
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .execute(env.client)
            ).getReceipt(env.client);

            const newFeeScheduleKey = PrivateKey.generateECDSA();

            // Update the revenue generating topic with new fee schedule key - fails with FEE_SCHEDULE_KEY_CANNOT_BE_UPDATED

            try {
                await new TopicUpdateTransaction()
                    .setTopicId(topicId)
                    .setFeeScheduleKey(newFeeScheduleKey.publicKey)
                    .execute(env.client);
            } catch (e) {
                expect(
                    e.message.includes(
                        Status.FeeScheduleKeyCannotBeUpdated.toString(),
                    ),
                ).to.be.true;
            }
        });

        it("should fail to update custom fees", async function () {
            // Create a revenue generating topic without fee schedule key
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .execute(env.client)
            ).getReceipt(env.client);

            const denominatingTokenId1 = await createFungibleToken(env.client);
            const amount1 = 1;

            const denominatingTokenId2 = await createFungibleToken(
                env.client,
                (transaction) => {
                    transaction.setTokenName("denom2").setTokenSymbol("D2");
                },
            );

            const amount2 = 2;

            const customFixedFees = [
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.client.operatorAccountId)
                    .setDenominatingTokenId(denominatingTokenId1)
                    .setAmount(amount1),
                new CustomFixedFee()
                    .setFeeCollectorAccountId(env.client.operatorAccountId)
                    .setDenominatingTokenId(denominatingTokenId2)
                    .setAmount(amount2),
            ];

            // Update the revenue generating topic with new custom fees - fails with FEE_SCHEDULE_KEY_NOT_SET
            try {
                await new TopicUpdateTransaction()
                    .setTopicId(topicId)
                    .setCustomFees(customFixedFees)
                    .execute(env.client);
            } catch (e) {
                expect(
                    e.message.includes(Status.FeeScheduleKeyNotSet.toString()),
                ).to.be.true;
            }
        });

        it("should charge hbars with limit", async function () {
            const hbar = 100_000_000;

            const customFixedFee = new CustomFixedFee()
                .setFeeCollectorAccountId(env.client.operatorAccountId)
                .setAmount(hbar / 2);

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .addCustomFee(customFixedFee)

                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer with 1 Hbar
            const {
                accountId: payerAccountId,
                newKey: payerAccountPrivateKey,
            } = await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(1));
            });

            const customFeeLimit = new CustomFeeLimit()
                .setAccountId(payerAccountId)
                .setFees([customFixedFee]);

            // Submit a message to the revenue generating topic with custom fee limit
            env.client.setOperator(payerAccountId, payerAccountPrivateKey);

            const submitMessageResponse =
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .addCustomFeeLimit(customFeeLimit)
                    .freezeWith(env.client)
                    .execute(env.client);

            await submitMessageResponse.getReceipt(env.client);

            env.client.setOperator(env.operatorId, env.operatorKey);

            // Verify the custom fee charged

            const accountInfo = await new AccountBalanceQuery()
                .setAccountId(payerAccountId)
                .execute(env.client);

            expect(accountInfo.hbars.toTinybars().toNumber()).to.be.below(
                hbar / 2,
            );
        });

        it("should charge tokens with limit", async function () {
            const tokenId = await createFungibleToken(env.client);

            const customFixedFee = new CustomFixedFee()
                .setAmount(1)
                .setDenominatingTokenId(tokenId)
                .setFeeCollectorAccountId(env.client.operatorAccountId);

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .addCustomFee(customFixedFee)

                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer
            const {
                accountId: payerAccountId,
                newKey: payerAccountPrivateKey,
            } = await createAccount(env.client, (transaction) => {
                transaction.setMaxAutomaticTokenAssociations(-1);
            });

            // Send tokens to payer
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.client.operatorAccountId, -1)
                    .addTokenTransfer(tokenId, payerAccountId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            const customFeeLimit = new CustomFeeLimit()
                .setAccountId(payerAccountId)
                .setFees([
                    new CustomFixedFee()
                        .setAmount(1)
                        .setDenominatingTokenId(tokenId),
                ]);

            // Submit a message to the revenue generating topic with custom fee limit
            env.client.setOperator(payerAccountId, payerAccountPrivateKey);

            const submitMessageResponse =
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .addCustomFeeLimit(customFeeLimit)
                    .freezeWith(env.client)
                    .execute(env.client);

            await submitMessageResponse.getReceipt(env.client);

            env.client.setOperator(env.operatorId, env.operatorKey);

            // Verify the custom fee charged

            const accountInfo = await new AccountBalanceQuery()
                .setAccountId(payerAccountId)
                .execute(env.client);

            expect(accountInfo.tokens.get(tokenId).toNumber()).to.be.eql(0);
        });

        it("should charge tokens without limit", async function () {
            const tokenId = await createFungibleToken(env.client);

            const customFixedFee = new CustomFixedFee()
                .setAmount(1)
                .setDenominatingTokenId(tokenId)
                .setFeeCollectorAccountId(env.client.operatorAccountId);

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .addCustomFee(customFixedFee)

                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer
            const {
                accountId: payerAccountId,
                newKey: payerAccountPrivateKey,
            } = await createAccount(env.client, (transaction) => {
                transaction.setMaxAutomaticTokenAssociations(-1);
            });

            // Send tokens to payer
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.client.operatorAccountId, -1)
                    .addTokenTransfer(tokenId, payerAccountId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Submit a message to the revenue generating topic without custom fee limit
            env.client.setOperator(payerAccountId, payerAccountPrivateKey);

            const submitMessageResponse =
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .freezeWith(env.client)
                    .execute(env.client);

            await submitMessageResponse.getReceipt(env.client);

            env.client.setOperator(env.operatorId, env.operatorKey);

            // Verify the custom fee charged

            const accountInfo = await new AccountBalanceQuery()
                .setAccountId(payerAccountId)
                .execute(env.client);

            expect(accountInfo.tokens.get(tokenId).toNumber()).to.be.eql(0);
        });

        it("should not charge hbars for fee exempt keys", async function () {
            const hbar = 100_000_000;

            const customFixedFee = new CustomFixedFee()
                .setFeeCollectorAccountId(env.client.operatorAccountId)
                .setAmount(hbar / 2);

            const feeExemptKey1 = PrivateKey.generateECDSA();
            const feeExemptKey2 = PrivateKey.generateECDSA();

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .setFeeExemptKeys([feeExemptKey1, feeExemptKey2])
                    .addCustomFee(customFixedFee)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer with 1 Hbar and fee exempt key
            const { accountId: payerAccountId } = await createAccount(
                env.client,
                (transaction) => {
                    transaction.setInitialBalance(new Hbar(1));
                    transaction.setKeyWithoutAlias(feeExemptKey1);
                },
            );

            // Submit a message to the revenue generating topic without custom fee limit
            env.client.setOperator(payerAccountId, feeExemptKey1);

            const submitMessageResponse =
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .execute(env.client);

            await submitMessageResponse.getReceipt(env.client);

            env.client.setOperator(env.operatorId, env.operatorKey);

            // Verify the custom fee is not charged

            const accountInfo = await new AccountBalanceQuery()
                .setAccountId(payerAccountId)
                .execute(env.client);

            expect(accountInfo.hbars.toTinybars().toNumber()).to.be.above(
                hbar / 2,
            );
        });

        it("should not charge tokens for fee exempt keys", async function () {
            const tokenId = await createFungibleToken(env.client);

            const customFixedFee = new CustomFixedFee()
                .setDenominatingTokenId(tokenId)
                .setFeeCollectorAccountId(env.client.operatorAccountId)
                .setAmount(1);

            const feeExemptKey1 = PrivateKey.generateECDSA();
            const feeExemptKey2 = PrivateKey.generateECDSA();

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .setFeeExemptKeys([feeExemptKey1, feeExemptKey2])
                    .addCustomFee(customFixedFee)

                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer with fee exempt key and unlimited token associations
            const { accountId: payerAccountId } = await createAccount(
                env.client,
                (transaction) => {
                    transaction
                        .setKeyWithoutAlias(feeExemptKey1.publicKey)
                        .setMaxAutomaticTokenAssociations(-1);
                },
            );

            // Send tokens to payer
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.client.operatorAccountId, -1)
                    .addTokenTransfer(tokenId, payerAccountId, 1)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Submit a message to the revenue generating topic without custom fee limit
            env.client.setOperator(payerAccountId, feeExemptKey1);

            const submitMessageResponse =
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .execute(env.client);

            await submitMessageResponse.getReceipt(env.client);

            env.client.setOperator(env.operatorId, env.operatorKey);

            // Verify the custom fee is not charged

            const accountInfo = await new AccountBalanceQuery()
                .setAccountId(payerAccountId)
                .execute(env.client);

            expect(accountInfo.tokens.get(tokenId).toNumber()).to.eql(1);
        });

        it("should not charge hbars with lower limit", async function () {
            const hbar = 100_000_000;

            const customFixedFee = new CustomFixedFee()
                .setFeeCollectorAccountId(env.client.operatorAccountId)
                .setAmount(hbar / 2);

            // Create a revenue generating topic with Hbar custom fee
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .addCustomFee(customFixedFee)

                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer with 1 Hbar
            const {
                accountId: payerAccountId,
                newKey: payerAccountPrivateKey,
            } = await createAccount(env.client, (transaction) => {
                transaction.setInitialBalance(new Hbar(1));
            });

            // Set custom fee limit with lower amount than the custom fee
            const customFeeLimit = new CustomFeeLimit()
                .setAccountId(payerAccountId)
                .setFees([new CustomFixedFee().setAmount(hbar / 2 - 1)]);

            // Submit a message to the revenue generating topic with custom fee limit
            env.client.setOperator(payerAccountId, payerAccountPrivateKey);

            try {
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .addCustomFeeLimit(customFeeLimit)
                    .freezeWith(env.client)
                    .execute(env.client);
            } catch (e) {
                expect(e.message).to.include(Status.MaxCustomFeeLimitExceeded);
            }
        });

        it("should not charge tokens with lower limit", async function () {
            const tokenId = await createFungibleToken(env.client);

            const customFixedFee = new CustomFixedFee()
                .setAmount(2)
                .setDenominatingTokenId(tokenId)
                .setFeeCollectorAccountId(env.client.operatorAccountId);

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .addCustomFee(customFixedFee)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer with unlimited token associacions
            const {
                accountId: payerAccountId,
                newKey: payerAccountPrivateKey,
            } = await createAccount(env.client, (transaction) => {
                transaction.setMaxAutomaticTokenAssociations(-1);
            });

            // Send tokens to payer
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.client.operatorAccountId, -2)
                    .addTokenTransfer(tokenId, payerAccountId, 2)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Set custom fee limit with lower amount than the custom fee
            const customFeeLimit = new CustomFeeLimit()
                .setAccountId(payerAccountId)
                .setFees([
                    new CustomFixedFee()
                        .setAmount(1)
                        .setDenominatingTokenId(tokenId),
                ]);

            // Submit a message to the revenue generating topic with custom fee limit
            env.client.setOperator(payerAccountId, payerAccountPrivateKey);

            // Submit a message to the revenue generating topic with custom fee limit - fails with MAX_CUSTOM_FEE_LIMIT_EXCEEDED
            try {
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .addCustomFeeLimit(customFeeLimit)
                    .freezeWith(env.client)
                    .execute(env.client);
            } catch (e) {
                expect(e.message).to.include(Status.MaxCustomFeeLimitExceeded);
            }
        });

        it("should not execute with invalid custom fee limit", async function () {
            const tokenId = await createFungibleToken(env.client);

            const customFixedFee = new CustomFixedFee()
                .setAmount(2)
                .setDenominatingTokenId(tokenId)
                .setFeeCollectorAccountId(env.client.operatorAccountId);

            // Create a revenue generating topic
            const { topicId } = await (
                await new TopicCreateTransaction()
                    .setAdminKey(env.client.operatorPublicKey)
                    .setFeeScheduleKey(env.client.operatorPublicKey)
                    .addCustomFee(customFixedFee)

                    .execute(env.client)
            ).getReceipt(env.client);

            // Create payer with unlimited token associacions
            const {
                accountId: payerAccountId,
                newKey: payerAccountPrivateKey,
            } = await createAccount(env.client, (transaction) => {
                transaction.setMaxAutomaticTokenAssociations(-1);
            });

            // Send tokens to payer
            await (
                await new TransferTransaction()
                    .addTokenTransfer(tokenId, env.client.operatorAccountId, -2)
                    .addTokenTransfer(tokenId, payerAccountId, 2)
                    .execute(env.client)
            ).getReceipt(env.client);

            // Set custom fee limit with lower amount than the custom fee
            let customFeeLimit = new CustomFeeLimit()
                .setAccountId(payerAccountId)
                .setFees([
                    new CustomFixedFee()
                        .setAmount(1)
                        .setDenominatingTokenId(new TokenId(0)),
                ]);

            // Submit a message to the revenue generating topic with custom fee limit
            env.client.setOperator(payerAccountId, payerAccountPrivateKey);

            // Submit a message to the revenue generating topic with invalid custom fee limit - fails with NO_VALID_MAX_CUSTOM_FEE
            try {
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .addCustomFeeLimit(customFeeLimit)
                    .freezeWith(env.client)
                    .execute(env.client);
            } catch (e) {
                expect(e.message).to.include(Status.NoValidMaxCustomFee);
            }

            customFeeLimit = new CustomFeeLimit()
                .setAccountId(payerAccountId)
                .setFees([
                    new CustomFixedFee()
                        .setAmount(1)
                        .setDenominatingTokenId(tokenId),
                    new CustomFixedFee()
                        .setAmount(2)
                        .setDenominatingTokenId(tokenId),
                ]);
            // Submit a message to the revenue generating topic - fails with DUPLICATE_DENOMINATION_IN_MAX_CUSTOM_FEE_LIST
            try {
                await new TopicMessageSubmitTransaction()
                    .setMessage("Hello, Hedera!")
                    .setTopicId(topicId)
                    .addCustomFeeLimit(customFeeLimit)
                    .freezeWith(env.client)
                    .execute(env.client);
            } catch (e) {
                expect(e.message).to.include(
                    Status.DuplicateDenominationInMaxCustomFeeList,
                );
            }
        });
    });

    after(async function () {
        await env.close();
    });
});
