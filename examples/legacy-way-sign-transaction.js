import {
    PrivateKey,
    Client,
    AccountId,
    AccountCreateTransaction,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

const OPERATOR_ID = AccountId.fromString(process.env.OPERATOR_ID);
const OPERATOR_KEY = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
const HEDERA_NETWORK = process.env.HEDERA_NETWORK;

async function main() {
    // Step 0: Create and configure the SDK Client.
    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    // Step 1: Generate private key for a future account create transaction
    const key = PrivateKey.generateECDSA();

    // Step 2: Create transaction without signing it
    const tx = new AccountCreateTransaction()
        .setKeyWithoutAlias(key.publicKey)
        .freezeWith(client);

    // Step 3: Sign transaction using your private key
    // eslint-disable-next-line deprecation/deprecation
    const signature = key.signTransaction(tx, true);

    // Step 4: add the generated signature to transaction
    // it will use the old legacy way because of the type of signature
    // eslint-disable-next-line deprecation/deprecation
    tx.addSignature(key.publicKey, signature);

    // Step 5: get the outcome of the transaction
    const { status } = await (await tx.execute(client)).getReceipt(client);
    console.log("STATUS OF TRANSACTION IS", status.toString());

    client.close();
}

void main();
