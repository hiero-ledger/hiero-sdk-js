import {
    PrivateKey,
    Client,
    AccountId,
    AccountCreateTransaction,
    Status,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

const OPERATOR_ID = AccountId.fromString(process.env.OPERATOR_ID);
const OPERATOR_KEY = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
const HEDERA_NETWORK = process.env.HEDERA_NETWORK;

async function main() {
    // Step 0: Create and configure the SDK Client.
    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    // Step 1: Generate private key for a future account create transaction
    const key = PrivateKey.generateED25519();

    // Step 2: Create transaction without signing it
    const tx = new AccountCreateTransaction()
        .setKeyWithoutAlias(key.publicKey)
        .freezeWith(client);

    // Step 3: Sign transaction using your private key
    const signature = key.signTransaction(tx, true);

    // Step 4: add the generated signature to transaction
    // it will use the old legacy way because of the type of signature
    tx.addSignature(key.publicKey, signature);

    // Step 5: get the outcome of the transaction
    const { status } = await (await tx.execute(client)).getReceipt(client);
    console.log("STATUS OF TRANSACTION IS", status.toString());

    client.close();
}

void main();
