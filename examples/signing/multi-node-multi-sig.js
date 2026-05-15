import {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    Hbar,
    AccountId,
    KeyList,
    TransferTransaction,
    Transaction,
} from "@hiero-ledger/sdk";

import dotenv from "dotenv";

dotenv.config();

/**
 * @description Create a transaction with multiple nodes and multiple signatures
 */
async function main() {
    /**
     *
     *  Step 1: Create Client
     *
     */

    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required.",
        );
    }

    const client = Client.forName(process.env.HEDERA_NETWORK).setOperator(
        AccountId.fromString(process.env.OPERATOR_ID),
        PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY),
    );

    /**
     *
     * Step 2: Create keys for two users
     *
     */

    const aliceKey = PrivateKey.generate();
    const bobKey = PrivateKey.generate();

    const keyList = new KeyList([aliceKey.publicKey, bobKey.publicKey]);

    /**
     *
     * Step 3: Create an account with the keyList
     *
     */

    const createAccountTransaction = new AccountCreateTransaction()
        .setInitialBalance(new Hbar(2))
        .setKeyWithoutAlias(keyList);

    const createResponse = await createAccountTransaction.execute(client);
    const createReceipt = await createResponse.getReceipt(client);

    /**
     *
     * Step 4: Create a transfer transaction with multiple nodes
     *
     */
    const transferTransaction = new TransferTransaction()
        .addHbarTransfer(createReceipt.accountId, new Hbar(-1))
        .addHbarTransfer("0.0.3", new Hbar(1))
        // Set multiple nodes
        .setNodeAccountIds([
            new AccountId(3),
            new AccountId(4),
            new AccountId(5),
        ])
        .freezeWith(client);

    /**
     *
     * Step 5:  Serialize the transaction
     *  & Collect multiple signatures (Uint8Array[]) from one key
     *
     */

    const transferTransactionBytes = transferTransaction.toBytes();

    const aliceSignatures = aliceKey.signTransaction(transferTransaction);
    const bobSignatures = bobKey.signTransaction(transferTransaction);

    /**
     *
     * Step 6:  Deserialize the transaction
     *  & Add the previously collected signatures
     *
     */

    const signedTransaction = Transaction.fromBytes(transferTransactionBytes);

    signedTransaction.addSignature(aliceKey.publicKey, aliceSignatures);
    signedTransaction.addSignature(bobKey.publicKey, bobSignatures);

    console.log("ADDED users signatures below: \n");

    const aliceFlatSigs = aliceSignatures.getFlatSignatureList();
    console.log(
        "Alice Signatures =>",
        aliceFlatSigs.map((aliceSig) => {
            const aliceSigBytes = aliceSig.get(aliceKey.publicKey);
            return PrivateKey.fromBytes(aliceSigBytes).toStringDer();
        }),
    );

    const bobFlatSigs = bobSignatures.getFlatSignatureList();
    console.log(
        "Bob Signatures =>",
        bobFlatSigs.map((bobSig) => {
            const bobSigBytes = bobSig.get(bobKey.publicKey);
            return PrivateKey.fromBytes(bobSigBytes).toStringDer();
        }),
    );

    const signaturesInTheTransactionBefore =
        getAllSignaturesFromTransaction(signedTransaction);

    console.log("\n\nSignatures in the transaction: ");
    console.log(signaturesInTheTransactionBefore);

    /**
     *
     * Step 7: Execute and take the receipt
     *
     */

    const result = await signedTransaction.execute(client);

    const receipt = await result.getReceipt(client);

    console.log(`\n  \nTransaction status: ${receipt.status.toString()}`);

    client.close();
}

void main();

/**
 * Extracts all signatures from a signed transaction.
 * @param {Transaction} signedTransaction - The signed transaction object containing the list of signed transactions.
 * @returns {string[]} An array of signatures in DER format.
 */

const getAllSignaturesFromTransaction = (signedTransaction) => {
    /** @type {string[]} */

    const signatures = [];

    signedTransaction._signedTransactions.list.forEach((transaction) => {
        if (transaction.sigMap?.sigPair) {
            transaction.sigMap.sigPair.forEach((sigPair) => {
                if (sigPair.ed25519) {
                    signatures.push(
                        PrivateKey.fromBytesECDSA(
                            sigPair.ed25519,
                        ).toStringDer(),
                    );
                } else if (sigPair.ECDSASecp256k1) {
                    signatures.push(
                        PrivateKey.fromBytesECDSA(
                            sigPair.ECDSASecp256k1,
                        ).toStringDer(),
                    );
                }
            });
        }
    });

    return signatures;
};
