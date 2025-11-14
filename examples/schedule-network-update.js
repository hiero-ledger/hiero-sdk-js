import { AccountId, Client, PrivateKey } from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

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

    /*
     * Step 1: Initialize the client.
     * Note: By default, the first network address book update will be triggered after 24 hours,
     * and subsequent updates will occur every 24 hours.
     * This is controlled by `networkUpdatePeriod`, which defaults to 86400000 milliseconds or 24 hours.
     */
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    console.log(
        `Client initialized for network: ${client.ledgerId.toString()}`,
    );

    // Step 2: Examine the default network update period

    let networkUpdateInMinutes = client.networkUpdatePeriod / (1000 * 60);

    let networkUpdateInHours = client.networkUpdatePeriod / (1000 * 60 * 60);

    console.log(
        `The current default network update period is: ${networkUpdateInMinutes} minutes or ${networkUpdateInHours.toFixed(2)} hours.`,
    );

    /*
     * Step 3: Update the address book of the client
     * Note: This is optional, but it is recommended to keep the client with updated address book.
     * This works only in node.js environment. For the browser client, the address book is handled by GRPC Web proxies.
     */

    console.log("Updating the address book of the client...");

    await client.updateNetwork();

    console.log("Address book updated successfully.");

    /*
     * Step 3: Change network update period to 1 hour
     */

    console.log("Changing network update period to 1 hour...");
    const oneHourInMs = 1 * 60 * 60 * 1000;

    client.setNetworkUpdatePeriod(oneHourInMs);

    // Step 4: Examine the new network update period

    networkUpdateInMinutes = client.networkUpdatePeriod / (1000 * 60);

    networkUpdateInHours = client.networkUpdatePeriod / (1000 * 60 * 60);

    console.log(
        `The current network update period is: ${networkUpdateInMinutes} minutes or ${networkUpdateInHours.toFixed(2)} hours.`,
    );

    client.close();
}

void main();
