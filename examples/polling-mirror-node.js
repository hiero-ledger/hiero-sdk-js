/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EventEmitter } from "events";
import {
    AccountId,
    Client,
    PrivateKey,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";
dotenv.config();

/* eslint-disable n/no-unsupported-features/node-builtins */

/**
 * @param {EventEmitter} dataEmitter
 * @param {string} topicId
 * @returns {Promise<void>}
 */
async function pollUntilReady(dataEmitter, topicId) {
    let lastMessagesLength = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const BASE_URL = "http://127.0.0.1:5551";
        const res = await fetch(
            `${BASE_URL}/api/v1/topics/${topicId}/messages?limit=1`,
        );

        /**
         * data.messages is an array of objects with a message property
         * @type {{messages: { message: string }[]}}
         */
        const data = await res.json();

        // Check if we have new messages (array length changed)
        const currentMessagesLength = data.messages ? data.messages.length : 0;

        if (currentMessagesLength > lastMessagesLength) {
            // Get the latest message(s) - they are raw base64 encoded strings
            const newMessages = data.messages.slice(lastMessagesLength)[0];
            const decodedMessage = Buffer.from(
                newMessages.message,
                "base64",
            ).toString("utf-8");
            dataEmitter.emit("newMessages", decodedMessage);
            lastMessagesLength = currentMessagesLength;
        }
        await sleep(1000);
    }
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    // Set up client
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
    const client = Client.forLocalNode().setOperator(operatorId, operatorKey);

    // Set up event emitter
    const dataEmitter = new EventEmitter();
    /**
     * @param {Buffer} data
     */
    dataEmitter.on("newMessages", (data) => {
        if (typeof data === "string") {
            console.log("Decoded message:", data);
        } else {
            console.log("Couldn't properly decode message.");
        }
    });

    // create a topic and send a message to network
    const topicCreateTransaction = new TopicCreateTransaction().setAdminKey(
        operatorKey,
    );
    const topicCreateReceipt = await topicCreateTransaction.execute(client);
    const topicId = (await topicCreateReceipt.getReceipt(client)).topicId;
    console.log(`Topic created with ID: ${topicId.toString()}`);

    await (
        await new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage("Hello, world!")
            .execute(client)
    ).getReceipt(client);

    // poll for data
    await pollUntilReady(dataEmitter, topicId.toString());
}

main().catch(console.error);
