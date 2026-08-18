import { TokenCreateTransaction } from "@hiero-ledger/sdk";
import { TopicUpdateTransaction } from "@hiero-ledger/sdk";
import { TransferTransaction } from "@hiero-ledger/sdk";
import {
    AccountInfoQuery,
    MirrorNodeAccountBalanceQuery,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    AccountCreateTransaction,
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    CustomFixedFee,
    CustomFeeLimit,
    HbarUnit,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 *
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    try {
        /*
         * Step 1:
         * Create account - alice
         */
        console.log("Creating account - alice");

        const aliceKey = PrivateKey.generateECDSA();

        const { accountId: aliceAccountId } = await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(aliceKey)
                .setInitialBalance(new Hbar(5))
                .setMaxAutomaticTokenAssociations(100)
                .execute(client)
        ).getReceipt(client);

        console.log(`Alice's account ID: ${aliceAccountId.toString()}`);

        /*
         * Step 2:
         * Create a topic with hbar custom fee
         */

        console.log("Create a topic with hbar custom fee");

        const customFee = new CustomFixedFee()
            .setAmount(new Hbar(1).toTinybars())
            .setFeeCollectorAccountId(operatorId);

        const { topicId } = await (
            await new TopicCreateTransaction()
                .setAdminKey(operatorKey)
                .setFeeScheduleKey(operatorKey)
                .setCustomFees([customFee])
                .execute(client)
        ).getReceipt(client);

        console.log(`Created a topic with id: ${topicId.toString()}`);

        /*
         * Step 3:
         * Submit a message to that topic, paid for by alice, specifying max custom fee amount bigger than the topic’s amount.
         */

        // The account above was only just created and funded. The mirror node
        // ingests consensus state asynchronously, so wait for it to see the
        // account — otherwise it reports a zero balance for a funded account.
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Only the HBAR balance is compared in this step, so it is read from
        // the free mirror node rather than with a paid `AccountInfoQuery`.
        let aliceBalanceBefore = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(aliceAccountId)
            .execute(client);

        let feeCollectorBalanceBefore =
            await new MirrorNodeAccountBalanceQuery()
                .setAccountId(operatorId)
                .execute(client);

        console.log("Submitting a message as alice to the topic");

        const customFeeLimit = new CustomFeeLimit()
            .setAccountId(aliceAccountId)
            .setFees([
                new CustomFixedFee().setAmount(
                    Hbar.from(2, HbarUnit.Hbar).toTinybars(),
                ),
            ]);

        client.setOperator(aliceAccountId, aliceKey);

        await (
            await new TopicMessageSubmitTransaction()
                .setCustomFeeLimits([customFeeLimit])
                .setTopicId(topicId)
                .setMessage("Hello, Hedera™ hashgraph!")
                .execute(client)
        ).getReceipt(client);

        console.log("Message submitted successfully");

        /*
         * Step 4:
         * Verify alice was debited the fee amount and the fee collector account was credited the amount.
         */

        client.setOperator(operatorId, operatorKey);

        // The mirror node ingests consensus state asynchronously, so give it a
        // moment to catch up before reading the balances again.
        await new Promise((resolve) => setTimeout(resolve, 5000));

        let aliceBalanceAfter = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(aliceAccountId)
            .execute(client);

        let feeCollectorBalanceAfter = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(operatorId)
            .execute(client);

        console.log(
            `Alice's balance before: ${aliceBalanceBefore.hbars.toString()} and after: ${aliceBalanceAfter.hbars.toString()}`,
        );

        console.log(
            `Fee collector's balance before: ${feeCollectorBalanceBefore.hbars.toString()} and after: ${feeCollectorBalanceAfter.hbars.toString()}`,
        );

        /*
         * Step 5:
         * Create a fungible token and transfer some tokens to alice
         */

        console.log("Create a token");

        const { tokenId } = await (
            await new TokenCreateTransaction()
                .setTokenName("revenue-generating token")
                .setTokenSymbol("RGT")
                .setTreasuryAccountId(client.operatorAccountId)
                .setDecimals(8)
                .setInitialSupply(100)
                .execute(client)
        ).getReceipt(client);
        // transfer token to alice
        console.log("Transferring the token to alice");

        await (
            await new TransferTransaction()
                .addTokenTransfer(tokenId, client.operatorAccountId, -1)
                .addTokenTransfer(tokenId, aliceAccountId, 1)
                .execute(client)
        ).getReceipt(client);

        /*
         * Step 6:
         * Update the topic to have a fee of the token.
         */
        console.log("Updating the topic to have a custom fee of the token");

        const customFeeToken = new CustomFixedFee()
            .setAmount(1)
            .setFeeCollectorAccountId(operatorId)
            .setDenominatingTokenId(tokenId);

        await (
            await new TopicUpdateTransaction()
                .setTopicId(topicId)
                .setCustomFees([customFeeToken])
                .execute(client)
        ).getReceipt(client);

        /*
         * Step 7:
         * Submit another message to that topic, paid by alice, without specifying max custom fee amount.
         */

        // This step compares token balances as well as HBAR, and the mirror
        // node balance query returns HBAR only — so these reads use
        // `AccountInfoQuery`, whose `tokenRelationships` carry both.
        // MirrorNodeAccountBalanceQuery does not return token balances, so it is not used here.
        const aliceInfoBefore = await new AccountInfoQuery()
            .setAccountId(aliceAccountId)
            .execute(client);

        const feeCollectorInfoBefore = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .execute(client);

        console.log("Submitting a message as alice to the topic");
        client.setOperator(aliceAccountId, aliceKey);

        await (
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage("Μαματα ςι ε εδαλο")
                .execute(client)
        ).getReceipt(client);

        console.log("Message submitted successfully");
        client.setOperator(operatorId, operatorKey);
        /*
         * Step 8:
         * Verify alice was debited the new fee amount and the fee collector account was credited the amount.
         */

        const aliceInfoAfter = await new AccountInfoQuery()
            .setAccountId(aliceAccountId)
            .execute(client);

        const feeCollectorInfoAfter = await new AccountInfoQuery()
            .setAccountId(operatorId)
            .execute(client);

        console.log(
            `Alice's hbars balance before: ${aliceInfoBefore.balance.toString()} and after: ${aliceInfoAfter.balance.toString()}`,
        );

        console.log(
            `Fee collector's hbars balance before: ${feeCollectorInfoBefore.balance.toString()} and after: ${feeCollectorInfoAfter.balance.toString()}`,
        );

        console.log(
            `Alice's token balance before: ${aliceInfoBefore.tokenRelationships
                .get(tokenId.toString())
                ?.balance.toString()} and after: ${aliceInfoAfter.tokenRelationships.get(tokenId.toString())?.balance.toString()}`,
        );

        console.log(
            `Fee collector's token balance before: ${feeCollectorInfoBefore.tokenRelationships
                .get(tokenId.toString())
                ?.balance.toString()} and after: ${feeCollectorInfoAfter.tokenRelationships.get(tokenId.toString())?.balance.toString()}`,
        );

        /*
         * Step 9:
         * Create account - bob
         */

        console.log("Creating account - bob");

        const bobKey = PrivateKey.generateECDSA();

        const { accountId: bobAccountId } = await (
            await new AccountCreateTransaction()
                .setMaxAutomaticTokenAssociations(-1)
                .setKeyWithoutAlias(bobKey)
                .setInitialBalance(new Hbar(10))
                .setMaxAutomaticTokenAssociations(100)

                .execute(client)
        ).getReceipt(client);

        console.log(`Bob's account ID: ${bobAccountId.toString()}`);

        /*
         * Step 10:
         * Update the topic’s fee exempt keys and add bob’s public key.
         */

        console.log("Updating the topic to have bob as a fee exempt key");

        await (
            await new TopicUpdateTransaction()
                .setTopicId(topicId)
                .addFeeExemptKey(bobKey)
                .execute(client)
        ).getReceipt(client);

        /*
         * Step 11:
         * Submit another message to that topic, paid with bob, without specifying max custom fee amount.
         */

        // The account above was only just created and funded. The mirror node
        // ingests consensus state asynchronously, so wait for it to see the
        // account — otherwise it reports a zero balance for a funded account.
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // HBAR only again, so the mirror node serves this one too.
        const bobBalanceBefore = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(bobAccountId)
            .execute(client);

        client.setOperator(bobAccountId, bobKey);

        console.log("Submitting a message as bob to the topic");

        await (
            await new TopicMessageSubmitTransaction()
                .setTopicId(topicId)
                .setMessage("Hello, Hedera™ hashgraph!")
                .execute(client)
        ).getReceipt(client);

        console.log("Message submitted successfully");

        client.setOperator(operatorId, operatorKey);

        /*
         * Step 12:
         * Verify bob was not debited the fee amount.
         */
        // The mirror node ingests consensus state asynchronously, so give it a
        // moment to catch up before reading the balances again.
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const bobBalanceAfter = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(bobAccountId)
            .execute(client);

        console.log(
            `Bob's hbars balance before: ${bobBalanceBefore.hbars.toString()} and after: ${bobBalanceAfter.hbars.toString()}`,
        );
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
}

void main();
