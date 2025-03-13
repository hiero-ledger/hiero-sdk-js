import {
    PrivateKey,
    Client,
    AccountId,
    AccountCreateTransaction,
    Status,
    KeyList,
    TransferTransaction,
    Hbar,
} from "@hashgraph/sdk";

import dotenv from "dotenv";

dotenv.config();

const OPERATOR_ID = AccountId.fromString(process.env.OPERATOR_ID);
const OPERATOR_KEY = PrivateKey.fromStringED25519(process.env.OPERATOR_KEY);
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || "testnet";

async function main() {
    // Step 0: Create and configure the SDK Client.
    const client = Client.forName(HEDERA_NETWORK);
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);

    // Step 1: Generate private key for a future account create transaction
    const key1 = PrivateKey.generateED25519();
    const key2 = PrivateKey.generateED25519();
    const key3 = PrivateKey.generateED25519();
    const key4 = PrivateKey.generateED25519();
    const key5 = PrivateKey.generateED25519();
    const recipient = PrivateKey.generateED25519().publicKey;

    const keyList = new KeyList(
        [
            key1.publicKey,
            key2.publicKey,
            key3.publicKey,
            key4.publicKey,
            key5.publicKey,
        ],
        2,
    );

    // Step 2: Create transaction without signing it
    const { accountId } = await (
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(keyList)
            .setInitialBalance(new Hbar(1))
            .freezeWith(client)
            .execute(client)
    ).getReceipt(client);

    const { accountId: recipientId2 } = await (
        await new AccountCreateTransaction()
            .setKeyWithoutAlias(recipient)
            .freezeWith(client)
            .execute(client)
    ).getReceipt(client);

    const transferTx = new TransferTransaction()
        .addHbarTransfer(accountId, new Hbar(-1))
        .addHbarTransfer(recipientId2, new Hbar(1))
        .freezeWith(client);

    const signature1 = key1.signTransaction(transferTx, true);
    const signature2 = key2.signTransaction(transferTx);

    const { status } = await (
        await transferTx
            .addSignature(key1.publicKey, signature1)
            .addSignature(key2.publicKey, signature2)
            .execute(client)
    ).getReceipt(client);

    console.log("Status of transfer tx is", status.toString());

    client.close();
}

void main();
