import {
    Client,
    AccountId,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageQuery,
    TopicMessageSubmitTransaction,
    TopicDeleteTransaction,
    Transaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * How to send a large message to a private HCS topic and how to subscribe to
 * the topic to receive it.
 *
 * The message exceeds the per-transaction size limit, so the SDK automatically
 * splits it into multiple chunks under one logical operation. The subscriber
 * receives the reassembled message via the mirror node.
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
        "Consensus Service Submit Large Message And Subscribe Example Start!",
    );

    // Load the ~14KB lorem-ipsum fixture from disk.
    /** @type {string} */
    const largeMessage = await readFile(
        join(__dirname, "large_message.txt"),
        "utf8",
    );

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const operatorPublicKey = operatorKey.publicKey;
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: Generate ED25519 key pair (Submit Key for the topic).
    console.log("Generating ED25519 key pair...");
    const submitPrivateKey = PrivateKey.generateED25519();
    const submitPublicKey = submitPrivateKey.publicKey;

    // Step 2: Create the topic with admin + submit keys.
    console.log("Creating new topic...");
    const topicId = (
        await (
            await new TopicCreateTransaction()
                .setTopicMemo("hedera-sdk-js/ConsensusPubSubChunkedExample")
                .setAdminKey(operatorPublicKey)
                .setSubmitKey(submitPublicKey)
                .execute(client)
        ).getReceipt(client)
    ).topicId;
    console.log(`Created new topic with ID: ${topicId.toString()}`);

    // Step 3: Wait for the new topic to propagate to mirror nodes.
    console.log(
        "Wait 5 seconds (to ensure data propagated to mirror nodes) ...",
    );
    await setTimeout(5000);

    // Step 4: Subscribe to the topic. The latch fires after the first
    // (reassembled) message arrives.
    console.log("Setting up a mirror client...");
    /** @type {(value?: void | PromiseLike<void>) => void} */
    let latchResolve;
    const latch = new Promise((resolve) => {
        latchResolve = resolve;
    });

    new TopicMessageQuery().setTopicId(topicId).subscribe(
        client,
        (_message, error) => {
            if (error != null) console.error(error);
        },
        (message) => {
            console.log(
                `Topic message received! | Time: ${message.consensusTimestamp.toString()} | Sequence No.: ${message.sequenceNumber.toString()} | Size: ${message.contents.length} bytes.`,
            );
            latchResolve();
        },
    );

    // Step 5: Build, sign with operator, serialize, deserialize, sign with
    // submit key, execute. The bytes round-trip mirrors the pattern where
    // the operator and the submit-key holder are different parties.
    const builtTx = new TopicMessageSubmitTransaction()
        // Default is 10 chunks; increase so a large message will fit.
        .setMaxChunks(15)
        .setTopicId(topicId)
        .setMessage(largeMessage);

    // The operator signs first (charged the transaction fee).
    const operatorSignedTx = await builtTx.signWithOperator(client);

    // Serialize so the bytes can be signed "somewhere else" by the submit key.
    const transactionBytes = operatorSignedTx.toBytes();
    const parsedTx = Transaction.fromBytes(transactionBytes);

    console.log(
        `Preparing to submit a message to the created topic (size of the message: ${largeMessage.length} bytes)...`,
    );

    // Sign with the submit key (required because the topic has a submitKey).
    const signedTx = await parsedTx.sign(submitPrivateKey);

    // Submit the chunked message and wait for the receipt.
    await (await signedTx.execute(client)).getReceipt(client);

    // Wait up to 60s for the reassembled message to arrive via the mirror.
    const timeoutPromise = setTimeout(60_000).then(() => {
        throw new Error("Large topic message was not received! (Fail)");
    });
    await Promise.race([latch, timeoutPromise]);

    // Cleanup: delete the topic.
    await (
        await new TopicDeleteTransaction().setTopicId(topicId).execute(client)
    ).getReceipt(client);

    client.close();

    console.log(
        "Consensus Service Submit Large Message And Subscribe Example Complete!",
    );
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
