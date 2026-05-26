import {
    Client,
    AccountId,
    PrivateKey,
    KeyList,
    TopicCreateTransaction,
    TopicUpdateTransaction,
    TopicDeleteTransaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to create and manage an HCS topic using a threshold key as the adminKey
 * and going through a key rotation to a new set of keys.
 *
 * Create a new HCS topic with a 2-of-3 threshold key for the Admin Key and
 * update the HCS topic to a 3-of-4 threshold key for the adminKey.
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

    console.log("Topic With Admin (Threshold) Key Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // Step 1: Generate the initial admin key pairs (3 keys, 2-of-3 threshold).
    console.log("Generating ECDSA key pairs...");
    const initialAdminKeys = Array.from({ length: 3 }, () =>
        PrivateKey.generateECDSA(),
    );
    const initialAdminPublicKeys = initialAdminKeys.map((k) => k.publicKey);

    // Step 2: Build the threshold key.
    console.log("Creating a Key List (threshold key)...");
    const thresholdKey = new KeyList(initialAdminPublicKeys, 2);
    console.log(`Created a Key List: ${thresholdKey.toString()}`);

    // Step 3: Create the topic create transaction.
    console.log("Creating topic create transaction...");
    let topicCreateTx = new TopicCreateTransaction()
        .setTopicMemo("demo topic")
        .setAdminKey(thresholdKey)
        .freezeWith(client);

    // Step 4: Sign with 2 of 3 admin keys.
    for (let i = 0; i < 2; i++) {
        console.log(
            `Signing topic create transaction with key ${initialAdminKeys[i].toString()}`,
        );
        topicCreateTx = await topicCreateTx.sign(initialAdminKeys[i]);
    }

    // Step 5: Execute.
    const topicCreateResponse = await topicCreateTx.execute(client);
    const topicId = (await topicCreateResponse.getReceipt(client)).topicId;
    console.log(
        `Created new topic (${topicId.toString()}) with 2-of-3 threshold key as admin key.`,
    );

    // Step 6: Generate the new admin key pairs (4 keys, 3-of-4 threshold).
    console.log("Generating new ECDSA key pairs...");
    const newAdminKeys = Array.from({ length: 4 }, () =>
        PrivateKey.generateECDSA(),
    );
    const newAdminPublicKeys = newAdminKeys.map((k) => k.publicKey);

    // Step 7: Build the new threshold key.
    console.log("Creating new Key List (threshold key)...");
    const newThresholdKey = new KeyList(newAdminPublicKeys, 3);
    console.log(`Created new Key List: ${newThresholdKey.toString()}`);

    // Step 8: Create the topic update transaction.
    console.log("Creating topic update transaction...");
    let topicUpdateTx = new TopicUpdateTransaction()
        .setTopicId(topicId)
        .setTopicMemo("This topic will be updated")
        .setAdminKey(newThresholdKey)
        .freezeWith(client);

    // Step 9a: Sign with 2 of the OLD admin keys (authorize the change).
    for (let i = 0; i < 2; i++) {
        console.log(
            `Signing topic update transaction with initial admin key ${initialAdminKeys[i].toString()}`,
        );
        topicUpdateTx = await topicUpdateTx.sign(initialAdminKeys[i]);
    }

    // Step 9b: Sign with 3 of the NEW admin keys (prove possession).
    for (let i = 0; i < 3; i++) {
        console.log(
            `Signing topic update transaction with new admin key ${newAdminKeys[i].toString()}`,
        );
        topicUpdateTx = await topicUpdateTx.sign(newAdminKeys[i]);
    }

    // Step 10: Execute the update.
    const topicUpdateResponse = await topicUpdateTx.execute(client);
    await topicUpdateResponse.getReceipt(client);
    console.log(
        `Updated topic (${topicId.toString()}) with 3-of-4 threshold key as admin key.`,
    );

    // Cleanup: delete the topic, signed with 3 of 4 new admin keys.
    let topicDeleteTx = new TopicDeleteTransaction()
        .setTopicId(topicId)
        .freezeWith(client);
    for (let i = 0; i < 3; i++) {
        topicDeleteTx = await topicDeleteTx.sign(newAdminKeys[i]);
    }
    await (await topicDeleteTx.execute(client)).getReceipt(client);

    client.close();

    console.log("Topic With Admin (Threshold) Key Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
