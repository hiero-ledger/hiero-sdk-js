import {
    Client,
    PrivateKey,
    AccountId,
    FileCreateTransaction,
    FileDeleteTransaction,
    Hbar,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to create a file (operator-keyed) and clean up by deleting it.
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

    console.log("Create File Example Start!");

    // Parse the operator key once; reuse for setOperator and as the file's key.
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringDer(process.env.OPERATOR_KEY);
    const operatorPublicKey = operatorKey.publicKey;

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );

    // The file is required to be a byte array, but the SDK accepts a string and
    // encodes it as UTF-8 for you.
    const fileContents = "Hedera hashgraph is great!";

    console.log("Creating new file...");
    const fileCreateResponse = await new FileCreateTransaction()
        // Use the same key as the operator to "own" this file.
        .setKeys([operatorPublicKey])
        .setContents(fileContents)
        // The default max fee of 1 Hbar is not enough to create a file (~1.1 Hbar).
        .setMaxTransactionFee(new Hbar(2))
        .execute(client);

    const fileCreateReceipt = await fileCreateResponse.getReceipt(client);
    const newFileId = fileCreateReceipt.fileId;
    console.log(`Created new file with ID: ${newFileId.toString()}`);

    // Clean up: delete the created file.
    await (
        await new FileDeleteTransaction().setFileId(newFileId).execute(client)
    ).getReceipt(client);

    client.close();

    console.log("Create File Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
