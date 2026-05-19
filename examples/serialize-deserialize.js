import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    AccountCreateTransaction,
    AccountDeleteTransaction,
    TransferTransaction,
    Transaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * How to serialize and deserialize a transaction, sign it, and execute it.
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

    console.log("Serialize / Deserialize Transaction Example Start!");

    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);
    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        operatorId,
        operatorKey,
    );
    console.log(
        `Connected to ${process.env.HEDERA_NETWORK} as operator ${operatorId.toString()}.`,
    );

    // Create Alice — the recipient.
    console.log("Creating Alice account (recipient)...");
    const aliceKey = PrivateKey.generateECDSA();
    const aliceId = (
        await (
            await new AccountCreateTransaction()
                .setKeyWithoutAlias(aliceKey.publicKey)
                .setInitialBalance(new Hbar(2))
                .execute(client)
        ).getReceipt(client)
    ).accountId;
    console.log(`Alice account created: ${aliceId.toString()}`);

    // 1. Build and freeze the transaction.
    console.log(
        "Building and freezing a 1 ℏ transfer from Alice to operator...",
    );
    const built = new TransferTransaction()
        .addHbarTransfer(aliceId, new Hbar(1).negated())
        .addHbarTransfer(operatorId, new Hbar(1))
        .freezeWith(client);

    // 2. Serialize to bytes.
    const bytes = built.toBytes();
    console.log(`Serialized transaction → ${bytes.length} bytes.`);

    // 3. Deserialize from bytes.
    const received = Transaction.fromBytes(bytes);
    console.log(`Deserialized`);

    // After deserialize, you can also:
    //   - received.sign(anotherKey)                          // add another signature
    //   - received.setNodeAccountIds([new AccountId(3)])     // pin to a specific node
    //   - received.setTransactionId(newTxId)                 // re-stamp the tx ID
    //   - received.addHbarTransfer(id, amount)               // mutate the transfer list
    //   - received.setFileMemo("...") / setTopicMemo(...)    // mutate type-specific body fields
    // If you mutate, call received.freezeWith(client) again before signing.
    //
    // You can also sign BEFORE toBytes — signatures persist through the round-trip,
    // so the receiving side doesn't need to re-sign.
    //
    // A transaction can be round-tripped multiple times — each toBytes/fromBytes
    // pair preserves the state from the previous cycle.
    //
    // Signer / Provider API (external wallet, e.g. HashPack, WalletConnect):
    //   await received.freezeWithSigner(signer);
    //   await received.signWithSigner(signer);
    //   await received.executeWithSigner(signer);

    // 4. Sign with operator (fee payer) and alice (sender), then execute.
    console.log("Signing with operator (fee payer) and Alice (sender)...");
    await received.signWithOperator(client);
    const signed = await received.sign(aliceKey);
    const receipt = await (await signed.execute(client)).getReceipt(client);
    console.log(`Transfer executed. Status: ${receipt.status.toString()}.`);

    // Cleanup.
    console.log("Cleaning up Alice's account...");
    await (
        await (
            await new AccountDeleteTransaction()
                .setAccountId(aliceId)
                .setTransferAccountId(operatorId)
                .freezeWith(client)
                .sign(aliceKey)
        ).execute(client)
    ).getReceipt(client);

    client.close();
    console.log("Serialize / Deserialize Transaction Example Complete!");
}

void main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
