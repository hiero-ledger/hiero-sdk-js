import {
    Client,
    PrivateKey,
    FileCreateTransaction,
    FileDeleteTransaction,
    FileInfoQuery,
    Hbar,
    HbarUnit,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to create a file under a non-operator key, delete it (signing with that
 * key), and verify the deletion via FileInfoQuery.
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

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        process.env.OPERATOR_ID,
        process.env.OPERATOR_KEY,
    );

    // Generate the key to be used with the new file (separate from operator).
    const newKey = PrivateKey.generateECDSA();

    console.log("Creating a file to delete:");

    // Create a file with newKey as its only key — operator pays the tx fee but
    // newKey is required to delete or modify the file.
    const createResponse = await (
        await new FileCreateTransaction()
            .setContents("The quick brown fox jumps over the lazy dog")
            .setKeys([newKey.publicKey])
            .setTransactionMemo("js sdk example delete-file.js")
            .setMaxTransactionFee(Hbar.from(8, HbarUnit.Hbar))
            .freezeWith(client)
            .sign(newKey)
    ).execute(client);

    const fileId = (await createResponse.getReceipt(client)).fileId;
    console.log(`file = ${fileId.toString()}`);
    console.log("deleting created file");

    // Delete the file — must be signed with newKey since it's the file's key.
    const deleteResponse = await (
        await new FileDeleteTransaction()
            .setFileId(fileId)
            .freezeWith(client)
            .sign(newKey)
    ).execute(client);

    const deleteReceipt = await deleteResponse.getReceipt(client);
    console.log(
        `file delete transaction status: ${deleteReceipt.status.toString()}`,
    );

    // Querying file info on a deleted file returns isDeleted=true.
    const info = await new FileInfoQuery().setFileId(fileId).execute(client);
    console.log(
        `file ${fileId.toString()} was deleted: ${String(info.isDeleted)}`,
    );

    client.close();
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
