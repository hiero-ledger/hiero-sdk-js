import {
    Client,
    AccountId,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageQuery,
    TopicMessageSubmitTransaction,
    TopicDeleteTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";
import { setTimeout } from "node:timers/promises";

dotenv.config();

const TOTAL_MESSAGES = 5;

/**
 * How to operate with a private HCS topic.
 *
 * Create a new HCS topic with a single ECDSA Submit Key,
 * publish a number of messages to the topic signed by the Submit Key
 * and subscribe to the topic (no key required).
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, OPERATOR_KEY, and HEDERA_NETWORK are required.",
        );
    }

    console.log(
        "Consensus Service Submit Message To The Private Topic And Subscribe Example Start!",
    );

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const operatorPublicKey = operatorKey.publicKey;

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: Generate ECDSA key pair (Submit Key for the topic).
    console.log("Generating ECDSA key pair...");
    const submitPrivateKey = PrivateKey.generateECDSA();
    const submitPublicKey = submitPrivateKey.publicKey;

    // Step 2: Create the topic with admin + submit keys.
    console.log("Creating new HCS topic...");
    const topicCreateResponse = await new TopicCreateTransaction()
        .setTopicMemo("HCS topic with Submit Key")
        .setAdminKey(operatorPublicKey)
        .setSubmitKey(submitPublicKey)
        .execute(client);

    const topicId = (await topicCreateResponse.getReceipt(client)).topicId;
    console.log(
        `Created topic with ID: ${topicId.toString()} and public ECDSA submit key: ${submitPrivateKey.toString()}`,
    );

    // Step 3: Wait for the new topic to propagate to mirror nodes.
    console.log(
        "Wait 5 seconds (to ensure data propagated to mirror nodes) ...",
    );
    await setTimeout(5000);

    // Step 4: Subscribe to the topic. Track how many messages we've seen.
    console.log("Setting up a mirror client...");
    let received = 0;
    /** @type {(value?: void | PromiseLike<void>) => void} */
    let latchResolve;
    const latch = new Promise((resolve) => {
        latchResolve = resolve;
    });

    new TopicMessageQuery()
        .setTopicId(topicId)
        .setStartTime(0)
        .subscribe(
            client,
            (_message, error) => {
                if (error != null) console.error(error);
            },
            (message) => {
                const text = Buffer.from(message.contents).toString("utf8");
                console.log(
                    `Topic message received! | Time: ${message.consensusTimestamp.toString()} | Content: ${text}`,
                );
                received += 1;
                if (received >= TOTAL_MESSAGES) latchResolve();
            },
        );

    // Step 5: Publish messages, signing each with the submit key.
    for (let i = 0; i < TOTAL_MESSAGES; i++) {
        const message = `random message ${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;
        console.log(`Publishing message to the topic: ${message}`);

        const submitTx = await new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage(message)
            .freezeWith(client)
            // The transaction is implicitly signed by the operator (payer).
            // The topic has a submitKey requirement — sign with that key too.
            .sign(submitPrivateKey);
        const submitResponse = await submitTx.execute(client);
        await submitResponse.getReceipt(client);

        await setTimeout(2000);
    }

    // Wait up to 60s to receive all messages, fail otherwise.
    const timeoutPromise = setTimeout(60_000).then(() => {
        throw new Error("Not all topic messages were received! (Fail)");
    });
    await Promise.race([latch, timeoutPromise]);

    // Cleanup: delete created topic.
    await (
        await new TopicDeleteTransaction().setTopicId(topicId).execute(client)
    ).getReceipt(client);

    client.close();

    console.log(
        "Consensus Service Submit Message To The Private Topic And Subscribe Example Complete!",
    );
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
