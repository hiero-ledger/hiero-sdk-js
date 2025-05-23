import {
    AccountCreateTransaction,
    AccountId,
    Hbar,
    PrivateKey,
    Client,
    SignatureMap,
    TransferTransaction,
    TransactionId,
    FileCreateTransaction,
    FileAppendTransaction,
    FileContentsQuery,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

const bigContents = Array(1000).fill("Lorem ipsum dolor sit amet. ").join("");

dotenv.config();

/**
 * Signs the provided data using a Hardware Security Module (HSM).
 * This is a placeholder function that should be replaced with actual HSM SDK logic.
 * @param {PrivateKey} key - Private key for signing
 * @param {Uint8Array} bodyBytes - The data to be signed
 * @returns {Promise<Uint8Array>} - The generated signature
 */
function hsmSign(key, bodyBytes) {
    // This is a placeholder function that resembles the HSM signing process.
    const signature = key.sign(bodyBytes);
    return Promise.resolve(signature);
}

async function main() {
    if (process.env.OPERATOR_ID == null || process.env.OPERATOR_KEY == null) {
        throw new Error(
            "Environment variables OPERATOR_ID, and OPERATOR_KEY are required.",
        );
    }
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    // eslint-disable-next-line deprecation/deprecation
    const operatorKey = PrivateKey.fromString(process.env.OPERATOR_KEY);
    const networkName = process.env.HEDERA_NETWORK;

    const client = Client.forName(networkName).setOperator(
        operatorId,
        operatorKey,
    );

    try {
        /**
         * Step 1: Create accounts for the transfer
         */
        const senderPrivateKey = PrivateKey.generateECDSA();
        const receiverPrivateKey = PrivateKey.generateECDSA();

        const senderId = (
            await (
                await new AccountCreateTransaction()
                    .setECDSAKeyWithAlias(senderPrivateKey)
                    .setInitialBalance(new Hbar(10))
                    .freezeWith(client)
                    .execute(client)
            ).getReceipt(client)
        ).accountId;

        const receiverId = (
            await (
                await new AccountCreateTransaction()
                    .setECDSAKeyWithAlias(receiverPrivateKey)
                    .setInitialBalance(new Hbar(1))
                    .freezeWith(client)
                    .execute(client)
            ).getReceipt(client)
        ).accountId;

        /**
         * Example 1: Single Node Transaction
         *
         * This example demonstrates how to sign a transaction body bytes
         * using an HSM for a single node transaction.
         */
        console.log("---Example 1: Single Node Transaction---");

        const nodeAccountId = /** @type {AccountId} */ (
            Object.values(client.network)[0]
        );

        const singleNodeTx = new TransferTransaction()
            .addHbarTransfer(senderId, Hbar.fromTinybars(-100))
            .addHbarTransfer(receiverId, Hbar.fromTinybars(100))
            .setNodeAccountIds([nodeAccountId])
            .setTransactionId(TransactionId.generate(senderId))
            .freezeWith(client);

        // Get the transaction body bytes for signing
        const singleNodeSignableBodyBytesList =
            singleNodeTx.signableNodeBodyBytesList;
        const singleNodeSignatureMap = new SignatureMap();

        const signableBodyBytes = singleNodeSignableBodyBytesList[0];

        const signature = await hsmSign(
            senderPrivateKey,
            signableBodyBytes.signableTransactionBodyBytes,
        );

        singleNodeSignatureMap.addSignature(
            signableBodyBytes.nodeAccountId,
            signableBodyBytes.transactionId,
            senderPrivateKey.publicKey,
            signature,
        );

        // Add the signature map to the transaction
        singleNodeTx.addSignature(
            senderPrivateKey.publicKey,
            singleNodeSignatureMap,
        );

        // Execute the transaction
        const singleNodeResponse = await singleNodeTx.execute(client);
        const singleNodeReceipt = await singleNodeResponse.getReceipt(client);

        console.log(
            "Single node transaction status:",
            singleNodeReceipt.status.toString(),
        );

        /**
         * Example 2: Multi-Node Batched Transaction
         * Note: This is example makes sense only in a multi-node environment (testnet, mainnet, etc).
         * Node Accounts will be 3 on testnet, 9 on mainnet and 1 on localhost.
         *
         * This example demonstrates how to sign transaction body bytes
         * using an HSM for a multi-node batched transaction.
         */
        console.log("\n---Example 2: Multi-Node Batched Transaction---");

        const fileId = (
            await (
                await (
                    await new FileCreateTransaction()
                        .setKeys([senderPrivateKey.publicKey])
                        .setContents("[e2e::FileCreateTransaction]")
                        .setMaxTransactionFee(new Hbar(5))
                        .freezeWith(client)
                        .sign(senderPrivateKey)
                ).execute(client)
            ).getReceipt(client)
        ).fileId;

        console.log(`Created file with ID: ${fileId.toString()}`);

        const multiNodeTx = new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(bigContents)
            .setMaxTransactionFee(new Hbar(5))
            .setTransactionId(TransactionId.generate(senderId))
            .freezeWith(client);

        const allAvailableNodeAccountIds = /** @type {AccountId[]} */ (
            Object.values(client.network)
        );

        console.log(
            `Signing transaction with HSM for nodes: ${allAvailableNodeAccountIds
                .map((id) => id.toString())
                .join(", ")}`,
        );

        // Get the transaction body bytes for each node
        const multiNodeSignableBodyBytesList =
            multiNodeTx.signableNodeBodyBytesList;
        const multiNodeSignatureMap = new SignatureMap();

        // Sign the transaction body bytes for each node using HSM and add the signatures to the signature map
        for (const {
            nodeAccountId,
            transactionId,
            signableTransactionBodyBytes,
        } of multiNodeSignableBodyBytesList) {
            const nodeSignature = await hsmSign(
                senderPrivateKey,
                signableTransactionBodyBytes,
            );

            multiNodeSignatureMap.addSignature(
                nodeAccountId,
                transactionId,
                senderPrivateKey.publicKey,
                nodeSignature,
            );
        }

        // Add the signature map to the transaction
        multiNodeTx.addSignature(
            senderPrivateKey.publicKey,
            multiNodeSignatureMap,
        );

        // Execute the transaction
        const multiNodeResponse = await multiNodeTx.execute(client);
        const multiNodeReceipt = await multiNodeResponse.getReceipt(client);
        console.log(
            "Multi-node file append transaction status:",
            multiNodeReceipt.status.toString(),
        );

        // Verify the contents were appended
        const contents = await new FileContentsQuery()
            .setFileId(fileId)
            .execute(client);

        console.log(
            `File content length according to \`FileContentsQuery\`: ${contents.length}`,
        );
    } catch (error) {
        console.error(error);
    }

    client.close();
}

void main();
