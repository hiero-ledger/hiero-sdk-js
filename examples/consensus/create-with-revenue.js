import { TokenCreateTransaction } from "@hiero-ledger/sdk";
import { TopicUpdateTransaction } from "@hiero-ledger/sdk";
import { TransferTransaction } from "@hiero-ledger/sdk";
import {
    MirrorNodeTokenBalanceQuery,
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

        // Only the HBAR balance is compared in this step, so it is read from
        // the free mirror node rather than with a paid `AccountInfoQuery`.
        let aliceBalanceBefore = await hbarBalance(client, aliceAccountId);

        let feeCollectorBalanceBefore = await hbarBalance(client, operatorId);

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

        let aliceBalanceAfter = await hbarBalance(
            client,
            aliceAccountId,
            aliceBalanceBefore,
        );

        let feeCollectorBalanceAfter = await hbarBalance(
            client,
            operatorId,
            feeCollectorBalanceBefore,
        );

        console.log(
            `Alice's balance before: ${aliceBalanceBefore.toString()} and after: ${aliceBalanceAfter.toString()}`,
        );

        console.log(
            `Fee collector's balance before: ${feeCollectorBalanceBefore.toString()} and after: ${feeCollectorBalanceAfter.toString()}`,
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

        // This step charges a token fee, so both HBAR and token balances are
        // compared. HBAR comes from `MirrorNodeAccountBalanceQuery` and the
        // token balance from `MirrorNodeTokenBalanceQuery` — the mirror node
        // balance endpoint is HBAR-only.
        const aliceHbarBefore = await hbarBalance(client, aliceAccountId);
        const aliceTokenBefore = await tokenBalance(
            client,
            aliceAccountId,
            tokenId,
        );

        const feeCollectorHbarBefore = await hbarBalance(client, operatorId);
        const feeCollectorTokenBefore = await tokenBalance(
            client,
            operatorId,
            tokenId,
        );

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

        // Poll each read until the mirror node reflects the fee, rather than
        // guessing at a fixed delay.
        const aliceTokenAfter = await tokenBalance(
            client,
            aliceAccountId,
            tokenId,
            aliceTokenBefore,
        );
        const aliceHbarAfter = await hbarBalance(
            client,
            aliceAccountId,
            aliceHbarBefore,
        );

        const feeCollectorTokenAfter = await tokenBalance(
            client,
            operatorId,
            tokenId,
            feeCollectorTokenBefore,
        );
        const feeCollectorHbarAfter = await hbarBalance(
            client,
            operatorId,
            feeCollectorHbarBefore,
        );

        console.log(
            `Alice's hbars balance before: ${aliceHbarBefore.toString()} and after: ${aliceHbarAfter.toString()}`,
        );

        console.log(
            `Fee collector's hbars balance before: ${feeCollectorHbarBefore.toString()} and after: ${feeCollectorHbarAfter.toString()}`,
        );

        console.log(
            `Alice's token balance before: ${aliceTokenBefore.toString()} and after: ${aliceTokenAfter.toString()}`,
        );

        console.log(
            `Fee collector's token balance before: ${feeCollectorTokenBefore.toString()} and after: ${feeCollectorTokenAfter.toString()}`,
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

        // HBAR only again, so the mirror node serves this one too.
        const bobBalanceBefore = await hbarBalance(client, bobAccountId);

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
        const bobBalanceAfter = await hbarBalance(
            client,
            bobAccountId,
            bobBalanceBefore,
        );

        console.log(
            `Bob's hbars balance before: ${bobBalanceBefore.toString()} and after: ${bobBalanceAfter.toString()}`,
        );
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
}

/**
 * Read a token balance from the mirror node.
 *
 * `AccountInfoQuery.tokenRelationships` is deprecated as of HIP-367, so
 * `MirrorNodeTokenBalanceQuery` is the supported way to read one. Pass
 * `previous` to poll until the value moves; the loop is bounded so an example
 * cannot hang.
 *
 * @param {import("@hiero-ledger/sdk").Client} client
 * @param {import("@hiero-ledger/sdk").AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").TokenId | string} tokenId
 * @param {import("long")} [previous]
 * @returns {Promise<import("long")>}
 */
async function tokenBalance(client, accountId, tokenId, previous) {
    return untilMirror(async () => {
        const { balance } = await new MirrorNodeTokenBalanceQuery()
            .setAccountId(accountId)
            .setTokenId(tokenId)
            .execute(client);

        // Without a previous value there is nothing to wait for.
        if (previous == null) {
            return balance;
        }

        return balance.equals(previous) ? null : balance;
    });
}

/**
 * Read an HBAR balance from the mirror node.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Pass `previous` to
 * poll until the value moves; the loop is bounded so an example cannot hang.
 *
 * @param {import("@hiero-ledger/sdk").Client} client
 * @param {import("@hiero-ledger/sdk").AccountId | string} accountId
 * @param {import("@hiero-ledger/sdk").Hbar} [previous]
 * @returns {Promise<import("@hiero-ledger/sdk").Hbar>}
 */
async function hbarBalance(client, accountId, previous) {
    return untilMirror(async () => {
        const { hbars } = await new MirrorNodeAccountBalanceQuery()
            .setAccountId(accountId)
            .execute(client);

        // Without a previous value there is nothing to wait for.
        if (previous == null) {
            return hbars;
        }

        return hbars.toTinybars().equals(previous.toTinybars()) ? null : hbars;
    });
}

void main();

/**
 * Poll a mirror-node read until it reflects the transaction that just happened.
 *
 * The mirror node ingests consensus state asynchronously, so a read straight
 * after a transaction can still return the previous value. Polling to a deadline
 * beats a fixed sleep: it does not go flaky on a slow runner and does not waste
 * time on a fast one.
 *
 * @template T
 * @param {() => Promise<T | null>} read - resolves the value once it is ready
 * @param {number} [timeoutMs]
 * @returns {Promise<T>}
 */
async function untilMirror(read, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const result = await read();
        if (result != null) {
            return result;
        }
        if (Date.now() >= deadline) {
            throw new Error("mirror node did not ingest in time");
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}
